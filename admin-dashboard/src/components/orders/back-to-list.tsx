"use client";

import { ArrowUp } from "lucide-react";

/** Below xl the order list sits above the detail: jump back up to it. */
export function BackToList() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="text-ink-muted hover:text-ink mb-3 inline-flex min-h-10 items-center gap-1.5 text-sm xl:hidden"
    >
      <ArrowUp className="size-4" aria-hidden /> All orders
    </button>
  );
}
