"use client";

import { create } from "zustand";

/** Which product's Quick Add sheet is open (by slug), plus the card image used for fly-to-cart. */
export const useQuickAdd = create<{
  slug: string | null;
  sourceEl: HTMLElement | null;
  open: (slug: string, sourceEl: HTMLElement | null) => void;
  close: () => void;
}>()((set) => ({
  slug: null,
  sourceEl: null,
  open: (slug, sourceEl) => set({ slug, sourceEl }),
  close: () => set({ slug: null, sourceEl: null }),
}));
