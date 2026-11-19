"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { CartValidateResponse } from "@/app/api/cart/validate/route";
import { flyToCart } from "@/lib/fly-to-cart";
import { useCart } from "@/stores/cart";

export type AddStatus = "idle" | "loading" | "added";

type AddArgs = {
  variantId: string;
  quantity: number;
  /** Element whose image should fly to the cart. */
  sourceEl?: HTMLElement | null;
  imageUrl?: string | null;
};

/**
 * Add-to-cart flow (PLAN §5.4): server stock/price check → fly-to-cart → badge bump → drawer opens
 * with the line highlighted. On failure nothing is added and an inline toast explains why.
 */
export function useAddToCart() {
  const [status, setStatus] = useState<AddStatus>("idle");
  const add = useCart((s) => s.add);
  const openDrawer = useCart((s) => s.openDrawer);

  const addToCart = useCallback(
    async ({ variantId, quantity, sourceEl, imageUrl }: AddArgs): Promise<boolean> => {
      setStatus("loading");
      try {
        const existing =
          useCart.getState().lines.find((l) => l.variantId === variantId)?.quantity ?? 0;
        const res = await fetch("/api/cart/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lines: [{ variantId, quantity: Math.min(existing + quantity, 20) }],
          }),
        });
        if (!res.ok) throw new Error("validate failed");
        const data = (await res.json()) as CartValidateResponse;
        const line = data.lines[0];
        if (!line) {
          toast.error(data.issues[0] ?? "Sorry, this item is out of stock.");
          setStatus("idle");
          return false;
        }
        const addable = line.quantity - existing;
        if (addable <= 0) {
          toast.error(`You already have the maximum available (${line.maxQuantity}) in your cart.`);
          setStatus("idle");
          return false;
        }
        if (addable < quantity) toast.message(data.issues[0] ?? `Only ${addable} more available.`);

        await flyToCart(sourceEl ?? null, imageUrl ?? line.image);
        add(
          {
            variantId: line.variantId,
            productId: line.productId,
            slug: line.slug,
            title: line.title,
            variantLabel: line.variantLabel,
            image: line.image,
            unitPriceCents: line.unitPriceCents,
            maxQuantity: line.maxQuantity,
          },
          addable,
        );
        setStatus("added");
        setTimeout(() => setStatus("idle"), 1600);
        // Auto-open the drawer (settings: payments.autoOpenCartOnAdd, passed via the provider).
        if (document.documentElement.dataset.cartAutoOpen !== "false") openDrawer();
        return true;
      } catch {
        toast.error("We couldn't add that right now. Please try again.");
        setStatus("idle");
        return false;
      }
    },
    [add, openDrawer],
  );

  return { status, addToCart };
}
