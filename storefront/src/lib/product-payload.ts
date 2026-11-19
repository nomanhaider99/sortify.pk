import type { ProductDetail } from "@repo/db";

/** JSON-safe product data used by client components (variant picker, quick add). */
export type ProductPayload = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  summary: string;
  images: { id: string; url: string; alt: string }[];
  options: {
    id: string;
    name: string;
    values: { id: string; value: string; swatchHex: string | null }[];
  }[];
  variants: {
    id: string;
    sku: string;
    priceCents: number;
    compareAtPriceCents: number | null;
    stockQty: number;
    imageId: string | null;
    optionValueIds: string[];
  }[];
};

export function toProductPayload(p: ProductDetail): ProductPayload {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    brand: p.brand,
    summary: p.summary,
    images: p.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt })),
    options: p.options.map((o) => ({
      id: o.id,
      name: o.name,
      values: o.values.map((v) => ({ id: v.id, value: v.value, swatchHex: v.swatchHex })),
    })),
    variants: p.variants,
  };
}

/** Human label for a variant, e.g. "Color: Sage · Size: Large". */
export function variantLabel(p: ProductPayload, variantId: string): string {
  const v = p.variants.find((x) => x.id === variantId);
  if (!v) return "";
  return p.options
    .map((o) => {
      const val = o.values.find((ov) => v.optionValueIds.includes(ov.id));
      return val ? `${o.name}: ${val.value}` : null;
    })
    .filter(Boolean)
    .join(" · ");
}
