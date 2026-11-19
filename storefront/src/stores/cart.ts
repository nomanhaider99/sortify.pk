"use client";

import { MAX_LINE_QUANTITY } from "@repo/shared";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Client cart UI state (persisted). Prices here are display-only; the server re-validates every
 * line (price, stock, availability) when the cart is opened and again at checkout.
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
  /** Max purchasable right now (from the last server validation). */
  maxQuantity?: number;
};

type CartState = {
  lines: CartLine[];
  drawerOpen: boolean;
  /** Incremented on every add so the header badge can bump. */
  addedTick: number;
  /** The line to highlight in the drawer after an add. */
  lastAddedId: string | null;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** Replace lines with server-validated data (prices/stock/removed items). */
  sync: (lines: CartLine[]) => void;
};

const clamp = (q: number, max = MAX_LINE_QUANTITY) =>
  Math.max(0, Math.min(q, max, MAX_LINE_QUANTITY));

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      drawerOpen: false,
      addedTick: 0,
      lastAddedId: null,
      add: (line, quantity = 1) =>
        set((s) => {
          const existing = s.lines.find((l) => l.variantId === line.variantId);
          const lines = existing
            ? s.lines.map((l) =>
                l.variantId === line.variantId
                  ? {
                      ...l,
                      ...line,
                      quantity: clamp(l.quantity + quantity, line.maxQuantity ?? l.maxQuantity),
                    }
                  : l,
              )
            : [...s.lines, { ...line, quantity: clamp(quantity, line.maxQuantity) }];
          return { lines, addedTick: s.addedTick + 1, lastAddedId: line.variantId };
        }),
      setQuantity: (variantId, quantity) =>
        set((s) => ({
          lines: s.lines
            .map((l) =>
              l.variantId === variantId ? { ...l, quantity: clamp(quantity, l.maxQuantity) } : l,
            )
            .filter((l) => l.quantity > 0),
        })),
      remove: (variantId) =>
        set((s) => ({ lines: s.lines.filter((l) => l.variantId !== variantId) })),
      clear: () => set({ lines: [], lastAddedId: null }),
      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false, lastAddedId: null }),
      sync: (lines) => set({ lines }),
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
export const selectSubtotal = (s: CartState) =>
  s.lines.reduce((n, l) => n + l.unitPriceCents * l.quantity, 0);
