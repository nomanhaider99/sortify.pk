export const PRODUCT_STATUSES = ["draft", "active", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const MESSAGE_STATUSES = ["unread", "read", "archived"] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export const PAYMENT_METHODS = ["cod", "card_demo"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const DELIVERY_METHODS = ["standard", "express"] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

export const PRODUCT_SORTS = [
  "featured",
  "newest",
  "price_asc",
  "price_desc",
  "best_selling",
] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Happy-path order of statuses, used by steppers/timelines. */
export const ORDER_FLOW: readonly OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Order placed",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

/** Valid status transitions, enforced server-side. */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["out_for_delivery", "delivered"],
  out_for_delivery: ["delivered"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

/** The primary "next logical action" for an order in the admin. */
export function nextOrderStatus(status: OrderStatus): OrderStatus | null {
  const idx = ORDER_FLOW.indexOf(status);
  if (idx === -1 || idx === ORDER_FLOW.length - 1) return null;
  return ORDER_FLOW[idx + 1] ?? null;
}

/** Settings keys stored in the `settings` table. */
export const SETTINGS_KEYS = [
  "store",
  "hero",
  "announcement",
  "shipping",
  "payments",
  "tax",
] as const;
export type SettingsKey = (typeof SETTINGS_KEYS)[number];
