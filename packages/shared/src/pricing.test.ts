import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  checkoutSchema,
  computeTotals,
  freeShippingProgress,
  isFutureExpiry,
  shippingFor,
} from "./index";

const base = {
  shipping: DEFAULT_SETTINGS.shipping, // standard 2500, express 6500, free over 15000
  payments: { ...DEFAULT_SETTINGS.payments, codFeeCents: 300 },
  tax: { rateBps: 0, includedInPrices: true },
};

describe("pricing", () => {
  it("adds standard shipping under the threshold", () => {
    const t = computeTotals({
      ...base,
      lines: [{ unitPriceCents: 3900, quantity: 2 }],
      deliveryMethod: "standard",
      paymentMethod: "card_demo",
    });
    expect(t).toMatchObject({
      subtotalCents: 7800,
      shippingCents: 2500,
      feeCents: 0,
      totalCents: 10300,
    });
    expect(t.freeShipping).toBe(false);
  });

  it("ships free at/over the threshold (standard only)", () => {
    expect(shippingFor(15000, "standard", base.shipping)).toEqual({ cents: 0, free: true });
    expect(shippingFor(15000, "express", base.shipping)).toEqual({ cents: 6500, free: false });
  });

  it("adds the COD fee for cash on delivery", () => {
    const t = computeTotals({
      ...base,
      lines: [{ unitPriceCents: 20000, quantity: 1 }],
      deliveryMethod: "standard",
      paymentMethod: "cod",
    });
    expect(t).toMatchObject({ shippingCents: 0, feeCents: 300, totalCents: 20300 });
  });

  it("adds tax on top when prices exclude tax, rounding to the cent", () => {
    const t = computeTotals({
      ...base,
      tax: { rateBps: 825, includedInPrices: false },
      lines: [{ unitPriceCents: 1999, quantity: 3 }],
      deliveryMethod: "express",
      paymentMethod: "card_demo",
    });
    expect(t.taxCents).toBe(Math.round(5997 * 0.0825));
    expect(t.totalCents).toBe(5997 + 6500 + t.taxCents);
  });

  it("never lets a discount exceed the subtotal", () => {
    const t = computeTotals({
      ...base,
      discountCents: 99999,
      lines: [{ unitPriceCents: 1000, quantity: 1 }],
      deliveryMethod: "standard",
      paymentMethod: "card_demo",
    });
    expect(t.discountCents).toBe(1000);
    expect(t.totalCents).toBe(2500);
  });

  it("an empty cart costs nothing", () => {
    const t = computeTotals({
      ...base,
      lines: [],
      deliveryMethod: "standard",
      paymentMethod: "cod",
    });
    expect(t.shippingCents).toBe(0);
  });

  it("reports free-shipping progress", () => {
    expect(freeShippingProgress(7500, 15000)).toEqual({ progress: 0.5, remainingCents: 7500 });
    expect(freeShippingProgress(20000, 15000)).toEqual({ progress: 1, remainingCents: 0 });
  });
});

describe("checkout schema", () => {
  const valid = {
    email: "Jane@Example.com",
    phone: "+1 555 010 2030",
    newsletter: false,
    address: {
      name: "Jane Doe",
      line1: "1 Main Street",
      city: "Portland",
      state: "OR",
      postalCode: "97205",
      country: "US",
      phone: "+1 555 010 2030",
    },
    deliveryMethod: "standard",
    paymentMethod: "cod",
    lines: [{ variantId: "0b5c3a52-7c2e-4f3e-9a0e-3b8f6c1d2e4f", quantity: 1 }],
    idempotencyKey: "7d2f0c1a-2b3c-4d5e-8f90-a1b2c3d4e5f6",
  };

  it("accepts a COD order and normalises the email", () => {
    const r = checkoutSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("jane@example.com");
  });

  it("requires valid card details for card payments only", () => {
    expect(checkoutSchema.safeParse({ ...valid, paymentMethod: "card_demo" }).success).toBe(false);
    const card = { number: "4242 4242 4242 4242", expiry: "12 / 40", cvc: "123", name: "Jane Doe" };
    expect(checkoutSchema.safeParse({ ...valid, paymentMethod: "card_demo", card }).success).toBe(
      true,
    );
    const expired = checkoutSchema.safeParse({
      ...valid,
      paymentMethod: "card_demo",
      card: { ...card, expiry: "01/20" },
    });
    expect(expired.success).toBe(false);
    if (!expired.success) expect(expired.error.issues[0]?.path).toEqual(["card", "expiry"]);
    // Empty card fields are ignored for cash on delivery.
    expect(checkoutSchema.safeParse({ ...valid, card: { number: "" } }).success).toBe(true);
  });

  it("validates expiry dates", () => {
    const now = new Date(Date.UTC(2026, 10, 18));
    expect(isFutureExpiry("11/26", now)).toBe(true);
    expect(isFutureExpiry("10/26", now)).toBe(false);
    expect(isFutureExpiry("13/30", now)).toBe(false);
  });
});
