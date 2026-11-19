import "server-only";
import { getOrderByNumber } from "@repo/db";
import type { OrderStatus } from "@repo/shared";

/** Customer-safe view of an order: no internal notes, no private events, no payment refs. */
export type PublicOrder = {
  orderNumber: string;
  email: string;
  status: OrderStatus;
  paymentMethod: "cod" | "card_demo";
  paymentStatus: string;
  cardLast4: string | null;
  subtotalCents: number;
  shippingCents: number;
  feeCents: number;
  taxCents: number;
  totalCents: number;
  deliveryMethod: string;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  estimatedDelivery: string | null;
  placedAt: string;
  address: {
    name: string;
    line1: string;
    line2?: string | undefined;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: {
    id: string;
    title: string;
    variant: string;
    image: string | null;
    quantity: number;
    totalCents: number;
  }[];
  events: {
    id: string;
    status: OrderStatus | null;
    title: string;
    description: string;
    location: string | null;
    occurredAt: string;
  }[];
};

export async function getPublicOrder(orderNumber: string): Promise<PublicOrder | null> {
  const o = await getOrderByNumber(orderNumber);
  if (!o) return null;
  return {
    orderNumber: o.orderNumber,
    email: o.email,
    status: o.status,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    cardLast4: o.payments[0]?.cardLast4 ?? null,
    subtotalCents: o.subtotalCents,
    shippingCents: o.shippingCents,
    feeCents: o.feeCents,
    taxCents: o.taxCents,
    totalCents: o.totalCents,
    deliveryMethod: o.deliveryMethod,
    carrier: o.carrier,
    trackingNumber: o.trackingNumber,
    trackingUrl: o.trackingUrl,
    estimatedDelivery: o.estimatedDelivery,
    placedAt: o.placedAt.toISOString(),
    address: o.shippingAddress,
    items: o.items.map((i) => ({
      id: i.id,
      title: i.titleSnapshot,
      variant: i.variantSnapshot,
      image: i.imageSnapshot,
      quantity: i.quantity,
      totalCents: i.totalCents,
    })),
    events: o.events
      .filter((e) => e.isPublic)
      .map((e) => ({
        id: e.id,
        status: e.status,
        title: e.title,
        description: e.description,
        location: e.location,
        occurredAt: e.occurredAt.toISOString(),
      })),
  };
}
