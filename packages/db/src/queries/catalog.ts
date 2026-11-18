import { and, asc, desc, eq, inArray, isNull, sql, type SQL } from "drizzle-orm";
import { db as sharedDb, type Database } from "../client";
import {
  categories,
  productCategories,
  productOptions,
  productOptionValues,
  products,
  productVariants,
  reviews,
  variantOptionValues,
} from "../schema";

export const PRODUCT_SORTS = [
  "featured",
  "newest",
  "price_asc",
  "price_desc",
  "best_selling",
] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export type ProductListParams = {
  categorySlug?: string | undefined;
  sort?: ProductSort | undefined;
  minPriceCents?: number | undefined;
  maxPriceCents?: number | undefined;
  inStockOnly?: boolean | undefined;
  /** Option values to match, e.g. { Color: ["Sage"], Material: ["Bouclé"] } */
  options?: Record<string, string[]> | undefined;
  featuredOnly?: boolean | undefined;
  search?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
};

export type ProductCard = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  images: { url: string; alt: string }[];
  swatches: { value: string; hex: string; imageUrl: string | null }[];
  variantCount: number;
  /** The id of the only variant, for instant Quick Add on single-variant products. */
  singleVariantId: string | null;
  inStock: boolean;
  isNew: boolean;
  ratingAvg: number;
  ratingCount: number;
};

const NEW_WINDOW_DAYS = 14;

/** Visible = active + not soft-deleted. Every storefront query must go through this. */
export const isVisibleProduct = () =>
  and(eq(products.status, "active"), isNull(products.deletedAt));

// Correlated subqueries reference outer columns with explicit table-qualified identifiers:
// drizzle omits the table name for columns in select-field position.
const PRODUCT_ID = sql.raw(`"products"."id"`);

const minPrice = sql<number>`(
  select min(mv.price_cents) from ${productVariants} mv
  where mv.product_id = ${PRODUCT_ID} and mv.is_active
)`;

function escapeLike(s: string) {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}

function listingWhere(p: ProductListParams): SQL | undefined {
  const where: (SQL | undefined)[] = [isVisibleProduct()];
  if (p.categorySlug) {
    where.push(
      sql`exists (select 1 from ${productCategories} pc join ${categories} c on c.id = pc.category_id
        where pc.product_id = ${PRODUCT_ID} and c.slug = ${p.categorySlug} and c.is_visible)`,
    );
  }
  if (p.featuredOnly) where.push(eq(products.isFeatured, true));
  if (p.minPriceCents !== undefined) where.push(sql`${minPrice} >= ${p.minPriceCents}`);
  if (p.maxPriceCents !== undefined) where.push(sql`${minPrice} <= ${p.maxPriceCents}`);
  if (p.inStockOnly) {
    where.push(
      sql`exists (select 1 from ${productVariants} v where v.product_id = ${PRODUCT_ID} and v.is_active and v.stock_qty > 0)`,
    );
  }
  if (p.search?.trim()) {
    const q = `%${escapeLike(p.search.trim().toLowerCase())}%`;
    where.push(
      sql`(lower(${products.title}) like ${q} or lower(${products.summary}) like ${q} or ${products.tags}::text ilike ${q})`,
    );
  }
  for (const [optionName, values] of Object.entries(p.options ?? {})) {
    if (!values.length) continue;
    where.push(
      sql`exists (
        select 1 from ${productVariants} v
        join ${variantOptionValues} vov on vov.variant_id = v.id
        join ${productOptionValues} ov on ov.id = vov.option_value_id
        join ${productOptions} o on o.id = ov.option_id
        where v.product_id = ${PRODUCT_ID} and v.is_active
          and o.name = ${optionName} and ov.value in ${values}
      )`,
    );
  }
  return and(...where);
}

function listingOrder(sort: ProductSort = "featured"): SQL[] {
  switch (sort) {
    case "newest":
      return [desc(products.publishedAt), desc(products.createdAt)];
    case "price_asc":
      return [asc(minPrice), asc(products.title)];
    case "price_desc":
      return [desc(minPrice), asc(products.title)];
    case "best_selling":
      return [desc(products.salesCount), asc(products.title)];
    case "featured":
      return [desc(products.isFeatured), desc(products.salesCount), asc(products.title)];
  }
}

