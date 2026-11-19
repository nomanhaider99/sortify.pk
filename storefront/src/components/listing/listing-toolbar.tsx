"use client";

import type { ProductSort } from "@repo/shared";
import { ChevronDown, X } from "lucide-react";
import { PRICE_BUCKETS, SORT_LABELS } from "@/lib/listing-params";
import { type Facets, FilterSheet } from "./filters";
import { useListingUrl } from "./use-listing-url";

/** Result count, sort select, mobile filter trigger and removable active-filter chips. */
export function ListingToolbar({ total, facets }: { total: number; facets: Facets }) {
  const { searchParams, setValue, toggleValue, clearAll, pending } = useListingUrl();
  const sort = (searchParams.get("sort") ?? "featured") as ProductSort;

  const chips: { label: string; remove: () => void }[] = [];
  const price = searchParams.get("price");
  if (price)
    chips.push({
      label: PRICE_BUCKETS.find((b) => b.value === price)?.label ?? price,
      remove: () => setValue("price", null),
    });
  if (searchParams.get("availability") === "in-stock")
    chips.push({ label: "In stock", remove: () => setValue("availability", null) });
  if (searchParams.get("featured") === "1")
    chips.push({ label: "Featured", remove: () => setValue("featured", null) });
  for (const name of Object.keys(facets)) {
    const key = name.toLowerCase();
    for (const v of (searchParams.get(key) ?? "").split(",").filter(Boolean)) {
      chips.push({ label: `${name}: ${v}`, remove: () => toggleValue(key, v) });
    }
  }

  return (
    <div className="space-y-4" aria-busy={pending}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FilterSheet facets={facets} activeCount={chips.length} total={total} />
          <p className="text-ink-muted text-sm" aria-live="polite">
            {total} {total === 1 ? "product" : "products"}
          </p>
        </div>
        <label className="relative flex items-center gap-2 text-sm">
          <span className="text-ink-muted hidden sm:inline">Sort by</span>
          <select
            value={sort}
            onChange={(e) =>
              setValue("sort", e.target.value === "featured" ? null : e.target.value)
            }
            className="border-border focus-visible:outline-primary-strong h-10 appearance-none rounded-full border bg-transparent pr-9 pl-4 text-sm"
          >
            {(Object.keys(SORT_LABELS) as ProductSort[]).map((s) => (
              <option key={s} value={s}>
                {SORT_LABELS[s]}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 size-4" aria-hidden />
        </label>
      </div>
      {chips.length ? (
        <ul className="flex flex-wrap items-center gap-2" aria-label="Active filters">
          {chips.map((c) => (
            <li key={c.label}>
              <button
                type="button"
                onClick={c.remove}
                className="bg-primary-soft hover:bg-primary inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs transition-colors"
              >
                {c.label}
                <X className="size-3" aria-hidden />
                <span className="sr-only">Remove filter</span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={clearAll}
              className="text-ink-muted hover:text-ink px-2 text-xs underline underline-offset-4"
            >
              Clear all
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}

/** "Load more" — bumps `page` in the URL (results are rendered server-side). */
export function LoadMore({ shown, total }: { shown: number; total: number }) {
  const { searchParams, update, pending } = useListingUrl();
  if (shown >= total) return null;
  const page = Number(searchParams.get("page") ?? "1") || 1;
  return (
    <div className="mt-14 flex flex-col items-center gap-4">
      <p className="text-ink-muted text-xs">
        Showing {shown} of {total}
      </p>
      <div className="bg-primary-soft h-0.5 w-48 overflow-hidden rounded-full">
        <div className="bg-primary-strong h-full" style={{ width: `${(shown / total) * 100}%` }} />
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => update((p) => p.set("page", String(page + 1)), { resetPage: false })}
        className="border-ink hover:bg-ink hover:text-bg h-11 rounded-xs border px-8 text-sm tracking-[0.08em] uppercase transition-colors disabled:opacity-60"
      >
        {pending ? "Loading…" : "Load more"}
      </button>
    </div>
  );
}
