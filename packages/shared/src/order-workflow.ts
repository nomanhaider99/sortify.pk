import {
  ORDER_STATUS_LABELS,
  canTransitionOrder,
  nextOrderStatus,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from "./constants";
import type { Permission } from "./permissions";

/** Which permission each target status requires (PLAN §6.3 specials). */
export function permissionForTransition(to: OrderStatus): Permission {
  switch (to) {
    case "confirmed":
      return "orders:confirm";
    case "processing":
      return "orders:update";
    case "shipped":
    case "out_for_delivery":
    case "delivered":
      return "orders:ship";
    case "cancelled":
      return "orders:cancel";
    case "refunded":
      return "orders:refund";
    case "pending":
      return "orders:update";
  }
}

/** Label for the primary "next logical action" button. */
export const NEXT_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  confirmed: "Confirm order",
  processing: "Start processing",
  shipped: "Mark as shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Mark delivered",
};

export const STATUS_EVENT_COPY: Record<OrderStatus, string> = {
  pending: "We've received your order.",
  confirmed: "Your order has been confirmed and is being prepared.",
  processing: "Your items are being carefully packed.",
  shipped: "Your parcel has left our warehouse.",
  out_for_delivery: "Your parcel is out for delivery today.",
  delivered: "Your parcel was delivered. Enjoy!",
  cancelled: "This order was cancelled.",
  refunded: "Your refund has been processed.",
};

export type TransitionPlan = {
  /** Timestamp column to set to "now" (if any). */
  timestamp: "confirmedAt" | "shippedAt" | "deliveredAt" | "cancelledAt" | "refundedAt" | null;
  /** New payment status, if the transition changes it. */
  paymentStatus: PaymentStatus | null;
  /** Put the items back into stock (cancellation before shipping). */
  restock: boolean;
  /** Public tracking event to add. */
  event: { title: string; description: string };
};

/**
 * Side effects of moving an order to `to`. Throws if the transition is not allowed — the server
 * is the source of truth for the workflow (PLAN §6.4: "Enforce valid transitions server-side").
 */
export function planTransition(
  order: { status: OrderStatus; paymentMethod: PaymentMethod; paymentStatus: PaymentStatus },
  to: OrderStatus,
): TransitionPlan {
  if (!canTransitionOrder(order.status, to)) {
    throw new Error(
      `Can't move an order from ${ORDER_STATUS_LABELS[order.status]} to ${ORDER_STATUS_LABELS[to]}.`,
    );
  }
  const timestamp =
    to === "confirmed"
      ? "confirmedAt"
      : to === "shipped"
        ? "shippedAt"
        : to === "delivered"
          ? "deliveredAt"
          : to === "cancelled"
            ? "cancelledAt"
            : to === "refunded"
              ? "refundedAt"
              : null;
  let paymentStatus: PaymentStatus | null = null;
  // Cash on delivery is collected by the courier on delivery.
  if (to === "delivered" && order.paymentMethod === "cod" && order.paymentStatus === "pending")
    paymentStatus = "paid";
  if (to === "refunded" && order.paymentStatus === "paid") paymentStatus = "refunded";
  if (to === "cancelled" && order.paymentStatus === "paid") paymentStatus = "refunded";
  return {
    timestamp,
    paymentStatus,
    restock: to === "cancelled",
    event: { title: ORDER_STATUS_LABELS[to], description: STATUS_EVENT_COPY[to] },
  };
}

/** The next happy-path status and its button label, or null when the order is finished. */
export function nextAction(status: OrderStatus): { to: OrderStatus; label: string } | null {
  const to = nextOrderStatus(status);
  if (!to) return null;
  return { to, label: NEXT_ACTION_LABEL[to] ?? ORDER_STATUS_LABELS[to] };
}
