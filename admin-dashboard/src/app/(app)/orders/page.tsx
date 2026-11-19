import { getAdminOrderDetail, listAdminOrders, ORDER_VIEWS, type OrderView } from "@repo/db/admin";
import {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from "@repo/shared";
import type { Metadata } from "next";
import { BackToList } from "@/components/orders/back-to-list";
import { OrderDetail } from "@/components/orders/order-detail";
import { OrdersInbox } from "@/components/orders/orders-inbox";
import { Card } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Orders" };

const pick = <T extends string>(v: unknown, allowed: readonly T[]): T | undefined =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  const session = await requirePagePermission("orders:view");
  const sp = await searchParams;
  const filters = {
    q: typeof sp.q === "string" ? sp.q.slice(0, 80) : undefined,
    view: pick<OrderView>(sp.view, Object.keys(ORDER_VIEWS) as OrderView[]),
    status: pick<OrderStatus>(sp.status, ORDER_STATUSES),
    paymentMethod: pick<PaymentMethod>(sp.payment, PAYMENT_METHODS),
    paymentStatus: pick<PaymentStatus>(sp.paid, PAYMENT_STATUSES),
    from:
      typeof sp.from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.from)
        ? new Date(`${sp.from}T00:00:00`)
        : undefined,
    to:
      typeof sp.to === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.to)
        ? new Date(`${sp.to}T23:59:59`)
        : undefined,
    limit: 100,
  };
  const { rows, total, statusCounts } = await listAdminOrders(filters);
  const selected = typeof sp.selected === "string" ? sp.selected : rows[0]?.orderNumber;
  const detail = selected ? await getAdminOrderDetail(selected) : null;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(380px,0.9fr)_minmax(0,1.4fr)]">
      <OrdersInbox
        rows={rows.map((r) => ({ ...r, placedAt: r.placedAt.toISOString() }))}
        total={total}
        selected={detail?.orderNumber ?? null}
        statusCounts={statusCounts}
        views={Object.entries(ORDER_VIEWS).map(([key, v]) => ({ key, label: v.label }))}
        can={{
          confirm: session.can("orders:confirm"),
          update: session.can("orders:update"),
          cancel: session.can("orders:cancel"),
          export: session.can("data:export"),
        }}
      />
      <div id="order-detail" className="scroll-mt-20 xl:sticky xl:top-24 xl:self-start">
        {detail ? <BackToList /> : null}
        {detail ? (
          <OrderDetail
            order={detail}
            can={{
              confirm: session.can("orders:confirm"),
              update: session.can("orders:update"),
              ship: session.can("orders:ship"),
              cancel: session.can("orders:cancel"),
              refund: session.can("orders:refund"),
              customers: session.can("customers:view"),
            }}
          />
        ) : (
          <Card className="text-ink-muted py-20 text-center text-sm">
            No orders match these filters.
          </Card>
        )}
      </div>
    </div>
  );
}
