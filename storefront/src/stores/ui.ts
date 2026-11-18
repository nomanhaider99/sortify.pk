"use client";

import { create } from "zustand";

type Overlay = "menu" | "search" | null;

/** Which full-screen overlay is open. Only one can be open at a time. */
export const useOverlay = create<{
  open: Overlay;
  setOpen: (overlay: Overlay) => void;
}>()((set) => ({
  open: null,
  setOpen: (open) => set({ open }),
}));
