import { formatMoney, type Totals } from "@repo/shared";
import Image from "next/image";
import type { ReactNode } from "react";

type Line = {
  variantId: string;
  title: string;
  variantLabel: string;
  image: string | null;
  unitPriceCents: number;
  quantity: number;
};

/** Line items + totals. Totals passed in are a preview; the server recomputes them at checkout. */
export function OrderSummary({
  lines,
  totals,
  children,
}: {
  lines: Line[];
  totals: Totals;
  children?: ReactNode;
}) {
  return (
    <div>
      <ul className="divide-border divide-y">
        {lines.map((l) => (
          <li key={l.variantId} className="flex items-center gap-4 py-4">
            <div className="bg-surface-muted relative size-16 shrink-0 rounded-xs">
              {l.image ? (
                <Image src={l.image} alt="" fill sizes="64px" className="rounded-xs object-cover" />
              ) : null}
              <span className="bg-ink text-bg absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full text-[0.65rem]">
                {l.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display truncate text-base italic">{l.title}</p>
              {l.variantLabel ? (
                <p className="text-ink-muted truncate text-xs">{l.variantLabel}</p>
              ) : null}
            </div>
            <p className="text-sm">
              {formatMoney(l.unitPriceCents * l.quantity, "USD", { withCode: false })}
            </p>
          </li>
        ))}
      </ul>
      <dl className="border-border mt-2 space-y-2.5 border-t pt-5 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-muted">Subtotal</dt>
          <dd>{formatMoney(totals.subtotalCents, "USD", { withCode: false })}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-muted">Shipping</dt>
          <dd>
            {totals.shippingCents === 0 && totals.subtotalCents > 0
              ? "Free"
              : formatMoney(totals.shippingCents, "USD", { withCode: false })}
          </dd>
        </div>
        {totals.feeCents ? (
          <div className="flex justify-between">
            <dt className="text-ink-muted">Cash on delivery fee</dt>
            <dd>{formatMoney(totals.feeCents, "USD", { withCode: false })}</dd>
          </div>
        ) : null}
        {totals.taxCents ? (
          <div className="flex justify-between">
            <dt className="text-ink-muted">Tax</dt>
            <dd>{formatMoney(totals.taxCents, "USD", { withCode: false })}</dd>
          </div>
        ) : null}
        <div className="border-border flex items-baseline justify-between border-t pt-4 text-base">
          <dt className="font-medium">Total</dt>
          <dd className="text-xl">{formatMoney(totals.totalCents)}</dd>
        </div>
      </dl>
      {children}
    </div>
  );
}
