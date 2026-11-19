import type { ProductListParams } from "@repo/db";
import { PRODUCT_SORTS, type ProductSort } from "@repo/shared";

export const PAGE_SIZE = 12;

/** Preset price buckets (dollars) shown in the filter UI; stored in the URL as `price=min-max`. */
export const PRICE_BUCKETS = [
  { label: "Under $50", value: "0-50" },
  { label: "$50 – $100", value: "50-100" },
  { label: "$100 – $250", value: "100-250" },
  { label: "$250 – $500", value: "250-500" },
  { label: "$500 & above", value: "500-" },
] as const;

export const SORT_LABELS: Record<ProductSort, string> = {
  featured: "Featured",
  newest: "Newest",
  best_selling: "Best selling",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
};

/** Reserved (non-option) query keys. Every other key is treated as a product option filter. */
const RESERVED = new Set(["sort", "price", "availability", "page", "q", "featured"]);

export type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export type ParsedListing = {
  sort: ProductSort;
  price: string | null;
  inStockOnly: boolean;
  featuredOnly: boolean;
  q: string | null;
  page: number;
  /** URL key (lowercase option name) → selected values */
  options: Record<string, string[]>;
};

export function parseListingParams(sp: SearchParams): ParsedListing {
  const sortRaw = first(sp.sort);
  const sort = (PRODUCT_SORTS as readonly string[]).includes(sortRaw ?? "")
    ? (sortRaw as ProductSort)
    : "featured";
  const priceRaw = first(sp.price) ?? null;
  const price = priceRaw && /^\d{0,5}-\d{0,5}$/.test(priceRaw) ? priceRaw : null;
  const pageNum = Number.parseInt(first(sp.page) ?? "1", 10);
  const page = Number.isFinite(pageNum) ? Math.min(Math.max(pageNum, 1), 8) : 1;
  const q = first(sp.q)?.trim().slice(0, 60) || null;
  const options: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(sp)) {
    if (RESERVED.has(key) || !/^[a-z]{2,20}$/.test(key)) continue;
    const values = (Array.isArray(value) ? value.join(",") : (value ?? ""))
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v && v.length <= 60)
      .slice(0, 10);
    if (values.length) options[key] = values;
  }
  return {
    sort,
    price,
    inStockOnly: first(sp.availability) === "in-stock",
    featuredOnly: first(sp.featured) === "1",
    q,
    page,
    options,
  };
}

/** Converts parsed params into the db query, mapping URL keys back to option names via facets. */
export function toListQuery(
  parsed: ParsedListing,
  facetNames: string[],
  categorySlug?: string,
): ProductListParams {
  const [minStr, maxStr] = parsed.price?.split("-") ?? [];
  const byKey = new Map(facetNames.map((n) => [n.toLowerCase(), n]));
  const options: Record<string, string[]> = {};
  for (const [key, values] of Object.entries(parsed.options)) {
    const name = byKey.get(key);
    if (name) options[name] = values;
  }
  return {
    categorySlug,
    sort: parsed.sort,
    minPriceCents: minStr ? Number(minStr) * 100 : undefined,
    maxPriceCents: maxStr ? Number(maxStr) * 100 : undefined,
    inStockOnly: parsed.inStockOnly,
    featuredOnly: parsed.featuredOnly,
    search: parsed.q ?? undefined,
    options,
    limit: PAGE_SIZE * parsed.page,
    offset: 0,
  };
}
