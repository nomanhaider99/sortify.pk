/** Storefront origin, readable on both server and client. */
export const STOREFRONT_ORIGIN = (
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

/** Storefront URL for a path (or an absolute URL, returned unchanged — e.g. Cloudinary images). */
export function storefrontLink(path: string): string {
  return /^https?:\/\//.test(path) ? path : `${STOREFRONT_ORIGIN}${path}`;
}
