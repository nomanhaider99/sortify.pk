"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import type { CartValidateResponse } from "@/app/api/cart/validate/route";
import { useCart } from "@/stores/cart";

let inFlight: Promise<void> | null = null;

/** Re-validates persisted cart lines against the server (prices, stock, availability). */
export function syncCartNow(): Promise<void> {
  if (inFlight) return inFlight;
  const lines = useCart.getState().lines;
  if (!lines.length) return Promise.resolve();
  inFlight = fetch("/api/cart/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lines: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
    }),
  })
    .then((r) => (r.ok ? (r.json() as Promise<CartValidateResponse>) : null))
    .then((data) => {
      if (!data) return;
      useCart.getState().sync(data.lines);
      for (const issue of data.issues) toast.message(issue);
    })
    .catch(() => undefined)
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/** Runs `syncCartNow` whenever `active` becomes true (drawer opened, cart/checkout mounted). */
export function useCartSync(active: boolean) {
  useEffect(() => {
    if (active) void syncCartNow();
  }, [active]);
}
