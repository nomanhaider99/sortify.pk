import { ExternalLink } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { OrderAddress, OrderItems } from "@/components/order/order-items";
import { OrderTimeline } from "@/components/order/order-timeline";
import { Container } from "@/components/ui/container";
import { hasOrderAccess } from "@/lib/order-access";
import { getPublicOrder } from "@/lib/public-order";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Order tracking", robots: { index: false } };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

export default async function TrackOrderPage({ params }: PageProps<"/track/[orderNumber]">) {
  const { orderNumber } = await params;
  // Access requires a successful number + email lookup (or having placed the order) — no enumeration.
  if (!(await hasOrderAccess(orderNumber)))
    redirect(`${routes.track}?order=${encodeURIComponent(orderNumber)}` as Route);
  const order = await getPublicOrder(orderNumber);
  if (!order) notFound();

  return (
    <Container className="pb-section pt-10 md:pt-14">
      <Link href={routes.track} className="text-ink-muted hover:text-ink text-xs">
        ← Track another order
      </Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-ink-muted text-xs tracking-[0.16em] uppercase">
            Order {order.orderNumber}
          </p>
          <h1 className="font-display text-display-lg mt-2 italic">
            {order.status === "delivered"
              ? "Delivered — enjoy!"
              : order.status === "cancelled"
                ? "Order cancelled"
                : "Your order is on its way"}
          </h1>
          <p className="text-ink-muted mt-2 text-sm">
            Placed {dateFmt.format(new Date(order.placedAt))}
          </p>
        </div>
        {order.estimatedDelivery && order.status !== "delivered" ? (
          <div className="bg-primary-soft rounded-sm px-5 py-3 text-sm">
            <span className="text-ink-muted block text-xs tracking-[0.1em] uppercase">
              Estimated delivery
            </span>
            {dateFmt.format(new Date(order.estimatedDelivery))}
          </div>
        ) : null}
      </div>

      <div className="bg-surface border-border mt-10 rounded-sm border p-6 md:p-10">
        <OrderTimeline status={order.status} events={order.events} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="bg-surface border-border rounded-sm border p-6 md:p-8">
          <h2 className="font-display text-2xl italic">Items</h2>
          <div className="mt-2">
            <OrderItems order={order} />
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-surface border-border rounded-sm border p-6">
            <h2 className="text-xs font-medium tracking-[0.12em] uppercase">Shipment</h2>
            {order.trackingNumber ? (
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-ink-muted text-xs">Carrier</dt>
                  <dd>{order.carrier}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted text-xs">Tracking number</dt>
                  <dd className="font-mono text-xs">{order.trackingNumber}</dd>
                </div>
                {order.trackingUrl ? (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-strong inline-flex items-center gap-1 pt-1 text-sm underline underline-offset-4"
                  >
                    Track with carrier <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                ) : null}
              </dl>
            ) : (
              <p className="text-ink-muted mt-3 text-sm">
                A tracking number will appear here once your parcel ships.
              </p>
            )}
          </div>
          <div className="bg-surface border-border rounded-sm border p-6">
            <h2 className="text-xs font-medium tracking-[0.12em] uppercase">Delivery address</h2>
            <div className="mt-3">
              <OrderAddress order={order} />
            </div>
          </div>
          <div className="bg-surface border-border rounded-sm border p-6 text-sm">
            <h2 className="text-xs font-medium tracking-[0.12em] uppercase">Payment</h2>
            <p className="text-ink-muted mt-3">
              {order.paymentMethod === "cod"
                ? "Cash on delivery"
                : `Card ending ${order.cardLast4 ?? "••••"}`}{" "}
              · <span className="capitalize">{order.paymentStatus}</span>
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
}
