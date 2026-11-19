import { getAdminCustomer } from "@repo/db/admin";
import { ORDER_STATUS_LABELS } from "@repo/shared";
import { ArrowLeft } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { money, ORDER_TONE } from "@/lib/format";
import { LocalTime } from "@/components/ui/local-time";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Customer" };

export default async function CustomerPage({ params }: PageProps<"/customers/[id]">) {
  const session = await requirePagePermission("customers:view");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const c = await getAdminCustomer(id);
  if (!c) notFound();
  const counted = c.orders.filter((o) => o.status !== "cancelled" && o.status !== "refunded");
  const spent = counted.reduce((s, o) => s + o.totalCents, 0);
  const canOrders = session.can("orders:view");

  return (
    <div className="space-y-6">
      <Link
        href={"/customers"}
        className="text-ink-muted hover:text-ink inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden /> Customers
      </Link>
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">{c.name}</h2>
            <p className="text-ink-muted text-sm">
              Customer since <LocalTime value={c.createdAt} format="date" />
            </p>
          </div>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-ink-muted text-xs">Email</dt>
              <dd>
                <a href={`mailto:${c.email}`} className="hover:underline">
                  {c.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted text-xs">Phone</dt>
              <dd>{c.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-ink-muted text-xs">Marketing</dt>
              <dd>{c.acceptsMarketing ? "Subscribed" : "Not subscribed"}</dd>
            </div>
          </dl>
          <div className="border-border grid grid-cols-3 gap-2 border-t pt-4 text-center">
            <div>
              <p className="text-lg font-semibold tabular-nums">{c.orders.length}</p>
              <p className="text-ink-muted text-xs">Orders</p>
            </div>
            <div>
              <p className="text-lg font-semibold tabular-nums">{money(spent)}</p>
              <p className="text-ink-muted text-xs">Spent</p>
            </div>
            <div>
              <p className="text-lg font-semibold tabular-nums">
                {money(counted.length ? Math.round(spent / counted.length) : 0)}
              </p>
              <p className="text-ink-muted text-xs">AOV</p>
            </div>
          </div>
        </Card>
        <Card className="p-0">
          <CardTitle className="p-5 pb-3">Order history</CardTitle>
          <Table>
            <THead>
              <TR>
                <TH>Order</TH>
                <TH>Placed</TH>
                <TH>Status</TH>
                <TH>Total</TH>
              </TR>
            </THead>
            <TBody>
              {c.orders.map((o) => (
                <TR key={o.id}>
                  <TD>
                    {canOrders ? (
                      <Link
                        href={`/orders?selected=${o.orderNumber}` as Route}
                        className="font-medium hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                    ) : (
                      o.orderNumber
                    )}
                  </TD>
                  <TD className="text-ink-muted text-sm">
                    <LocalTime value={o.placedAt} />
                  </TD>
                  <TD>
                    <Badge tone={ORDER_TONE[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                  </TD>
                  <TD className="tabular-nums">{money(o.totalCents)}</TD>
                </TR>
              ))}
              {!c.orders.length ? (
                <TR>
                  <TD colSpan={4} className="text-ink-muted py-10 text-center">
                    No orders yet.
                  </TD>
                </TR>
              ) : null}
            </TBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
