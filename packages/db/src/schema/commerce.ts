import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { adminUsers } from "./admin";
import { products, productVariants } from "./catalog";
import {
  deliveryMethodEnum,
  id,
  orderStatusEnum,
  paymentMethodEnum,
  paymentStatusEnum,
  timestamps,
} from "./_common";

export type AddressSnapshot = {
  name: string;
  line1: string;
  line2?: string | undefined;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
};

export const customers = pgTable(
  "customers",
  {
    id: id(),
    email: text("email").notNull(),
    name: text("name").notNull().default(""),
    phone: text("phone"),
    passwordHash: text("password_hash"),
    acceptsMarketing: boolean("accepts_marketing").notNull().default(false),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("customers_email_uq").on(sql`lower(${t.email})`),
    index("customers_name_search_idx").on(sql`lower(${t.name})`),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: id(),
    orderNumber: text("order_number").notNull(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    phone: text("phone").notNull().default(""),
    status: orderStatusEnum("status").notNull().default("pending"),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
    subtotalCents: integer("subtotal_cents").notNull(),
    shippingCents: integer("shipping_cents").notNull().default(0),
    taxCents: integer("tax_cents").notNull().default(0),
    discountCents: integer("discount_cents").notNull().default(0),
    /** COD handling fee (settings.payments.codFeeCents at time of order). */
    feeCents: integer("fee_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    currency: text("currency").notNull().default("USD"),
    shippingAddress: jsonb("shipping_address").$type<AddressSnapshot>().notNull(),
    deliveryMethod: deliveryMethodEnum("delivery_method").notNull().default("standard"),
    note: text("note"),
    carrier: text("carrier"),
    trackingNumber: text("tracking_number"),
    trackingUrl: text("tracking_url"),
    estimatedDelivery: date("estimated_delivery", { mode: "string" }),
    /** Client-generated key guarding against double submission of checkout. */
    idempotencyKey: text("idempotency_key"),
    placedAt: timestamp("placed_at", { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    refundedAt: timestamp("refunded_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("orders_order_number_uq").on(t.orderNumber),
    uniqueIndex("orders_idempotency_key_uq").on(t.idempotencyKey),
    index("orders_customer_idx").on(t.customerId),
    index("orders_email_idx").on(sql`lower(${t.email})`),
    index("orders_status_idx").on(t.status, t.placedAt),
    index("orders_payment_idx").on(t.paymentMethod, t.paymentStatus),
    index("orders_placed_idx").on(t.placedAt),
    check("orders_total_nonneg", sql`${t.totalCents} >= 0`),
  ],
);

export const addresses = pgTable(
  "addresses",
  {
    id: id(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    line1: text("line1").notNull(),
    line2: text("line2"),
    city: text("city").notNull(),
    state: text("state").notNull().default(""),
    postalCode: text("postal_code").notNull(),
    country: text("country").notNull(),
    phone: text("phone").notNull().default(""),
    ...timestamps,
  },
  (t) => [
    index("addresses_customer_idx").on(t.customerId),
    index("addresses_order_idx").on(t.orderId),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: id(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    titleSnapshot: text("title_snapshot").notNull(),
    /** e.g. "Color: Sage · Material: Oak" */
    variantSnapshot: text("variant_snapshot").notNull().default(""),
    imageSnapshot: text("image_snapshot"),
    sku: text("sku").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull(),
    totalCents: integer("total_cents").notNull(),
    ...timestamps,
  },
  (t) => [
    index("order_items_order_idx").on(t.orderId),
    index("order_items_product_idx").on(t.productId),
    index("order_items_variant_idx").on(t.variantId),
    check("order_items_qty_pos", sql`${t.quantity} > 0`),
  ],
);

/** Drives the customer-facing tracking timeline (`is_public`) and the admin activity feed. */
export const orderEvents = pgTable(
  "order_events",
  {
    id: id(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    status: orderStatusEnum("status"),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    location: text("location"),
    isPublic: boolean("is_public").notNull().default(true),
    createdBy: uuid("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
    /** When the event happened (may be back-dated by staff); `created_at` is when it was logged. */
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (t) => [
    index("order_events_order_idx").on(t.orderId, t.occurredAt),
    index("order_events_created_by_idx").on(t.createdBy),
  ],
);

/** Internal staff notes on an order (never shown to the customer). */
export const orderNotes = pgTable(
  "order_notes",
  {
    id: id(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => adminUsers.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    ...timestamps,
  },
  (t) => [
    index("order_notes_order_idx").on(t.orderId),
    index("order_notes_author_idx").on(t.authorId),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: id(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: paymentMethodEnum("provider").notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),
    amountCents: integer("amount_cents").notNull(),
    cardBrand: text("card_brand"),
    cardLast4: text("card_last4"),
    providerRef: text("provider_ref"),
    error: text("error"),
    ...timestamps,
  },
  (t) => [index("payments_order_idx").on(t.orderId), index("payments_status_idx").on(t.status)],
);

/** Optional server-side cart for logged-in customers. */
export const carts = pgTable(
  "carts",
  {
    id: id(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [uniqueIndex("carts_customer_uq").on(t.customerId)],
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: id(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("cart_items_cart_variant_uq").on(t.cartId, t.variantId),
    index("cart_items_variant_idx").on(t.variantId),
    check("cart_items_qty_pos", sql`${t.quantity} > 0`),
  ],
);
