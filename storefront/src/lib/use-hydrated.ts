"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => undefined;

/** `false` during SSR and the hydration render, `true` afterwards (avoids persisted-state mismatches). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
