import {
  getAttentionCounts,
  getDashboardKpis,
  getLowStock,
  getOrdersByStatus,
  getRecentOrders,
  getTopProducts,
} from "@repo/db/admin";
import { ORDER_FLOW, ORDER_STATUS_LABELS, type OrderStatus } from "@repo/shared";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  MessageSquare,
  PackageX,
  ShoppingCart,
  Star,
} from "lucide-react";
import type { Metadata, Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { RevenueChart, Sparkline, StatusBars } from "@/components/dashboard/charts";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { money, ORDER_TONE } from "@/lib/format";
import { LocalTime } from "@/components/ui/local-time";
import { requirePagePermission } from "@/lib/session";
import { storefrontLink } from "@/lib/links";

export const metadata: Metadata = { title: "Dashboard" };

const PERIODS = { today: 1, "7d": 7, "30d": 30, "90d": 90 } as const;
type Period = keyof typeof PERIODS;

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-ink-muted text-xs font-medium">New</span>;
  const up = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        up ? "text-accent-ink" : "text-danger",
      )}
    >
      {up ? (
        <ArrowUpRight className="size-3.5" aria-hidden />
      ) : (
        <ArrowDownRight className="size-3.5" aria-hidden />
      )}
      {Math.abs(value * 100).toFixed(1)}%
      <span className="sr-only">{up ? " increase" : " decrease"}</span>
    </span>
  );
}

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const session = await requirePagePermission("dashboard:view");
  const sp = await searchParams;
  const period: Period =
    typeof sp.period === "string" && sp.period in PERIODS ? (sp.period as Period) : "30d";
  const days = PERIODS[period];
  const canOrders = session.can("orders:view");

  const [kpis, attention, byStatus, top, lowStock, recent] = await Promise.all([
    getDashboardKpis(days),
    getAttentionCounts(),
    getOrdersByStatus(),
    getTopProducts(days, 5),
    session.can("products:view") ? getLowStock(3, 6) : Promise.resolve([]),
    canOrders ? getRecentOrders(6) : Promise.resolve([]),
  ]);

  const cards = [
    {
      label: "Revenue",
      value: money(kpis.current.revenue),
      delta: kpis.deltas.revenue,
      field: "revenue" as const,
    },
    {
      label: "Orders",
      value: kpis.current.orders.toLocaleString(),
      delta: kpis.deltas.orders,
      field: "orders" as const,
    },
    {
      label: "Avg. order value",
      value: money(kpis.current.aov),
      delta: kpis.deltas.aov,
      field: "revenue" as const,
    },
    {
      label: "New customers",
      value: kpis.current.newCustomers.toLocaleString(),
      delta: kpis.deltas.newCustomers,
      field: null,
    },
  ];
  const statusOrder: OrderStatus[] = [...ORDER_FLOW, "cancelled", "refunded"];
  const statusData = statusOrder.map((s) => ({
    label: ORDER_STATUS_LABELS[s],
    n: byStatus.find((b) => b.status === s)?.n ?? 0,
  }));
  const attentionItems = [
    {
      show: canOrders,
      n: attention.orders,
      label: "orders awaiting confirmation",
      href: "/orders?view=needs-confirmation",
      Icon: ShoppingCart,
    },
    {
      show: session.can("reviews:view"),
      n: attention.reviews,
      label: "reviews to moderate",
      href: "/reviews?status=pending",
      Icon: Star,
    },
    {
      show: session.can("messages:view"),
      n: attention.messages,
      label: "unread messages",
      href: "/messages",
      Icon: MessageSquare,
    },
    {
      show: session.can("products:view"),
      n: lowStock.length,
      label: "variants low on stock",
      href: "/products?stock=low",
      Icon: PackageX,
    },
  ].filter((a) => a.show);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-ink-muted">
          Welcome back, {session.name.split(" ")[0]}. Here’s how the store is doing.
        </p>
        <nav
          aria-label="Period"
          className="bg-surface border-border flex rounded-full border p-1 text-sm"
        >
          {(Object.keys(PERIODS) as Period[]).map((p) => (
            <Link
              key={p}
              href={`/?period=${p}` as Route}
              aria-current={p === period ? "true" : undefined}
              className={cn(
                "rounded-full px-3 py-1 transition-colors",
                p === period ? "bg-primary-strong text-on-strong" : "text-ink-muted hover:text-ink",
              )}
            >
              {p === "today" ? "Today" : p}
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {cards.map((c) => (
              <Card key={c.label} className="p-5">
                <p className="text-ink-muted text-sm">{c.label}</p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-2xl font-semibold tabular-nums">{c.value}</p>
                    <p className="text-ink-muted mt-1 flex items-center gap-1.5 text-xs">
                      <Delta value={c.delta} /> vs previous {period === "today" ? "day" : period}
                    </p>
                  </div>
                  {c.field ? <Sparkline data={kpis.series} field={c.field} /> : null}
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Sales performance</CardTitle>
                <p className="text-ink-muted text-sm">
                  Revenue per day, last {Math.max(days, 7)} days
                </p>
              </div>
            </CardHeader>
            <RevenueChart data={kpis.series} />
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardTitle className="mb-4">Orders by status</CardTitle>
              <StatusBars data={statusData} />
            </Card>
            <Card>
              <CardTitle className="mb-2">Top products</CardTitle>
              {top.length ? (
                <ul className="divide-border divide-y">
                  {top.map((p, i) => (
                    <li
                      key={`${p.productId ?? p.title}-${i}`}
                      className="flex items-center gap-3 py-3"
                    >
                      <div className="bg-surface-muted rounded-control relative size-10 shrink-0 overflow-hidden">
                        {p.image ? (
                          <Image
                            src={storefrontLink(p.image)}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{p.title}</p>
                        <p className="text-ink-muted text-xs">{p.units} sold</p>
                      </div>
                      <p className="text-sm font-medium tabular-nums">{money(p.revenue)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-ink-muted py-8 text-center text-sm">
                  No sales in this period yet.
                </p>
              )}
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardTitle className="mb-4 flex items-center gap-2">
              <AlertTriangle className="text-warning-ink size-4" aria-hidden /> Needs attention
            </CardTitle>
            <ul className="space-y-2">
              {attentionItems.map(({ n, label, href, Icon }) => (
                <li key={label}>
                  <Link
                    href={href as Route}
                    className={cn(
                      "rounded-control flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                      n ? "bg-primary-soft hover:brightness-95" : "hover:bg-surface-muted",
                    )}
                  >
                    <Icon className="text-accent-ink size-4" aria-hidden />
                    <span className="flex-1">
                      <strong className="font-semibold tabular-nums">{n}</strong> {label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {lowStock.length ? (
              <div className="border-border mt-4 border-t pt-4">
                <p className="text-ink-muted mb-2 text-xs font-medium tracking-wide uppercase">
                  Low stock
                </p>
                <ul className="space-y-1.5 text-sm">
                  {lowStock.map((v) => (
                    <li key={v.sku} className="flex justify-between gap-3">
                      <Link
                        href={`/products/${v.productId}` as Route}
                        className="inline-flex min-h-7 min-w-0 items-center truncate hover:underline"
                      >
                        {v.title} <span className="text-ink-muted text-xs">{v.sku}</span>
                      </Link>
                      <span
                        className={cn(
                          "tabular-nums",
                          v.stock === 0 ? "text-danger" : "text-warning-ink",
                        )}
                      >
                        {v.stock}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Card>

          {canOrders ? (
            <Card>
              <CardHeader className="mb-2">
                <CardTitle>Recent orders</CardTitle>
                <Link
                  href={"/orders"}
                  className="text-accent-ink inline-flex min-h-7 items-center text-sm hover:underline"
                >
                  View all
                </Link>
              </CardHeader>
              <ul className="divide-border divide-y">
                {recent.map((o) => (
                  <li key={o.orderNumber}>
                    <Link
                      href={`/orders?selected=${o.orderNumber}` as Route}
                      className="hover:bg-surface-muted rounded-control -mx-2 flex items-center gap-3 px-2 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{o.name}</p>
                        <p className="text-ink-muted text-xs">
                          {o.orderNumber} · <LocalTime value={o.placedAt} format="ago" />
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm tabular-nums">{money(o.totalCents)}</p>
                        <Badge tone={ORDER_TONE[o.status]} className="mt-0.5">
                          {ORDER_STATUS_LABELS[o.status]}
                        </Badge>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
