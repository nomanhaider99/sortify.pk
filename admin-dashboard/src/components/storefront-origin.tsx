"use client";

import { setBrowserStorefrontOrigin } from "@/lib/links";

/** Hands the runtime storefront origin to client components (set during render, before children). */
export function StorefrontOrigin({ origin }: { origin: string }) {
  setBrowserStorefrontOrigin(origin);
  return null;
}
