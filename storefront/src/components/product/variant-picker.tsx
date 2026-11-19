"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { ProductPayload } from "@/lib/product-payload";

type Selection = Record<string, string>; // optionId -> valueId

/** Picks the first in-stock variant as the initial selection. */
function initialSelection(p: ProductPayload): Selection {
  const v = p.variants.find((x) => x.stockQty > 0) ?? p.variants[0];
  const sel: Selection = {};
  if (!v) return sel;
  for (const o of p.options) {
    const val = o.values.find((ov) => v.optionValueIds.includes(ov.id));
    if (val) sel[o.id] = val.id;
  }
  return sel;
}

export function useVariantSelection(product: ProductPayload) {
  const [selection, setSelection] = useState<Selection>(() => initialSelection(product));

  const variant = useMemo(
    () =>
      product.variants.find((v) =>
        product.options.every((o) => {
          const chosen = selection[o.id];
          return chosen ? v.optionValueIds.includes(chosen) : true;
        }),
      ) ?? (product.options.length === 0 ? product.variants[0] : undefined),
    [product, selection],
  );

  /** Whether choosing `valueId` for `optionId` (keeping other choices) leads to an in-stock variant. */
  const isAvailable = (optionId: string, valueId: string) =>
    product.variants.some(
      (v) =>
        v.stockQty > 0 &&
        v.optionValueIds.includes(valueId) &&
        product.options.every(
          (o) =>
            o.id === optionId ||
            !selection[o.id] ||
            v.optionValueIds.includes(selection[o.id] ?? ""),
        ),
    );

  const select = (optionId: string, valueId: string) =>
    setSelection((s) => ({ ...s, [optionId]: valueId }));
  return { selection, select, variant, isAvailable };
}

type PickerProps = {
  product: ProductPayload;
  selection: Selection;
  onSelect: (optionId: string, valueId: string) => void;
  isAvailable: (optionId: string, valueId: string) => boolean;
  compact?: boolean;
};

/** Option groups as swatches (colour-like values with a hex) or pills; unavailable = struck through. */
export function VariantPicker({
  product,
  selection,
  onSelect,
  isAvailable,
  compact = false,
}: PickerProps) {
  if (!product.options.length) return null;
  return (
    <div className={cn("space-y-5", compact && "space-y-4")}>
      {product.options.map((o) => {
        const chosen = o.values.find((v) => v.id === selection[o.id]);
        const swatches = o.values.every((v) => v.swatchHex);
        return (
          <fieldset key={o.id}>
            <legend className="mb-2.5 text-sm">
              <span className="text-ink-muted">{o.name}:</span>{" "}
              <span className="font-medium">{chosen?.value ?? "Choose"}</span>
            </legend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={o.name}>
              {o.values.map((v) => {
                const active = selection[o.id] === v.id;
                const available = isAvailable(o.id, v.id);
                const label = `${v.value}${available ? "" : " (out of stock)"}`;
                return swatches ? (
                  <button
                    key={v.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={label}
                    title={label}
                    onClick={() => onSelect(o.id, v.id)}
                    className={cn(
                      "relative size-9 rounded-full border transition-[box-shadow,border-color] duration-200",
                      active
                        ? "border-ink ring-ink ring-offset-bg ring-1 ring-offset-2"
                        : "border-border hover:border-ink-muted",
                      !available && "opacity-50",
                    )}
                    style={{ backgroundColor: v.swatchHex ?? undefined }}
                  >
                    {!available ? (
                      <span
                        aria-hidden
                        className="bg-ink absolute top-1/2 left-1/2 h-px w-10 -translate-x-1/2 -translate-y-1/2 -rotate-45"
                      />
                    ) : null}
                  </button>
                ) : (
                  <button
                    key={v.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={label}
                    onClick={() => onSelect(o.id, v.id)}
                    className={cn(
                      "h-10 rounded-full border px-4 text-sm transition-colors duration-200",
                      active ? "border-ink bg-ink text-bg" : "border-border hover:border-ink",
                      !available && "text-ink-muted line-through decoration-1",
                    )}
                  >
                    {v.value}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
