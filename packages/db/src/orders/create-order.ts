import {
  ORDER_STATUS_LABELS,
  generateOrderNumber,
  type DeliveryMethod,
  type PaymentMethod,
  type PaymentStatus,
  type Totals,
} from "@repo/shared";
import { and, eq, gte, sql } from "drizzle-orm";
import { db as sharedDb, type Database } from "../client";
import type { CartVariant } from "../queries/cart";
import {
  addresses,
  customers,
  newsletterSubscribers,
  orderEvents,
  orderItems,
  orders,
  payments,
  products,
  productVariants,
  type AddressSnapshot,
} from "../schema";

export class OutOfStockError extends Error {
  constructor(
    public readonly variantId: string,
    public readonly title: string,
  ) {
    super(`${title} is out of stock`);
    this.name = "OutOfStockError";
  }
}

export type CreateOrderInput = {
  email: string;
  phone: string;
  newsletter: boolean;
  address: AddressSnapshot;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  note?: string | undefined;
  /** Lines priced from the database (never from the client). */
  lines: { variant: CartVariant; quantity: number }[];
  totals: Totals;
  currency: string;
  orderPrefix: string;
  idempotencyKey: string;
  payment: {
    status: PaymentStatus;
    cardBrand?: string | undefined;
    cardLast4?: string | undefined;
    providerRef?: string | undefined;
  };
};

/**
 * Creates an order atomically: decrements stock (conditionally, so concurrent checkouts cannot
 * oversell), snapshots line items, stores the address, the first public tracking event and the
 * payment record. Re-submitting the same idempotency key returns the existing order.
 */
export async function createOrder(
  input: CreateOrderInput,
  db: Database = sharedDb,
): Promise<{ orderNumber: string; orderId: string; existing: boolean }> {
  const existing = await db
    .select({ id: orders.id, orderNumber: orders.orderNumber })
    .from(orders)
    .where(eq(orders.idempotencyKey, input.idempotencyKey))
    .limit(1);
  if (existing[0])
    return { orderId: existing[0].id, orderNumber: existing[0].orderNumber, existing: true };

  return db.transaction(async (tx) => {
    // 1. Stock — conditional decrement; zero rows updated means not enough left.
    for (const line of input.lines) {
      const updated = await tx
        .update(productVariants)
        .set({ stockQty: sql`${productVariants.stockQty} - ${line.quantity}` })
        .where(
          and(
            eq(productVariants.id, line.variant.variantId),
            gte(productVariants.stockQty, line.quantity),
          ),
        )
        .returning({ id: productVariants.id });
      if (!updated.length) throw new OutOfStockError(line.variant.variantId, line.variant.title);
      await tx
        .update(products)
        .set({ salesCount: sql`${products.salesCount} + ${line.quantity}` })
        .where(eq(products.id, line.variant.productId));
    }

    // 2. Customer (guest checkout creates/updates a customer record by email).
    const [found] = await tx
      .select({ id: customers.id })
      .from(customers)
      .where(sql`lower(${customers.email}) = ${input.email.toLowerCase()}`)
      .limit(1);
    const [customer] = found
      ? await tx
          .update(customers)
          .set({
            name: input.address.name,
            phone: input.phone,
            ...(input.newsletter ? { acceptsMarketing: true } : {}),
          })
          .where(eq(customers.id, found.id))
          .returning({ id: customers.id })
      : await tx
          .insert(customers)
          .values({
            email: input.email,
            name: input.address.name,
            phone: input.phone,
            acceptsMarketing: input.newsletter,
          })
          .returning({ id: customers.id });

    if (input.newsletter) {
      await tx
        .insert(newsletterSubscribers)
        .values({ email: input.email, source: "checkout" })
        .onConflictDoNothing();
    }

    // 3. Order with a unique, human-friendly number (retry on the rare collision).
    let order: { id: string; orderNumber: string } | undefined;
    for (let attempt = 0; attempt < 5 && !order; attempt++) {
      const orderNumber = generateOrderNumber(new Date(), input.orderPrefix);
      const rows = await tx
        .insert(orders)
        .values({
          orderNumber,
          customerId: customer?.id ?? null,
          email: input.email,
          phone: input.phone,
          status: "pending",
          paymentMethod: input.paymentMethod,
          paymentStatus: input.payment.status,
          subtotalCents: input.totals.subtotalCents,
          shippingCents: input.totals.shippingCents,
          taxCents: input.totals.taxCents,
          discountCents: input.totals.discountCents,
          feeCents: input.totals.feeCents,
          totalCents: input.totals.totalCents,
          currency: input.currency,
          shippingAddress: input.address,
          deliveryMethod: input.deliveryMethod,
          note: input.note ?? null,
          idempotencyKey: input.idempotencyKey,
        })
        .onConflictDoNothing({ target: orders.orderNumber })
        .returning({ id: orders.id, orderNumber: orders.orderNumber });
      order = rows[0];
    }
    if (!order) throw new Error("Could not allocate an order number");

    // 4. Snapshots, address, tracking event, payment.
    await tx.insert(orderItems).values(
      input.lines.map((l) => ({
        orderId: order.id,
        productId: l.variant.productId,
        variantId: l.variant.variantId,
        titleSnapshot: l.variant.title,
        variantSnapshot: l.variant.variantLabel,
        imageSnapshot: l.variant.image,
        sku: l.variant.sku,
        unitPriceCents: l.variant.priceCents,
        quantity: l.quantity,
        totalCents: l.variant.priceCents * l.quantity,
      })),
    );
    await tx
      .insert(addresses)
      .values({ orderId: order.id, customerId: customer?.id ?? null, ...input.address });
    await tx.insert(orderEvents).values({
      orderId: order.id,
      status: "pending",
      title: ORDER_STATUS_LABELS.pending,
      description:
        input.paymentMethod === "cod"
          ? "We've received your order. You'll pay in cash when it's delivered."
          : "We've received your order and payment. We'll confirm it shortly.",
    });
    await tx.insert(payments).values({
      orderId: order.id,
      provider: input.paymentMethod,
      status: input.payment.status,
      amountCents: input.totals.totalCents,
      cardBrand: input.payment.cardBrand ?? null,
      cardLast4: input.payment.cardLast4 ?? null,
      providerRef: input.payment.providerRef ?? null,
    });

    return { orderId: order.id, orderNumber: order.orderNumber, existing: false };
  });
}
