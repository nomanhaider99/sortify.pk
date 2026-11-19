"use server";

import {
  AdminRuleError,
  duplicateProduct,
  getAdminProduct,
  getProductSlugs,
  saveProduct,
  setProductsCategory,
  setProductsStatus,
  softDeleteProducts,
  updateVariantInline,
} from "@repo/db/admin";
import { PRODUCT_STATUSES } from "@repo/shared";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction, type ActionResult } from "@/lib/actions";
import { getStorage } from "@/lib/storage";
import { productPaths, revalidateStorefront } from "@/lib/storefront";

const cents = z.number().int().min(0).max(100_000_000);
const imageUrl = z
  .string()
  .trim()
  .max(500)
  .refine(
    (u) => u.startsWith("/images/") || /^https:\/\//.test(u),
    "Images must be https URLs or library images",
  );

const productSchema = z
  .object({
    id: z.uuid().optional(),
    title: z.string().trim().min(2, "Add a title").max(140),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes")
      .max(120),
    summary: z.string().trim().max(300),
    description: z.string().trim().max(10_000),
    brand: z.string().trim().min(1).max(60),
    tags: z.array(z.string().trim().min(1).max(30)).max(20),
    details: z.object({
      dimensions: z.string().trim().max(300).optional(),
      materials: z.string().trim().max(300).optional(),
      care: z.string().trim().max(1000).optional(),
    }),
    status: z.enum(PRODUCT_STATUSES),
    isFeatured: z.boolean(),
    basePriceCents: cents,
    compareAtPriceCents: cents.nullable(),
    seoTitle: z.string().trim().max(70).nullable(),
    seoDescription: z.string().trim().max(170).nullable(),
    categoryIds: z.array(z.uuid()).max(20),
    images: z.array(z.object({ url: imageUrl, alt: z.string().trim().max(200) })).max(20),
    options: z
      .array(
        z.object({
          name: z.string().trim().min(1, "Option name required").max(30),
          values: z
            .array(
              z.object({
                value: z.string().trim().min(1).max(40),
                swatchHex: z
                  .string()
                  .regex(/^#[0-9a-fA-F]{6}$/)
                  .nullable(),
              }),
            )
            .min(1, "Each option needs at least one value")
            .max(30),
        }),
      )
      .max(3),
    variants: z
      .array(
        z.object({
          key: z.string().max(200),
          sku: z.string().trim().min(1, "Every variant needs a SKU").max(60).toUpperCase(),
          priceCents: cents,
          compareAtPriceCents: cents.nullable(),
          stockQty: z.number().int().min(0).max(1_000_000),
          imageUrl: imageUrl.nullable(),
          isActive: z.boolean(),
        }),
      )
      .min(1, "Add at least one variant")
      .max(300),
  })
  .superRefine((p, ctx) => {
    if (p.compareAtPriceCents !== null && p.compareAtPriceCents <= p.basePriceCents) {
      ctx.addIssue({
        code: "custom",
        path: ["compareAtPriceCents"],
        message: "Compare-at price must be higher than the price",
      });
    }
    const names = p.options.map((o) => o.name.toLowerCase());
    if (new Set(names).size !== names.length)
      ctx.addIssue({ code: "custom", path: ["options"], message: "Option names must be unique" });
  });
export type ProductFormInput = z.input<typeof productSchema>;

export async function saveProductAction(
  input: ProductFormInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const data = parsed.data;
  // Creating needs products:create; editing needs products:update; publishing needs products:publish.
  const permission = data.id ? "products:update" : "products:create";
  return runAction(
    permission,
    async ({ session, audit }) => {
      const before = data.id ? await getAdminProduct(data.id) : null;
      const publishing = data.status === "active" && before?.status !== "active";
      if (publishing && !session.can("products:publish")) {
        throw new AdminRuleError(
          "You don’t have permission to publish products — save it as a draft.",
        );
      }
      const { id, created } = await saveProduct(data);
      await audit({
        action: created ? "product.created" : "product.updated",
        entityType: "product",
        entityId: id,
        summary: `${created ? "Created" : "Updated"} “${data.title}” (${data.status}, ${data.variants.length} variant${data.variants.length === 1 ? "" : "s"})`,
        diff: before
          ? Object.fromEntries(
              (
                [
                  ["title", before.title, data.title],
                  ["status", before.status, data.status],
                  ["basePriceCents", before.basePriceCents, data.basePriceCents],
                  ["isFeatured", before.isFeatured, data.isFeatured],
                  ["variants", before.variants.length, data.variants.length],
                ] as const
              )
                .filter(([, a, b]) => a !== b)
                .map(([k, a, b]) => [k, { before: a, after: b }]),
            )
          : null,
      });
      revalidatePath("/products");
      await revalidateStorefront({
        tags: ["catalog"],
        paths: productPaths([
          data.slug,
          ...(before && before.slug !== data.slug ? [before.slug] : []),
        ]),
      });
      return { id };
    },
    "Product saved",
  );
}

const ids = z.array(z.uuid()).min(1).max(200);

export async function bulkProductStatus(
  rawIds: string[],
  status: (typeof PRODUCT_STATUSES)[number],
): Promise<ActionResult<{ count: number }>> {
  const s = z.enum(PRODUCT_STATUSES).parse(status);
  return runAction(s === "active" ? "products:publish" : "products:update", async ({ audit }) => {
    const list = ids.parse(rawIds);
    const count = await setProductsStatus(list, s);
    const slugs = await getProductSlugs(list);
    await audit({
      action: `product.bulk_${s}`,
      entityType: "product",
      summary: `Set ${count} products to ${s}: ${slugs
        .map((x) => x.title)
        .join(", ")
        .slice(0, 300)}`,
    });
    revalidatePath("/products");
    await revalidateStorefront({
      tags: ["catalog"],
      paths: productPaths(slugs.map((x) => x.slug)),
    });
    return { count };
  });
}

export async function bulkDeleteProducts(
  rawIds: string[],
): Promise<ActionResult<{ count: number }>> {
  return runAction("products:delete", async ({ audit }) => {
    const list = ids.parse(rawIds);
    const slugs = await getProductSlugs(list);
    const count = await softDeleteProducts(list);
    await audit({
      action: "product.deleted",
      entityType: "product",
      summary: `Deleted ${count} products: ${slugs
        .map((x) => x.title)
        .join(", ")
        .slice(0, 300)}`,
    });
    revalidatePath("/products");
    await revalidateStorefront({
      tags: ["catalog"],
      paths: productPaths(slugs.map((x) => x.slug)),
    });
    return { count };
  });
}

export async function bulkAddCategory(rawIds: string[], categoryId: string): Promise<ActionResult> {
  return runAction(
    "products:update",
    async ({ audit }) => {
      const list = ids.parse(rawIds);
      await setProductsCategory(list, z.uuid().parse(categoryId));
      await audit({
        action: "product.bulk_category",
        entityType: "product",
        summary: `Added ${list.length} products to a category`,
        diff: { categoryId: { before: null, after: categoryId } },
      });
      revalidatePath("/products");
      await revalidateStorefront({ tags: ["catalog"], paths: ["/", "/products", "/categories"] });
      return undefined;
    },
    "Category added",
  );
}

export async function duplicateProductAction(id: string): Promise<ActionResult<{ id: string }>> {
  return runAction("products:create", async ({ audit }) => {
    const result = await duplicateProduct(z.uuid().parse(id));
    await audit({
      action: "product.duplicated",
      entityType: "product",
      entityId: result.id,
      summary: `Duplicated product ${id} as a draft`,
    });
    revalidatePath("/products");
    return { id: result.id };
  });
}

/** Inline edit of price/stock for single-variant products, with undo support (returns previous values). */
export async function inlineUpdateVariant(
  variantId: string,
  input: { priceCents?: number; stockQty?: number },
): Promise<ActionResult<{ before: { priceCents: number; stockQty: number } }>> {
  const data = z
    .object({
      priceCents: cents.optional(),
      stockQty: z.number().int().min(0).max(1_000_000).optional(),
    })
    .parse(input);
  return runAction("products:update", async ({ audit }) => {
    const before = await updateVariantInline(z.uuid().parse(variantId), data);
    await audit({
      action: "product.inline_update",
      entityType: "product",
      entityId: before.productId,
      summary: `${before.sku}: ${data.priceCents !== undefined ? "price" : "stock"} updated inline`,
      diff: {
        ...(data.priceCents !== undefined
          ? { priceCents: { before: before.priceCents, after: data.priceCents } }
          : {}),
        ...(data.stockQty !== undefined
          ? { stockQty: { before: before.stockQty, after: data.stockQty } }
          : {}),
      },
    });
    revalidatePath("/products");
    await revalidateStorefront({ tags: ["catalog"] });
    return { before: { priceCents: before.priceCents, stockQty: before.stockQty } };
  });
}

/** Signed upload to the storage adapter (type/size validated). */
export async function uploadProductImage(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  return runAction("products:update", async () => {
    const file = formData.get("file");
    if (!(file instanceof File)) throw new AdminRuleError("Choose an image to upload.");
    const storage = getStorage();
    if (!storage.enabled)
      throw new AdminRuleError(
        "Uploads aren’t configured yet — pick from the library or paste an image URL.",
      );
    try {
      const { url } = await storage.upload(file);
      return { url };
    } catch (e) {
      throw new AdminRuleError((e as Error).message);
    }
  });
}
