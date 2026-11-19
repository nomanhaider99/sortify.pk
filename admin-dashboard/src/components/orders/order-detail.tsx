import { ORDER_FLOW, ORDER_STATUS_LABELS, nextAction } from "@repo/shared";
import { Check, ExternalLink, Printer } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { money, ORDER_TONE } from "@/lib/format";
import { LocalTime } from "@/components/ui/local-time";
import { storefrontLink } from "@/lib/links";
import type { getAdminOrderDetail } from "@repo/db/admin";
import { EventForm, NotesPanel, OrderActions, TrackingForm } from "./order-widgets";

type Detail = NonNullable<Awaited<ReturnType<typeof getAdminOrderDetail>>>;
type Can = {
  confirm: boolean;
  update: boolean;
  ship: boolean;
  cancel: boolean;
  refund: boolean;
  customers: boolean;
};

/** Action-first order detail (PLAN §6.4): stepper + primary next action, tracking, notes, timeline. */
export function OrderDetail({ order, can }: { order: Detail; can: Can }) {
  const next = nextAction(order.status);
  const terminal = order.status === "cancelled" || order.status === "refunded";
  const reached = ORDER_FLOW.indexOf(order.status);
  const a = order.shippingAddress;
  const payment = order.payments[0];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">{order.orderNumber}</h2>
              <Badge tone={ORDER_TONE[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
              <Badge
                tone={
                  order.paymentStatus === "paid"
                    ? "success"
                    : order.paymentStatus === "pending"
                      ? "warning"
                      : "neutral"
                }
              >
                {order.paymentMethod === "cod" ? "COD" : "Card"} · {order.paymentStatus}
              </Badge>
            </div>
            <p className="text-ink-muted mt-1 text-sm">
              Placed <LocalTime value={order.placedAt} />
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/print/invoice/${order.orderNumber}` as Route}
              target="_blank"
              className="border-border hover:bg-surface-muted rounded-control inline-flex h-9 items-center gap-2 border px-3 text-sm"
            >
              <Printer className="size-4" aria-hidden /> Invoice
            </Link>
          </div>
        </div>

        {/* Stepper */}
        <ol className="mt-6 grid grid-cols-6 gap-1" aria-label="Order progress">
          {ORDER_FLOW.map((s, i) => {
            const done = !terminal && i <= reached;
            return (
              <li
                key={s}
                className="flex flex-col items-center gap-1.5 text-center"
                aria-current={i === reached && !terminal ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full border text-xs",
                    done
                      ? "bg-primary-strong border-primary-strong text-on-strong"
                      : "border-border text-ink-muted",
                  )}
                >
                  {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-[0.6875rem] leading-tight",
                    done ? "text-ink" : "text-ink-muted",
                  )}
                >
                  {ORDER_STATUS_LABELS[s]}
                </span>
              </li>
            );
          })}
        </ol>
        {terminal ? (
          <p className="bg-danger/10 text-danger rounded-control mt-4 px-3 py-2 text-sm">
            This order was {order.status}.
          </p>
        ) : null}

        <div className="mt-6">
          <OrderActions
            orderNumber={order.orderNumber}
            status={order.status}
            next={next}
            paymentMethod={order.paymentMethod}
            paymentStatus={order.paymentStatus}
            hasTracking={Boolean(order.trackingNumber)}
            can={can}
          />
        </div>
      </Card>

      <div className="grid gap-6 2xl:grid-cols-2">
        <Card>
          <CardTitle className="mb-3">Items</CardTitle>
          <ul className="divide-border divide-y">
            {order.items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 py-3">
                <div className="bg-surface-muted rounded-control relative size-12 shrink-0 overflow-hidden">
                  {it.imageSnapshot ? (
                    <Image
                      src={storefrontLink(it.imageSnapshot)}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{it.titleSnapshot}</p>
                  <p className="text-ink-muted text-xs">
                    {it.variantSnapshot ? `${it.variantSnapshot} · ` : ""}
                    {it.sku} · {money(it.unitPriceCents)} × {it.quantity}
                  </p>
                </div>
                <p className="text-sm tabular-nums">{money(it.totalCents)}</p>
              </li>
            ))}
          </ul>
          <dl className="border-border mt-2 space-y-1.5 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-muted">Subtotal</dt>
              <dd className="tabular-nums">{money(order.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Shipping ({order.deliveryMethod})</dt>
              <dd className="tabular-nums">
                {order.shippingCents ? money(order.shippingCents) : "Free"}
              </dd>
            </div>
            {order.feeCents ? (
              <div className="flex justify-between">
                <dt className="text-ink-muted">COD fee</dt>
                <dd className="tabular-nums">{money(order.feeCents)}</dd>
              </div>
            ) : null}
            {order.taxCents ? (
              <div className="flex justify-between">
                <dt className="text-ink-muted">Tax</dt>
                <dd className="tabular-nums">{money(order.taxCents)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between pt-1 text-base font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{money(order.totalCents)}</dd>
            </div>
          </dl>
          {order.note ? (
            <p className="bg-warning/10 text-warning-ink rounded-control mt-4 px-3 py-2 text-sm">
              Customer note: {order.note}
            </p>
          ) : null}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardTitle className="mb-3">Customer</CardTitle>
            <p className="text-sm font-medium">{a.name}</p>
            <p className="text-ink-muted text-sm">
              <a href={`mailto:${order.email}`} className="hover:underline">
                {order.email}
              </a>
              {order.phone ? ` · ${order.phone}` : ""}
            </p>
            {order.customerHistory && order.customerId && can.customers ? (
              <Link
                href={`/customers/${order.customerId}` as Route}
                className="text-accent-ink mt-1 inline-block text-xs hover:underline"
              >
                {order.customerHistory.orders} order{order.customerHistory.orders === 1 ? "" : "s"}{" "}
                · {money(order.customerHistory.spent)} lifetime
              </Link>
            ) : null}
            <address className="text-ink-muted border-border mt-3 border-t pt-3 text-sm not-italic">
              {a.line1}
              {a.line2 ? <>, {a.line2}</> : null}
              <br />
              {a.city}
              {a.state ? `, ${a.state}` : ""} {a.postalCode} · {a.country}
              <br />
              {a.phone}
            </address>
          </Card>
          <Card>
            <CardTitle className="mb-3">Payment</CardTitle>
            <p className="text-sm">
              {order.paymentMethod === "cod"
                ? "Cash on delivery"
                : `Card ${payment?.cardBrand ?? ""} •••• ${payment?.cardLast4 ?? "????"}`}
            </p>
            <p className="text-ink-muted text-xs">
              Status: {order.paymentStatus}
              {payment?.providerRef ? ` · ref ${payment.providerRef}` : ""}
            </p>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 2xl:grid-cols-2">
        <Card>
          <CardTitle className="mb-3">Tracking</CardTitle>
          <TrackingForm
            orderNumber={order.orderNumber}
            initial={{
              carrier: order.carrier ?? "",
              trackingNumber: order.trackingNumber ?? "",
              trackingUrl: order.trackingUrl ?? "",
              estimatedDelivery: order.estimatedDelivery ?? "",
            }}
            disabled={!can.ship}
          />
          {order.trackingUrl ? (
            <a
              href={order.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-ink mt-3 inline-flex items-center gap-1 text-sm hover:underline"
            >
              Open carrier tracking <ExternalLink className="size-3.5" aria-hidden />
            </a>
          ) : null}
        </Card>
        <Card>
          <CardTitle className="mb-3">Internal notes</CardTitle>
          <NotesPanel
            orderNumber={order.orderNumber}
            notes={order.notes.map((n) => ({
              id: n.id,
              body: n.body,
              author: n.author?.name ?? "Staff",
              createdAt: n.createdAt.toISOString(),
            }))}
            disabled={!can.update}
          />
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Activity & tracking timeline</CardTitle>
          <span className="text-ink-muted text-xs">
            Public events appear on the customer’s tracking page
          </span>
        </div>
        <ol className="border-border space-y-5 border-l pl-6">
          {[...order.events].reverse().map((e) => (
            <li key={e.id} className="relative">
              <span
                className={cn(
                  "border-surface absolute top-1 -left-[1.95rem] size-3 rounded-full border-2",
                  e.isPublic ? "bg-primary-strong" : "bg-border",
                )}
                aria-hidden
              />
              <p className="text-sm font-medium">
                {e.title}{" "}
                {!e.isPublic ? (
                  <Badge tone="neutral" className="ml-1">
                    Internal
                  </Badge>
                ) : null}
              </p>
              {e.description ? <p className="text-ink-muted text-sm">{e.description}</p> : null}
              <p className="text-ink-muted mt-0.5 text-xs">
                <LocalTime value={e.occurredAt} />
                {e.location ? ` · ${e.location}` : ""}
                {e.author ? ` · by ${e.author.name}` : ""}
              </p>
            </li>
          ))}
        </ol>
        {can.update ? (
          <div className="border-border mt-6 border-t pt-5">
            <EventForm orderNumber={order.orderNumber} />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
