"use server";

import { OutOfStockError, createOrder, getCartVariants, getSettings } from "@repo/db";
import { checkoutSchema, computeTotals, demoCardSchema, getPaymentProvider } from "@repo/shared";
import { grantOrderAccess } from "@/lib/order-access";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export type PlaceOrderResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string; field?: string; cartChanged?: boolean };

/**
 * Places an order. Never trusts the client: every price, stock level, shipping rate, fee and total
 * is recomputed from the database/settings here (PLAN §0 rule 5). Card numbers are used only for
 * the demo decision and are never stored.
 */
export async function placeOrder(raw: unknown): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Please check your details.",
      field: issue?.path.join("."),
    };
  }
  const input = parsed.data;

  const limited = rateLimit(`checkout:${await clientIp()}`, { limit: 10, windowMs: 10 * 60_000 });
  if (!limited.ok)
    return { ok: false, error: "Too many attempts — please wait a few minutes and try again." };

  const settings = await getSettings(["shipping", "payments", "tax", "store"]);
  if (input.paymentMethod === "cod" && !settings.payments.codEnabled) {
    return {
      ok: false,
      error: "Cash on delivery is currently unavailable.",
      field: "paymentMethod",
    };
  }
  if (input.paymentMethod === "card_demo" && !settings.payments.cardDemoEnabled) {
    return { ok: false, error: "Card payments are currently unavailable.", field: "paymentMethod" };
  }

  // Re-price and re-check stock from the database.
  const variants = await getCartVariants(input.lines.map((l) => l.variantId));
  const lines = [];
  for (const line of input.lines) {
    const v = variants.get(line.variantId);
    if (!v?.available)
      return {
        ok: false,
        error: "An item in your cart is no longer available.",
        cartChanged: true,
      };
    if (v.stockQty < line.quantity) {
      return {
        ok: false,
        error:
          v.stockQty > 0
            ? `Only ${v.stockQty} × ${v.title} left in stock.`
            : `${v.title} has just sold out.`,
        cartChanged: true,
      };
    }
    lines.push({ variant: v, quantity: line.quantity });
  }

  const totals = computeTotals({
    lines: lines.map((l) => ({ unitPriceCents: l.variant.priceCents, quantity: l.quantity })),
    deliveryMethod: input.deliveryMethod,
    paymentMethod: input.paymentMethod,
    shipping: settings.shipping,
    payments: settings.payments,
    tax: settings.tax,
  });

  // Payment first (demo providers decide instantly); a declined card never creates an order.
  const card = input.paymentMethod === "card_demo" ? demoCardSchema.parse(input.card) : undefined;
  const payment = await getPaymentProvider(input.paymentMethod).createPayment({
    amountCents: totals.totalCents,
    currency: settings.store.currency,
    card,
  });
  if (payment.status === "failed")
    return { ok: false, error: payment.error ?? "Payment failed.", field: "card.number" };

  try {
    const order = await createOrder({
      email: input.email,
      phone: input.phone,
      newsletter: input.newsletter,
      address: input.address,
      deliveryMethod: input.deliveryMethod,
      paymentMethod: input.paymentMethod,
      note: input.note,
      lines,
      totals,
      currency: settings.store.currency,
      orderPrefix: settings.store.orderPrefix,
      idempotencyKey: input.idempotencyKey,
      payment: {
        status: payment.status,
        cardBrand: payment.cardBrand,
        cardLast4: payment.cardLast4,
        providerRef: payment.providerRef,
      },
    });
    await grantOrderAccess(order.orderNumber);
    return { ok: true, orderNumber: order.orderNumber };
  } catch (error) {
    if (error instanceof OutOfStockError) {
      return { ok: false, error: `${error.title} has just sold out.`, cartChanged: true };
    }
    console.error("[checkout] order creation failed", error);
    return {
      ok: false,
      error: "We couldn’t place your order. You have not been charged — please try again.",
    };
  }
}
