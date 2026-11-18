import { and, asc, eq, sql } from "drizzle-orm";
import { db as sharedDb, type Database } from "../client";
import { orderEvents, orders } from "../schema";

/**
 * Loads an order by its number for the admin (no email check). Includes items, all events,
 * payments and internal notes.
 */
export async function getOrderByNumber(orderNumber: string, db: Database = sharedDb) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.orderNumber, orderNumber.trim().toUpperCase()),
    with: {
      items: true,
      events: { orderBy: (e, { asc }) => [asc(e.occurredAt)] },
      payments: true,
      notes: { orderBy: (n, { desc }) => [desc(n.createdAt)] },
    },
  });
  return order ?? null;
}

/**
 * Public tracking lookup: the order is returned only if the email matches, so order numbers
 * cannot be enumerated. Only public events are included; internal notes are never exposed.
 */
export async function getOrderForTracking(
  orderNumber: string,
  email: string,
  db: Database = sharedDb,
) {
  const order = await db.query.orders.findFirst({
    where: and(
      eq(orders.orderNumber, orderNumber.trim().toUpperCase()),
      sql`lower(${orders.email}) = ${email.trim().toLowerCase()}`,
    ),
    columns: {
      id: true,
      orderNumber: true,
      email: true,
      status: true,
      paymentMethod: true,
      paymentStatus: true,
      subtotalCents: true,
      shippingCents: true,
      taxCents: true,
      discountCents: true,
      feeCents: true,
      totalCents: true,
      currency: true,
      shippingAddress: true,
      deliveryMethod: true,
      carrier: true,
      trackingNumber: true,
      trackingUrl: true,
      estimatedDelivery: true,
      placedAt: true,
      confirmedAt: true,
      shippedAt: true,
      deliveredAt: true,
      cancelledAt: true,
      refundedAt: true,
    },
    with: {
      items: {
        columns: {
          id: true,
          titleSnapshot: true,
          variantSnapshot: true,
          imageSnapshot: true,
          sku: true,
          unitPriceCents: true,
          quantity: true,
          totalCents: true,
        },
      },
      events: {
        where: eq(orderEvents.isPublic, true),
        orderBy: [asc(orderEvents.occurredAt)],
        columns: {
          id: true,
          status: true,
          title: true,
          description: true,
          location: true,
          occurredAt: true,
        },
      },
    },
  });
  return order ?? null;
}
export type TrackedOrder = NonNullable<Awaited<ReturnType<typeof getOrderForTracking>>>;
