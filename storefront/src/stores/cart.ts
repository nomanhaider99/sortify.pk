"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Client cart UI state (persisted). Prices here are display-only; the server re-validates
 * every line at checkout (PLAN.md §0 rule 5). Extended with add/validation flows in M5.
 */
export type CartLine = {
  variantId: string;
  productId: string;
  slug: string;
  title: string;
  variantLabel: string;
  image: string | null;
  unitPriceCents: number;
  quantity: number;
};

type CartState = {
  lines: CartLine[];
  /** Incremented on every add, so the header badge can play its bump animation. */
  addedTick: number;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      addedTick: 0,
      setQuantity: (variantId, quantity) =>
        set((s) => ({
          lines: s.lines
            .map((l) => (l.variantId === variantId ? { ...l, quantity } : l))
            .filter((l) => l.quantity > 0),
        })),
      remove: (variantId) =>
        set((s) => ({ lines: s.lines.filter((l) => l.variantId !== variantId) })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: "majestic-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines }),
    },
  ),
);

export const selectCartCount = (s: CartState) => s.lines.reduce((n, l) => n + l.quantity, 0);
