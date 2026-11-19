import "server-only";
import { STOREFRONT_ORIGIN } from "./links";

export { storefrontLink } from "./links";

// Server-to-server URL for the webhook (can differ from the public origin).
const storefrontUrl = () => (process.env.STOREFRONT_URL ?? STOREFRONT_ORIGIN).replace(/\/$/, "");

/**
 * Tells the storefront to refresh cached pages after admin changes. Never throws: a failed
 * webhook only delays freshness (pages also revalidate on a 5-minute timer).
 */
export async function revalidateStorefront(input: {
  tags?: ("catalog" | "settings")[];
  paths?: string[];
}): Promise<boolean> {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    console.warn("[revalidate] REVALIDATE_SECRET not set — storefront will refresh on its timer");
    return false;
  }
  try {
    const res = await fetch(`${storefrontUrl()}/api/revalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-revalidate-secret": secret },
      body: JSON.stringify({ tags: input.tags ?? [], paths: input.paths ?? [] }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.warn(`[revalidate] storefront responded ${res.status}`);
    return res.ok;
  } catch (error) {
    console.warn("[revalidate] storefront unreachable", error);
    return false;
  }
}

/** Paths that show catalog data for a product. */
export function productPaths(slugs: string[]): string[] {
  return ["/", "/products", "/categories", ...slugs.map((s) => `/products/${s}`)];
}
