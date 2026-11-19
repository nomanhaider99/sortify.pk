/**
 * Public storefront origin, configured at *runtime* (`STOREFRONT_PUBLIC_URL`, falling back to
 * `STOREFRONT_URL`) so one admin build works in any environment. On the server it is read from the
 * environment; in the browser it is provided by <StorefrontOrigin> in the root layout.
 */
let browserOrigin: string | null = null;

export function setBrowserStorefrontOrigin(origin: string) {
  browserOrigin = origin;
}

export function storefrontOrigin(): string {
  if (typeof window !== "undefined") return browserOrigin ?? "";
  const env = process.env;
  return (env.STOREFRONT_PUBLIC_URL ?? env.STOREFRONT_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

/** Storefront URL for a path (absolute URLs, e.g. Cloudinary images, are returned unchanged). */
export function storefrontLink(path: string): string {
  return /^https?:\/\//.test(path) ? path : `${storefrontOrigin()}${path}`;
}
