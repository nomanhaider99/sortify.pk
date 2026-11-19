import type { DeliveryMethod, PaymentMethod } from "./constants";
import type { PaymentSettings, ShippingSettings, TaxSettings } from "./schemas/settings";

export type PricedLine = { unitPriceCents: number; quantity: number };

export type Totals = {
  subtotalCents: number;
  shippingCents: number;
  feeCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  /** True when the subtotal reached the free-shipping threshold. */
  freeShipping: boolean;
};

export function subtotalOf(lines: readonly PricedLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
}

export function shippingFor(
  subtotalCents: number,
  method: DeliveryMethod,
  shipping: ShippingSettings,
): { cents: number; free: boolean } {
  if (subtotalCents <= 0) return { cents: 0, free: false };
  if (method === "express") return { cents: shipping.expressCents, free: false };
  const free = subtotalCents >= shipping.freeShippingThresholdCents;
  return { cents: free ? 0 : shipping.standardCents, free };
}

/**
 * Single source of truth for order totals (cart UI, checkout summary and the server action that
 * creates the order all call this). All amounts are integer cents.
 */
export function computeTotals(input: {
  lines: readonly PricedLine[];
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  shipping: ShippingSettings;
  payments: PaymentSettings;
  tax: TaxSettings;
  discountCents?: number;
}): Totals {
  const subtotalCents = subtotalOf(input.lines);
  const ship = shippingFor(subtotalCents, input.deliveryMethod, input.shipping);
  const feeCents = input.paymentMethod === "cod" ? input.payments.codFeeCents : 0;
  const discountCents = Math.min(Math.max(input.discountCents ?? 0, 0), subtotalCents);
  const taxable = subtotalCents - discountCents;
  // Tax included in prices → nothing is added at checkout; otherwise add it on top.
  const taxCents = input.tax.includedInPrices
    ? 0
    : Math.round((taxable * input.tax.rateBps) / 10_000);
  const totalCents = taxable + ship.cents + feeCents + taxCents;
  return {
    subtotalCents,
    shippingCents: ship.cents,
    feeCents,
    taxCents,
    discountCents,
    totalCents,
    freeShipping: ship.free,
  };
}

/** 0–1 progress towards free shipping, for the cart progress bar. */
export function freeShippingProgress(subtotalCents: number, thresholdCents: number) {
  if (thresholdCents <= 0) return { progress: 1, remainingCents: 0 };
  const remainingCents = Math.max(0, thresholdCents - subtotalCents);
  return { progress: Math.min(1, subtotalCents / thresholdCents), remainingCents };
}
