import type { ProductStatus } from "@repo/shared";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  notInArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { db as sharedDb, type Database, type Transaction } from "../client";
import {
  categories,
  productCategories,
  productImages,
  productOptions,
  productOptionValues,
  products,
  productVariants,
  variantOptionValues,
} from "../schema";
import { AdminRuleError } from "./users";

export type AdminProductFilters = {
  q?: string | undefined;
  status?: ProductStatus | undefined;
  categoryId?: string | undefined;
  stock?: "low" | "out" | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
};

const PRODUCT_ID = sql.raw(`"products"."id"`);

export async function listAdminProducts(f: AdminProductFilters, db: Database = sharedDb) {
  const where: (SQL | undefined)[] = [isNull(products.deletedAt)];
  if (f.status) where.push(eq(products.status, f.status));
  if (f.q?.trim()) {
    const like = `%${f.q.trim().replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    where.push(
      or(
        ilike(products.title, like),
        ilike(products.slug, like),
        sql`exists (select 1 from ${productVariants} v where v.product_id = ${PRODUCT_ID} and v.sku ilike ${like})`,
      ),
    );
  }
  if (f.categoryId) {
    where.push(
      sql`exists (select 1 from ${productCategories} pc where pc.product_id = ${PRODUCT_ID} and pc.category_id = ${f.categoryId})`,
    );
  }
  const stockExpr = sql<number>`(select coalesce(sum(v.stock_qty),0)::int from ${productVariants} v where v.product_id = ${PRODUCT_ID} and v.is_active)`;
  if (f.stock === "out") where.push(sql`${stockExpr} = 0`);
  if (f.stock === "low") where.push(sql`${stockExpr} between 1 and 5`);
  const cond = and(...where);

  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: products.id,
        slug: products.slug,
        title: products.title,
        status: products.status,
        isFeatured: products.isFeatured,
        updatedAt: products.updatedAt,
        image: sql<
          string | null
        >`(select i.url from ${productImages} i where i.product_id = ${PRODUCT_ID} order by i.sort_order limit 1)`,
        stock: stockExpr,
        variantCount: sql<number>`(select count(*)::int from ${productVariants} v where v.product_id = ${PRODUCT_ID})`,
        singleVariantId: sql<
          string | null
        >`(select case when count(*) = 1 then max(v.id::text) end from ${productVariants} v where v.product_id = ${PRODUCT_ID})`,
        minPrice: sql<number>`(select coalesce(min(v.price_cents), ${products.basePriceCents})::int from ${productVariants} v where v.product_id = ${PRODUCT_ID})`,
        maxPrice: sql<number>`(select coalesce(max(v.price_cents), ${products.basePriceCents})::int from ${productVariants} v where v.product_id = ${PRODUCT_ID})`,
        categoryNames: sql<
          string | null
        >`(select string_agg(c.name, ', ' order by c.sort_order) from ${productCategories} pc join ${categories} c on c.id = pc.category_id where pc.product_id = ${PRODUCT_ID})`,
      })
      .from(products)
      .where(cond)
      .orderBy(desc(products.updatedAt))
      .limit(Math.min(f.limit ?? 50, 200))
      .offset(f.offset ?? 0),
    db.select({ n: count() }).from(products).where(cond),
  ]);
  return { rows, total: total?.n ?? 0 };
}

/** Full product for the editor (including drafts/archived). */
export async function getAdminProduct(id: string, db: Database | Transaction = sharedDb) {
  const p = await db.query.products.findFirst({
    where: and(eq(products.id, id), isNull(products.deletedAt)),
    with: {
      images: { orderBy: [asc(productImages.sortOrder)] },
      options: {
        orderBy: [asc(productOptions.sortOrder)],
        with: { values: { orderBy: [asc(productOptionValues.sortOrder)] } },
      },
      variants: {
        orderBy: [asc(productVariants.sortOrder)],
        with: { optionValues: true, image: true },
      },
      categories: true,
    },
  });
  if (!p) return null;
  const valueById = new Map(p.options.flatMap((o) => o.values.map((v) => [v.id, v.value])));
  return {
    ...p,
    categoryIds: p.categories.map((c) => c.categoryId),
    variants: p.variants.map((v) => ({
      id: v.id,
      key: p.options
        .map(
          (o) =>
            o.values.find((ov) => v.optionValues.some((l) => l.optionValueId === ov.id))?.value ??
            "",
        )
        .join("|"),
      values: v.optionValues.map((l) => valueById.get(l.optionValueId) ?? ""),
      sku: v.sku,
      priceCents: v.priceCents,
      compareAtPriceCents: v.compareAtPriceCents,
      stockQty: v.stockQty,
      imageUrl: v.image?.url ?? null,
      isActive: v.isActive,
    })),
  };
}
export type AdminProduct = NonNullable<Awaited<ReturnType<typeof getAdminProduct>>>;

export type ProductSaveInput = {
  id?: string | undefined;
  title: string;
  slug: string;
  summary: string;
  description: string;
  brand: string;
  tags: string[];
  details: { dimensions?: string; materials?: string; care?: string };
  status: ProductStatus;
  isFeatured: boolean;
  basePriceCents: number;
  compareAtPriceCents: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
  categoryIds: string[];
  images: { url: string; alt: string }[];
  options: { name: string; values: { value: string; swatchHex: string | null }[] }[];
  /** `key` = option values joined by "|" in option order ("" for single-variant products). */
  variants: {
    key: string;
    sku: string;
    priceCents: number;
    compareAtPriceCents: number | null;
    stockQty: number;
    imageUrl: string | null;
    isActive: boolean;
  }[];
};

/**
 * Creates or updates a product with its images, categories, options and variant matrix in one
 * transaction. Existing variants are matched by option combination so their ids (referenced by
 * carts and order history) survive edits.
 */
export async function saveProduct(
  input: ProductSaveInput,
  db: Database = sharedDb,
): Promise<{ id: string; created: boolean }> {
  const [slugTaken] = await db
    .select({ id: products.id })
    .from(products)
    .where(
      and(eq(products.slug, input.slug), input.id ? sql`${products.id} <> ${input.id}` : undefined),
    )
    .limit(1);
  if (slugTaken)
    throw new AdminRuleError(`The URL handle “${input.slug}” is already used by another product.`);

  const skus = input.variants.map((v) => v.sku);
  if (new Set(skus).size !== skus.length)
    throw new AdminRuleError("Each variant needs a unique SKU.");
  const [skuTaken] = await db
    .select({ sku: productVariants.sku })
    .from(productVariants)
    .where(
      and(
        inArray(productVariants.sku, skus),
        input.id ? sql`${productVariants.productId} <> ${input.id}` : undefined,
      ),
    )
    .limit(1);
  if (skuTaken) throw new AdminRuleError(`SKU ${skuTaken.sku} is already used by another product.`);

  return db.transaction(async (tx) => {
    const values = {
      title: input.title,
      slug: input.slug,
      summary: input.summary,
      description: input.description,
      brand: input.brand,
      tags: input.tags,
      details: input.details,
      status: input.status,
      isFeatured: input.isFeatured,
      basePriceCents: input.basePriceCents,
      compareAtPriceCents: input.compareAtPriceCents,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
    };
    let productId = input.id;
    const created = !productId;
    if (productId) {
      const [prev] = await tx
        .select({ status: products.status, publishedAt: products.publishedAt })
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);
      if (!prev) throw new AdminRuleError("Product not found.");
      await tx
        .update(products)
        .set({
          ...values,
          publishedAt:
            input.status === "active" && !prev.publishedAt ? new Date() : prev.publishedAt,
        })
        .where(eq(products.id, productId));
    } else {
      const [row] = await tx
        .insert(products)
        .values({ ...values, publishedAt: input.status === "active" ? new Date() : null })
        .returning({ id: products.id });
      productId = row?.id;
    }
    if (!productId) throw new Error("Failed to save product");
    const pid = productId;

    // Categories
    await tx.delete(productCategories).where(eq(productCategories.productId, pid));
    if (input.categoryIds.length) {
      await tx
        .insert(productCategories)
        .values(
          input.categoryIds.map((categoryId, i) => ({ productId: pid, categoryId, sortOrder: i })),
        );
    }

    // Images (replace, keeping rows whose URL is unchanged)
    const existingImages = await tx
      .select({ id: productImages.id, url: productImages.url })
      .from(productImages)
      .where(eq(productImages.productId, pid));
    const keepUrls = new Set(input.images.map((i) => i.url));
    const removeIds = existingImages.filter((i) => !keepUrls.has(i.url)).map((i) => i.id);
    if (removeIds.length)
      await tx.delete(productImages).where(inArray(productImages.id, removeIds));
    const imageIdByUrl = new Map<string, string>();
    for (const [i, img] of input.images.entries()) {
      const existing = existingImages.find((e) => e.url === img.url);
      if (existing) {
        await tx
          .update(productImages)
          .set({ alt: img.alt, sortOrder: i })
          .where(eq(productImages.id, existing.id));
        imageIdByUrl.set(img.url, existing.id);
      } else {
        const [row] = await tx
          .insert(productImages)
          .values({ productId: pid, url: img.url, alt: img.alt, sortOrder: i })
          .returning({ id: productImages.id });
        if (row) imageIdByUrl.set(img.url, row.id);
      }
    }

    // Existing variants keyed by option combination (before options are rebuilt).
    const before = created ? null : await getAdminProduct(pid, tx);
    const existingByKey = new Map((before?.variants ?? []).map((v) => [v.key, v.id]));

    // Options (rebuilt; cascades variant ↔ option value links)
    await tx.delete(productOptions).where(eq(productOptions.productId, pid));
    const valueIds: string[][] = [];
    for (const [oi, o] of input.options.entries()) {
      const [opt] = await tx
        .insert(productOptions)
        .values({ productId: pid, name: o.name, sortOrder: oi })
        .returning({ id: productOptions.id });
      const ids: string[] = [];
      for (const [vi, v] of o.values.entries()) {
        const [row] = await tx
          .insert(productOptionValues)
          .values({
            optionId: opt?.id ?? "",
            value: v.value,
            swatchHex: v.swatchHex,
            sortOrder: vi,
          })
          .returning({ id: productOptionValues.id });
        if (row) ids.push(row.id);
      }
      valueIds.push(ids);
    }

    // Variants: update matches, insert new ones, delete the rest.
    const keptIds: string[] = [];
    for (const [si, v] of input.variants.entries()) {
      const data = {
        sku: v.sku,
        priceCents: v.priceCents,
        compareAtPriceCents: v.compareAtPriceCents,
        stockQty: v.stockQty,
        isActive: v.isActive,
        sortOrder: si,
        imageId: v.imageUrl ? (imageIdByUrl.get(v.imageUrl) ?? null) : null,
      };
      const existingId = existingByKey.get(v.key);
      let variantId: string | undefined;
      if (existingId) {
        await tx.update(productVariants).set(data).where(eq(productVariants.id, existingId));
        variantId = existingId;
      } else {
        const [row] = await tx
          .insert(productVariants)
          .values({ productId: pid, ...data })
          .returning({ id: productVariants.id });
        variantId = row?.id;
      }
      if (!variantId) continue;
      keptIds.push(variantId);
      const parts = v.key ? v.key.split("|") : [];
      const links = parts
        .map((value, oi) => {
          const idx = input.options[oi]?.values.findIndex((ov) => ov.value === value) ?? -1;
          return idx >= 0 ? valueIds[oi]?.[idx] : undefined;
        })
        .filter((x): x is string => Boolean(x));
      if (links.length)
        await tx
          .insert(variantOptionValues)
          .values(links.map((optionValueId) => ({ variantId: variantId, optionValueId })));
    }
    if (keptIds.length) {
      await tx
        .delete(productVariants)
        .where(and(eq(productVariants.productId, pid), notInArray(productVariants.id, keptIds)));
    } else {
      await tx.delete(productVariants).where(eq(productVariants.productId, pid));
    }
    return { id: pid, created };
  });
}

export async function setProductsStatus(
  ids: string[],
  status: ProductStatus,
  db: Database = sharedDb,
) {
  if (!ids.length) return 0;
  const rows = await db
    .update(products)
    .set({
      status,
      ...(status === "active"
        ? { publishedAt: sql`coalesce(${products.publishedAt}, now())` }
        : {}),
    })
    .where(and(inArray(products.id, ids), isNull(products.deletedAt)))
    .returning({ id: products.id });
  return rows.length;
}

/** Soft delete (keeps order history intact); also archives so it disappears from the store. */
export async function softDeleteProducts(ids: string[], db: Database = sharedDb) {
  if (!ids.length) return 0;
  const rows = await db
    .update(products)
    .set({ deletedAt: new Date(), status: "archived" })
    .where(inArray(products.id, ids))
    .returning({ id: products.id });
  return rows.length;
}

export async function setProductsCategory(
  ids: string[],
  categoryId: string,
  db: Database = sharedDb,
) {
  if (!ids.length) return;
  await db
    .insert(productCategories)
    .values(ids.map((productId) => ({ productId, categoryId })))
    .onConflictDoNothing();
}

/** Creates a draft copy with new handle/SKUs. */
export async function duplicateProduct(id: string, db: Database = sharedDb) {
  const p = await getAdminProduct(id, db);
  if (!p) throw new AdminRuleError("Product not found.");
  const suffix = Math.random().toString(36).slice(2, 6);
  return saveProduct(
    {
      title: `${p.title} (copy)`,
      slug: `${p.slug}-copy-${suffix}`,
      summary: p.summary,
      description: p.description,
      brand: p.brand,
      tags: p.tags,
      details: p.details,
      status: "draft",
      isFeatured: false,
      basePriceCents: p.basePriceCents,
      compareAtPriceCents: p.compareAtPriceCents,
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      categoryIds: p.categoryIds,
      images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
      options: p.options.map((o) => ({
        name: o.name,
        values: o.values.map((v) => ({ value: v.value, swatchHex: v.swatchHex })),
      })),
      variants: p.variants.map((v) => ({
        key: v.key,
        sku: `${v.sku}-${suffix}`.toUpperCase(),
        priceCents: v.priceCents,
        compareAtPriceCents: v.compareAtPriceCents,
        stockQty: 0,
        imageUrl: v.imageUrl,
        isActive: v.isActive,
      })),
    },
    db,
  );
}

/** Inline edit from the products table (single-variant products). */
export async function updateVariantInline(
  variantId: string,
  input: { priceCents?: number; stockQty?: number },
  db: Database = sharedDb,
) {
  const [before] = await db
    .select({
      priceCents: productVariants.priceCents,
      stockQty: productVariants.stockQty,
      productId: productVariants.productId,
      sku: productVariants.sku,
    })
    .from(productVariants)
    .where(eq(productVariants.id, variantId))
    .limit(1);
  if (!before) throw new AdminRuleError("Variant not found.");
  await db.update(productVariants).set(input).where(eq(productVariants.id, variantId));
  if (input.priceCents !== undefined)
    await db
      .update(products)
      .set({ basePriceCents: input.priceCents })
      .where(eq(products.id, before.productId));
  return before;
}

export async function getProductSlugs(ids: string[], db: Database = sharedDb) {
  if (!ids.length) return [];
  return db
    .select({ id: products.id, slug: products.slug, title: products.title })
    .from(products)
    .where(inArray(products.id, ids));
}

/** Image library for the editor: every image URL already used by products or categories. */
export async function listImageLibrary(db: Database = sharedDb) {
  const rows = await db.execute<{ url: string }>(
    sql`select distinct url from (select ${productImages.url} as url from ${productImages} union select ${categories.imageUrl} from ${categories} where ${categories.imageUrl} is not null) u order by url`,
  );
  return rows.map((r) => r.url);
}
