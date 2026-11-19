import { formatMoney } from "@repo/shared";
import Image from "next/image";
import type { PublicOrder } from "@/lib/public-order";

export function OrderItems({ order }: { order: PublicOrder }) {
  return (
    <div>
      <ul className="divide-border divide-y">
        {order.items.map((i) => (
          <li key={i.id} className="flex items-center gap-4 py-4">
            <div className="bg-surface-muted relative size-16 shrink-0 overflow-hidden rounded-xs">
              {i.image ? (
                <Image src={i.image} alt="" fill sizes="64px" className="object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base italic">{i.title}</p>
              <p className="text-ink-muted text-xs">
                {i.variant ? `${i.variant} · ` : ""}Qty {i.quantity}
              </p>
            </div>
            <p className="text-sm">{formatMoney(i.totalCents, "USD", { withCode: false })}</p>
          </li>
        ))}
      </ul>
      <dl className="border-border space-y-2 border-t pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-muted">Subtotal</dt>
          <dd>{formatMoney(order.subtotalCents, "USD", { withCode: false })}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-muted">Shipping ({order.deliveryMethod})</dt>
          <dd>
            {order.shippingCents
              ? formatMoney(order.shippingCents, "USD", { withCode: false })
              : "Free"}
          </dd>
        </div>
        {order.feeCents ? (
          <div className="flex justify-between">
            <dt className="text-ink-muted">COD fee</dt>
            <dd>{formatMoney(order.feeCents, "USD", { withCode: false })}</dd>
          </div>
        ) : null}
        {order.taxCents ? (
          <div className="flex justify-between">
            <dt className="text-ink-muted">Tax</dt>
            <dd>{formatMoney(order.taxCents, "USD", { withCode: false })}</dd>
          </div>
        ) : null}
        <div className="border-border flex justify-between border-t pt-3 text-base font-medium">
          <dt>Total</dt>
          <dd>{formatMoney(order.totalCents)}</dd>
        </div>
      </dl>
    </div>
  );
}

export function OrderAddress({ order }: { order: PublicOrder }) {
  const a = order.address;
  return (
    <address className="text-ink-muted text-sm leading-relaxed not-italic">
      <span className="text-ink block">{a.name}</span>
      {a.line1}
      {a.line2 ? (
        <>
          <br />
          {a.line2}
        </>
      ) : null}
      <br />
      {a.city}
      {a.state ? `, ${a.state}` : ""} {a.postalCode}
      <br />
      {a.country}
    </address>
  );
}
