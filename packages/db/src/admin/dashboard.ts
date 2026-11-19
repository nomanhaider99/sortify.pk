import { and, asc, count, desc, eq, gte, lt, lte, sql } from "drizzle-orm";
import { db as sharedDb, type Database } from "../client";
import { customers, orderItems, orders, products, productVariants } from "../schema";

const DAY = 86_400_000;
/** Revenue only counts orders that weren't cancelled/refunded. */
const counted = sql`${orders.status} not in ('cancelled','refunded')`;

async function periodStats(from: Date, to: Date, db: Database) {
  const [o] = await db
    .select({
      revenue: sql<number>`coalesce(sum(${orders.totalCents}),0)::int`,
      orders: count(),
    })
    .from(orders)
    .where(and(counted, gte(orders.placedAt, from), lt(orders.placedAt, to)));
  const [c] = await db
    .select({ n: count() })
    .from(customers)
    .where(and(gte(customers.createdAt, from), lt(customers.createdAt, to)));
  const revenue = o?.revenue ?? 0;
  const n = o?.orders ?? 0;
  return { revenue, orders: n, aov: n ? Math.round(revenue / n) : 0, newCustomers: c?.n ?? 0 };
}

/** Relative change vs the previous period; null when there is no baseline to compare with. */
const delta = (cur: number, prev: number): number | null =>
  prev === 0 ? null : (cur - prev) / prev;

/** KPI cards for the last `days` days vs the previous period, plus daily sparkline series. */
export async function getDashboardKpis(days: number, db: Database = sharedDb) {
  const now = new Date();
  const start = new Date(now.getTime() - days * DAY);
  const prevStart = new Date(start.getTime() - days * DAY);
  const [cur, prev, series] = await Promise.all([
    periodStats(start, now, db),
    periodStats(prevStart, start, db),
    getRevenueSeries(Math.max(days, 7), db),
  ]);
  return {
    current: cur,
    deltas: {
      revenue: delta(cur.revenue, prev.revenue),
      orders: delta(cur.orders, prev.orders),
      aov: delta(cur.aov, prev.aov),
      newCustomers: delta(cur.newCustomers, prev.newCustomers),
    },
    series,
  };
}

/** Daily revenue + order counts for the last `days` days (zero-filled, UTC days). */
export async function getRevenueSeries(days: number, db: Database = sharedDb) {
  const since = new Date(Date.now() - (days - 1) * DAY);
  since.setUTCHours(0, 0, 0, 0);
  const rows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', timezone('UTC', ${orders.placedAt})), 'YYYY-MM-DD')`,
      revenue: sql<number>`coalesce(sum(${orders.totalCents}),0)::int`,
      orders: count(),
    })
    .from(orders)
    .where(and(counted, gte(orders.placedAt, since)))
    .groupBy(sql`date_trunc('day', timezone('UTC', ${orders.placedAt}))`);
  const byDay = new Map(rows.map((r) => [r.day, r]));
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(since.getTime() + i * DAY);
    const key = d.toISOString().slice(0, 10);
    const r = byDay.get(key);
    return { day: key, revenue: r?.revenue ?? 0, orders: r?.orders ?? 0 };
  });
}

export async function getOrdersByStatus(db: Database = sharedDb) {
  return db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status);
}

export async function getTopProducts(days: number, limit = 5, db: Database = sharedDb) {
  const since = new Date(Date.now() - days * DAY);
  return db
    .select({
      productId: orderItems.productId,
      title: orderItems.titleSnapshot,
      image: sql<string | null>`max(${orderItems.imageSnapshot})`,
      units: sql<number>`sum(${orderItems.quantity})::int`,
      revenue: sql<number>`sum(${orderItems.totalCents})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(and(counted, gte(orders.placedAt, since)))
    .groupBy(orderItems.productId, orderItems.titleSnapshot)
    .orderBy(desc(sql`sum(${orderItems.totalCents})`))
    .limit(limit);
}

export async function getLowStock(threshold = 3, limit = 6, db: Database = sharedDb) {
  return db
    .select({
      productId: products.id,
      title: products.title,
      sku: productVariants.sku,
      stock: productVariants.stockQty,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(
      and(
        eq(products.status, "active"),
        eq(productVariants.isActive, true),
        lte(productVariants.stockQty, threshold),
      ),
    )
    .orderBy(asc(productVariants.stockQty))
    .limit(limit);
}

export async function getRecentOrders(limit = 6, db: Database = sharedDb) {
  return db
    .select({
      orderNumber: orders.orderNumber,
      name: sql<string>`${orders.shippingAddress}->>'name'`,
      status: orders.status,
      totalCents: orders.totalCents,
      placedAt: orders.placedAt,
    })
    .from(orders)
    .orderBy(desc(orders.placedAt))
    .limit(limit);
}
