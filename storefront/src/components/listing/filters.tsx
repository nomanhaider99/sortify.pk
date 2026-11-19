"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Dialog } from "radix-ui";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { PRICE_BUCKETS } from "@/lib/listing-params";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { useListingUrl } from "./use-listing-url";

export type Facets = Record<string, { value: string; swatchHex: string | null }[]>;

function FilterGroups({ facets }: { facets: Facets }) {
  const { searchParams, toggleValue, setValue } = useListingUrl();
  const price = searchParams.get("price");
  const inStock = searchParams.get("availability") === "in-stock";
  const selected = (key: string) =>
    new Set((searchParams.get(key) ?? "").split(",").filter(Boolean));

  return (
    <div className="divide-border divide-y">
      <fieldset className="pb-6">
        <legend className="mb-3 text-xs font-medium tracking-[0.12em] uppercase">
          Availability
        </legend>
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="accent-primary-strong size-4"
            checked={inStock}
            onChange={() => setValue("availability", inStock ? null : "in-stock")}
          />
          In stock only
        </label>
      </fieldset>

      <fieldset className="py-6">
        <legend className="mb-3 pt-6 text-xs font-medium tracking-[0.12em] uppercase">Price</legend>
        <div className="space-y-2.5">
          {PRICE_BUCKETS.map((b) => (
            <label key={b.value} className="flex cursor-pointer items-center gap-3 text-sm">
              <input
                type="radio"
                name="price"
                className="accent-primary-strong size-4"
                checked={price === b.value}
                onChange={() => setValue("price", b.value)}
                onClick={() => price === b.value && setValue("price", null)}
              />
              {b.label}
            </label>
          ))}
        </div>
      </fieldset>

      {Object.entries(facets).map(([name, values]) => {
        const key = name.toLowerCase();
        const sel = selected(key);
        const swatches = values.every((v) => v.swatchHex);
        return (
          <fieldset key={name} className="py-6">
            <legend className="mb-3 pt-6 text-xs font-medium tracking-[0.12em] uppercase">
              {name}
            </legend>
            <div className={cn(swatches ? "flex flex-wrap gap-2" : "space-y-2.5")}>
              {values.map((v) =>
                swatches ? (
                  <button
                    key={v.value}
                    type="button"
                    aria-pressed={sel.has(v.value)}
                    onClick={() => toggleValue(key, v.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-xs transition-colors",
                      sel.has(v.value) ? "border-ink" : "border-border hover:border-ink-muted",
                    )}
                  >
                    <span
                      className="border-border size-5 rounded-full border"
                      style={{ backgroundColor: v.swatchHex ?? undefined }}
                      aria-hidden
                    />
                    {v.value}
                  </button>
                ) : (
                  <label key={v.value} className="flex cursor-pointer items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="accent-primary-strong size-4"
                      checked={sel.has(v.value)}
                      onChange={() => toggleValue(key, v.value)}
                    />
                    {v.value}
                  </label>
                ),
              )}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

/** Desktop sidebar filters. */
export function FilterSidebar({ facets }: { facets: Facets }) {
  return (
    <aside aria-label="Filters" className="hidden w-60 shrink-0 lg:block">
      <div className="sticky top-28">
        <FilterGroups facets={facets} />
      </div>
    </aside>
  );
}

/** Mobile/tablet bottom-sheet filters. */
export function FilterSheet({
  facets,
  activeCount,
  total,
}: {
  facets: Facets;
  activeCount: number;
  total: number;
}) {
  const [open, setOpen] = useState(false);
  const { clearAll } = useListingUrl();
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="border-border flex h-10 items-center gap-2 rounded-full border px-4 text-sm lg:hidden"
        >
          <SlidersHorizontal className="size-4" aria-hidden /> Filters
          {activeCount ? (
            <span className="bg-ink text-bg flex size-5 items-center justify-center rounded-full text-[0.65rem]">
              {activeCount}
            </span>
          ) : null}
        </button>
      </Dialog.Trigger>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay forceMount asChild>
              <motion.div
                className="bg-ink/40 fixed inset-0 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content forceMount asChild aria-describedby={undefined}>
              <motion.div
                data-lenis-prevent
                className="bg-bg fixed inset-x-0 bottom-0 z-50 flex max-h-[85svh] flex-col rounded-t-lg"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%", transition: { duration: 0.3 } }}
                transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
              >
                <div className="border-border flex items-center justify-between border-b px-5 py-4">
                  <Dialog.Title className="font-display text-2xl italic">Filters</Dialog.Title>
                  <Dialog.Close
                    className="hover:bg-primary-soft flex size-10 items-center justify-center rounded-full"
                    aria-label="Close filters"
                  >
                    <X className="size-5" aria-hidden />
                  </Dialog.Close>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-6">
                  <FilterGroups facets={facets} />
                </div>
                <div className="border-border grid grid-cols-2 gap-3 border-t p-4">
                  <Button variant="secondary" onClick={clearAll}>
                    Clear all
                  </Button>
                  <Button onClick={() => setOpen(false)}>Show {total} results</Button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