/** Paginated product listing for category pages, /products and home sections. */
export async function listProducts(
  params: ProductListParams = {},
  db: Database = sharedDb,
): Promise<{ items: ProductCard[]; total: number }> {
  const limit = Math.min(Math.max(params.limit ?? 12, 1), 48);
  const offset = Math.max(params.offset ?? 0, 0);
  const where = listingWhere(params);

  const [idRows, countRows] = await Promise.all([
    db
      .select({ id: products.id })
      .from(products)
      .where(where)
      .orderBy(...listingOrder(params.sort))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(where),
  ]);

  const ids = idRows.map((r) => r.id);
  const items = await getProductCards(ids, db);
  return { items, total: countRows[0]?.count ?? 0 };
}

/** Loads card data for the given product ids, preserving their order. */
export async function getProductCards(
  ids: string[],
  db: Database = sharedDb,
): Promise<ProductCard[]> {
  if (!ids.length) return [];
  const rows = await db.query.products.findMany({
    where: inArray(products.id, ids),
    with: {
      images: { orderBy: (i, { asc }) => [asc(i.sortOrder)], limit: 2 },
      variants: {
        where: (v, { eq }) => eq(v.isActive, true),
        orderBy: (v, { asc }) => [asc(v.sortOrder)],
        with: {
          image: true,
          optionValues: { with: { optionValue: { with: { option: true } } } },
        },
      },
    },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  const newSince = Date.now() - NEW_WINDOW_DAYS * 86_400_000;

  return ids.flatMap((id) => {
    const p = byId.get(id);
    if (!p) return [];
    const cheapest = p.variants.reduce<(typeof p.variants)[number] | undefined>(
      (min, v) => (!min || v.priceCents < min.priceCents ? v : min),
      undefined,
    );
    const swatches = new Map<string, ProductCard["swatches"][number]>();
    for (const v of p.variants) {
      for (const link of v.optionValues) {
        const ov = link.optionValue;
        if (ov.option.name === "Color" && ov.swatchHex && !swatches.has(ov.value)) {
          swatches.set(ov.value, {
            value: ov.value,
            hex: ov.swatchHex,
            imageUrl: v.image?.url ?? null,
          });
        }
      }
    }
    return [
      {
        id: p.id,
        slug: p.slug,
        title: p.title,
        brand: p.brand,
        priceCents: cheapest?.priceCents ?? p.basePriceCents,
        compareAtPriceCents: cheapest?.compareAtPriceCents ?? p.compareAtPriceCents,
        images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
        swatches: [...swatches.values()],
        variantCount: p.variants.length,
        singleVariantId: p.variants.length === 1 ? (p.variants[0]?.id ?? null) : null,
        inStock: p.variants.some((v) => v.stockQty > 0),
        isNew: (p.publishedAt ?? p.createdAt).getTime() >= newSince,
        ratingAvg: p.ratingAvg,
        ratingCount: p.ratingCount,
      },
    ];
  });
}

/** Full product detail for /products/[slug] (visible products only). */
export async function getProductBySlug(slug: string, db: Database = sharedDb) {
  const product = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), isVisibleProduct()),
    with: {
      images: { orderBy: (i, { asc }) => [asc(i.sortOrder)] },
      options: {
        orderBy: (o, { asc }) => [asc(o.sortOrder)],
        with: { values: { orderBy: (v, { asc }) => [asc(v.sortOrder)] } },
      },
      variants: {
        where: (v, { eq }) => eq(v.isActive, true),
        orderBy: (v, { asc }) => [asc(v.sortOrder)],
        with: { optionValues: true },
      },
      categories: { with: { category: true } },
    },
  });
  if (!product) return null;

  const ratingBreakdown = await db
    .select({ rating: reviews.rating, count: sql<number>`count(*)::int` })
    .from(reviews)
    .where(and(eq(reviews.productId, product.id), eq(reviews.status, "approved")))
    .groupBy(reviews.rating);

  return {
    ...product,
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      priceCents: v.priceCents,
      compareAtPriceCents: v.compareAtPriceCents,
      stockQty: v.stockQty,
      imageId: v.imageId,
      optionValueIds: v.optionValues.map((o) => o.optionValueId),
    })),
    categories: product.categories.map((c) => c.category).filter((c) => c.isVisible),
    ratingBreakdown: [5, 4, 3, 2, 1].map((r) => ({
      rating: r,
      count: ratingBreakdown.find((b) => b.rating === r)?.count ?? 0,
    })),
  };
}
export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

