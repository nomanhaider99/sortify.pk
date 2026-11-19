import { inArray } from "drizzle-orm";
import { db as sharedDb, type Database, type Transaction } from "../client";
import { productVariants } from "../schema";

export type CartVariant = {
  variantId: string;
  productId: string;
  slug: string;
  title: string;
  sku: string;
  variantLabel: string;
  image: string | null;
  priceCents: number;
  compareAtPriceCents: number | null;
  stockQty: number;
  /** Purchasable: variant active and product active + not deleted. */
  available: boolean;
};

/**
 * Authoritative price/stock data for a set of variants — the server-side source of truth used to
 * validate carts and create orders (client prices are never trusted).
 */
export async function getCartVariants(
  variantIds: readonly string[],
  db: Database | Transaction = sharedDb,
): Promise<Map<string, CartVariant>> {
  const ids = [...new Set(variantIds)];
  if (!ids.length) return new Map();
  const rows = await db.query.productVariants.findMany({
    where: inArray(productVariants.id, ids),
    with: {
      product: {
        columns: { id: true, slug: true, title: true, status: true, deletedAt: true },
        with: { images: { orderBy: (i, { asc }) => [asc(i.sortOrder)], limit: 1 } },
      },
      image: true,
      optionValues: {
        with: { optionValue: { with: { option: true } } },
      },
    },
  });
  return new Map(
    rows.map((v) => {
      const label = v.optionValues
        .map((l) => l.optionValue)
        .sort((a, b) => a.option.sortOrder - b.option.sortOrder)
        .map((ov) => `${ov.option.name}: ${ov.value}`)
        .join(" · ");
      return [
        v.id,
        {
          variantId: v.id,
          productId: v.product.id,
          slug: v.product.slug,
          title: v.product.title,
          sku: v.sku,
          variantLabel: label,
          image: v.image?.url ?? v.product.images[0]?.url ?? null,
          priceCents: v.priceCents,
          compareAtPriceCents: v.compareAtPriceCents,
          stockQty: v.stockQty,
          available: v.isActive && v.product.status === "active" && !v.product.deletedAt,
        },
      ];
    }),
  );
}
