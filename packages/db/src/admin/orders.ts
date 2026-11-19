import {
  planTransition,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from "@repo/shared";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { db as sharedDb, type Database } from "../client";
import {
  orderEvents,
  orderItems,
  orderNotes,
  orders,
  payments,
  products,
  productVariants,
} from "../schema";

export const ORDER_VIEWS = {
  "needs-confirmation": { label: "Needs confirmation", where: () => eq(orders.status, "pending") },
  "ready-to-ship": {
    label: "Ready to ship",
    where: () => inArray(orders.status, ["confirmed", "processing"]),
  },
  "in-transit": {
    label: "In transit",
    where: () => inArray(orders.status, ["shipped", "out_for_delivery"]),
  },
  "cod-pending": {
    label: "COD to collect",
    where: () =>
      and(
        eq(orders.paymentMethod, "cod"),
        eq(orders.paymentStatus, "pending"),
        sql`${orders.status} not in ('cancelled','refunded')`,
      ),
  },
} as const;
export type OrderView = keyof typeof ORDER_VIEWS;

export type OrderListFilters = {
  q?: string | undefined;
  status?: OrderStatus | undefined;
  paymentMethod?: PaymentMethod | undefined;
  paymentStatus?: PaymentStatus | undefined;
  from?: Date | undefined;
  to?: Date | undefined;
  view?: OrderView | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
};

function orderWhere(f: OrderListFilters): SQL | undefined {
  const where: (SQL | undefined)[] = [];
  if (f.view) where.push(ORDER_VIEWS[f.view].where());
  if (f.status) where.push(eq(orders.status, f.status));
  if (f.paymentMethod) where.push(eq(orders.paymentMethod, f.paymentMethod));
  if (f.paymentStatus) where.push(eq(orders.paymentStatus, f.paymentStatus));
  if (f.from) where.push(gte(orders.placedAt, f.from));
  if (f.to) where.push(lte(orders.placedAt, f.to));
  if (f.q?.trim()) {
    const like = `%${f.q.trim().replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    where.push(
      or(
        ilike(orders.orderNumber, like),
        ilike(orders.email, like),
        sql`${orders.shippingAddress}->>'name' ilike ${like}`,
      ),
    );
  }
  return where.length ? and(...where) : undefined;
}

export async function listAdminOrders(f: OrderListFilters, db: Database = sharedDb) {
  const where = orderWhere(f);
  const [rows, [total], statusCounts] = await Promise.all([
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        email: orders.email,
        customerName: sql<string>`${orders.shippingAddress}->>'name'`,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        totalCents: orders.totalCents,
        placedAt: orders.placedAt,
        itemCount: sql<number>`(select coalesce(sum(oi.quantity),0)::int from ${orderItems} oi where oi.order_id = ${sql.raw(`"orders"."id"`)})`,
      })
      .from(orders)
      .where(where)
      .orderBy(desc(orders.placedAt))
      .limit(Math.min(f.limit ?? 50, 500))
      .offset(f.offset ?? 0),
    db.select({ n: count() }).from(orders).where(where),
    db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status),
  ]);
  return {
    rows,
    total: total?.n ?? 0,
    statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s.n])) as Partial<
      Record<OrderStatus, number>
    >,
  };
}

export async function getAdminOrderDetail(orderNumber: string, db: Database = sharedDb) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.orderNumber, orderNumber.trim().toUpperCase()),
    with: {
      items: true,
      events: {
        orderBy: [asc(orderEvents.occurredAt)],
        with: { author: { columns: { name: true } } },
      },
      notes: {
        orderBy: [desc(orderNotes.createdAt)],
        with: { author: { columns: { name: true } } },
      },
      payments: true,
      customer: true,
    },
  });
  if (!order) return null;
  const [history] = order.customerId
    ? await db
        .select({ orders: count(), spent: sql<number>`coalesce(sum(${orders.totalCents}),0)::int` })
        .from(orders)
        .where(
          and(
            eq(orders.customerId, order.customerId),
            sql`${orders.status} not in ('cancelled','refunded')`,
          ),
        )
    : [undefined];
  return { ...order, customerHistory: history ?? null };
}

export class OrderWorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderWorkflowError";
  }
}

/**
 * Moves an order to a new status in one transaction: validates the transition, stamps the
 * timestamp, adds the public tracking event, restores stock on cancel and settles payments
 * (COD paid on delivery, refunds). Returns the before/after for the audit log.
 */
export async function transitionOrder(
  orderNumber: string,
  to: OrderStatus,
  actorId: string,
  extra: { note?: string | undefined; location?: string | undefined } = {},
  db: Database = sharedDb,
) {
  return db.transaction(async (tx) => {
    const [order] = await tx
      .select({
        id: orders.id,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
      })
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .for("update")
      .limit(1);
    if (!order) throw new OrderWorkflowError("Order not found.");
    let plan;
    try {
      plan = planTransition(order, to);
    } catch (e) {
      throw new OrderWorkflowError((e as Error).message);
    }

    await tx
      .update(orders)
      .set({
        status: to,
        ...(plan.timestamp ? { [plan.timestamp]: new Date() } : {}),
        ...(plan.paymentStatus ? { paymentStatus: plan.paymentStatus } : {}),
      })
      .where(eq(orders.id, order.id));

    if (plan.restock) {
      const items = await tx
        .select({
          variantId: orderItems.variantId,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      for (const it of items) {
        if (it.variantId) {
          await tx
            .update(productVariants)
            .set({ stockQty: sql`${productVariants.stockQty} + ${it.quantity}` })
            .where(eq(productVariants.id, it.variantId));
        }
        if (it.productId) {
          await tx
            .update(products)
            .set({ salesCount: sql`greatest(${products.salesCount} - ${it.quantity}, 0)` })
            .where(eq(products.id, it.productId));
        }
      }
    }

    if (plan.paymentStatus) {
      await tx
        .update(payments)
        .set({ status: plan.paymentStatus })
        .where(eq(payments.orderId, order.id));
    }

    await tx.insert(orderEvents).values({
      orderId: order.id,
      status: to,
      title: plan.event.title,
      description: extra.note?.trim() || plan.event.description,
      location: extra.location?.trim() || null,
      isPublic: true,
      createdBy: actorId,
    });

    return {
      before: order.status,
      after: to,
      paymentBefore: order.paymentStatus,
      paymentAfter: plan.paymentStatus ?? order.paymentStatus,
      restocked: plan.restock,
    };
  });
}

export async function updateOrderTracking(
  orderNumber: string,
  input: {
    carrier: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    estimatedDelivery: string | null;
  },
  db: Database = sharedDb,
) {
  const [before] = await db
    .select({
      id: orders.id,
      carrier: orders.carrier,
      trackingNumber: orders.trackingNumber,
      trackingUrl: orders.trackingUrl,
      estimatedDelivery: orders.estimatedDelivery,
    })
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);
  if (!before) throw new OrderWorkflowError("Order not found.");
  await db.update(orders).set(input).where(eq(orders.id, before.id));
  return before;
}

export async function addOrderEvent(
  orderNumber: string,
  input: {
    title: string;
    description: string;
    location?: string | null | undefined;
    occurredAt?: Date | undefined;
    isPublic: boolean;
  },
  actorId: string,
  db: Database = sharedDb,
) {
  const [o] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);
  if (!o) throw new OrderWorkflowError("Order not found.");
  await db.insert(orderEvents).values({
    orderId: o.id,
    status: null,
    title: input.title,
    description: input.description,
    location: input.location ?? null,
    isPublic: input.isPublic,
    createdBy: actorId,
    occurredAt: input.occurredAt ?? new Date(),
  });
}

export async function addOrderNote(
  orderNumber: string,
  body: string,
  actorId: string,
  db: Database = sharedDb,
) {
  const [o] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);
  if (!o) throw new OrderWorkflowError("Order not found.");
  await db.insert(orderNotes).values({ orderId: o.id, authorId: actorId, body });
}

/** Marks a COD order as paid without changing its status (e.g. cash collected early). */
export async function markOrderPaid(orderNumber: string, db: Database = sharedDb) {
  const [o] = await db
    .select({
      id: orders.id,
      paymentStatus: orders.paymentStatus,
      paymentMethod: orders.paymentMethod,
    })
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);
  if (!o) throw new OrderWorkflowError("Order not found.");
  if (o.paymentStatus !== "pending")
    throw new OrderWorkflowError("This order isn't awaiting payment.");
  await db.update(orders).set({ paymentStatus: "paid" }).where(eq(orders.id, o.id));
  await db.update(payments).set({ status: "paid" }).where(eq(payments.orderId, o.id));
}

/** Orders placed after `since` (live new-order notifications). */
export async function ordersSince(since: Date, db: Database = sharedDb) {
  return db
    .select({
      orderNumber: orders.orderNumber,
      totalCents: orders.totalCents,
      placedAt: orders.placedAt,
      name: sql<string>`${orders.shippingAddress}->>'name'`,
    })
    .from(orders)
    .where(gte(orders.placedAt, since))
    .orderBy(desc(orders.placedAt))
    .limit(10);
}

/** Flat rows for CSV export. */
export async function exportOrders(f: OrderListFilters, db: Database = sharedDb) {
  const where = orderWhere(f);
  return db
    .select({
      orderNumber: orders.orderNumber,
      placedAt: orders.placedAt,
      status: orders.status,
      email: orders.email,
      name: sql<string>`${orders.shippingAddress}->>'name'`,
      city: sql<string>`${orders.shippingAddress}->>'city'`,
      country: sql<string>`${orders.shippingAddress}->>'country'`,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
      subtotalCents: orders.subtotalCents,
      shippingCents: orders.shippingCents,
      totalCents: orders.totalCents,
      carrier: orders.carrier,
      trackingNumber: orders.trackingNumber,
    })
    .from(orders)
    .where(where)
    .orderBy(desc(orders.placedAt))
    .limit(5000);
}