/** Approved reviews for a product, newest or highest first. */
export async function listApprovedReviews(
  productId: string,
  {
    sort = "newest",
    limit = 10,
    offset = 0,
  }: { sort?: "newest" | "highest" | "lowest"; limit?: number; offset?: number } = {},
  db: Database = sharedDb,
) {
  const order =
    sort === "highest"
      ? [desc(reviews.rating), desc(reviews.createdAt)]
      : sort === "lowest"
        ? [asc(reviews.rating), desc(reviews.createdAt)]
        : [desc(reviews.createdAt)];
  return db
    .select({
      id: reviews.id,
      customerName: reviews.customerName,
      rating: reviews.rating,
      title: reviews.title,
      body: reviews.body,
      images: reviews.images,
      isVerifiedPurchase: reviews.isVerifiedPurchase,
      ownerReply: reviews.ownerReply,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.status, "approved")))
    .orderBy(...order)
    .limit(Math.min(limit, 50))
    .offset(offset);
}

/** Featured approved reviews for the home testimonials. */
export async function listFeaturedReviews(limit = 8, db: Database = sharedDb) {
  return db
    .select({
      id: reviews.id,
      customerName: reviews.customerName,
      rating: reviews.rating,
      title: reviews.title,
      body: reviews.body,
      isVerifiedPurchase: reviews.isVerifiedPurchase,
      productTitle: products.title,
      productSlug: products.slug,
    })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .where(and(eq(reviews.status, "approved"), eq(reviews.isFeatured, true), isVisibleProduct()))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);
}

/** Visible categories (optionally only those shown in the menu) with product counts. */
export async function listCategories(
  { menuOnly = false }: { menuOnly?: boolean } = {},
  db: Database = sharedDb,
) {
  const where = and(
    eq(categories.isVisible, true),
    menuOnly ? eq(categories.showInMenu, true) : undefined,
  );
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      description: categories.description,
      imageUrl: categories.imageUrl,
      productCount: sql<number>`(
        select count(*)::int from ${productCategories} pc join ${products} p on p.id = pc.product_id
        where pc.category_id = ${sql.raw(`"categories"."id"`)} and p.status = 'active' and p.deleted_at is null
      )`,
    })
    .from(categories)
    .where(where)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function getCategoryBySlug(slug: string, db: Database = sharedDb) {
  const rows = await db
    .select()
    .from(categories)
    .where(and(eq(categories.slug, slug), eq(categories.isVisible, true)))
    .limit(1);
  return rows[0] ?? null;
}

/** Filter facets (option values + price bounds) for a listing. */
export async function getListingFacets(categorySlug?: string, db: Database = sharedDb) {
  const scope = listingWhere({ categorySlug });
  const [options, bounds] = await Promise.all([
    db
      .selectDistinct({
        option: productOptions.name,
        value: productOptionValues.value,
        swatchHex: productOptionValues.swatchHex,
      })
      .from(productOptionValues)
      .innerJoin(productOptions, eq(productOptions.id, productOptionValues.optionId))
      .innerJoin(products, eq(products.id, productOptions.productId))
      .where(scope)
      .orderBy(asc(productOptions.name), asc(productOptionValues.value)),
    db
      .select({
        min: sql<number | null>`min(${minPrice})`,
        max: sql<number | null>`max(${minPrice})`,
      })
      .from(products)
      .where(scope),
  ]);
  const grouped: Record<string, { value: string; swatchHex: string | null }[]> = {};
  for (const o of options)
    (grouped[o.option] ??= []).push({ value: o.value, swatchHex: o.swatchHex });
  return {
    options: grouped,
    minPriceCents: bounds[0]?.min ?? 0,
    maxPriceCents: bounds[0]?.max ?? 0,
  };
}

/** Instant search across products and categories (server-side, case-insensitive). */
export async function searchCatalog(query: string, limit = 6, db: Database = sharedDb) {
  const q = query.trim();
  if (q.length < 2) return { products: [], categories: [] };
  const like = `%${escapeLike(q.toLowerCase())}%`;
  const [productResult, categoryRows] = await Promise.all([
    listProducts({ search: q, limit, sort: "best_selling" }, db),
    db
      .select({ slug: categories.slug, name: categories.name, imageUrl: categories.imageUrl })
      .from(categories)
      .where(and(eq(categories.isVisible, true), sql`lower(${categories.name}) like ${like}`))
      .limit(4),
  ]);
  return { products: productResult.items, categories: categoryRows };
}
