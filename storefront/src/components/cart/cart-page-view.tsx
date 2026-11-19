"use client";

import { computeTotals, formatMoney, type ShippingSettings } from "@repo/shared";
import { ArrowRight, Lock } from "lucide-react";
import { AnimatePresence } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { routes } from "@/lib/routes";
import { useCartSync } from "@/lib/use-cart-sync";
import { useHydrated } from "@/lib/use-hydrated";
import { selectSubtotal, useCart } from "@/stores/cart";
import { CartLineItem } from "./cart-line-item";
import { FreeShippingBar } from "./free-shipping-bar";

/** Full-page cart: line items, free-shipping bar, estimate and checkout CTA (PLAN §5.8). */
export function CartPageView({ shipping }: { shipping: ShippingSettings }) {
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const subtotal = useCart(selectSubtotal);
  useCartSync(hydrated);

  if (!hydrated) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner label="Loading your cart" />
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className="bg-surface-muted rounded-sm px-6 py-24 text-center">
        <p className="font-display text-3xl italic">Your cart is empty</p>
        <p className="text-ink-muted mt-3">Find something lovely for your home or kitchen.</p>
        <Button asChild className="mt-8">
          <Link href={routes.shop}>Start shopping</Link>
        </Button>
      </div>
    );
  }

  const estimate = computeTotals({
    lines: lines.map((l) => ({ unitPriceCents: l.unitPriceCents, quantity: l.quantity })),
    deliveryMethod: "standard",
    paymentMethod: "card_demo",
    shipping,
    payments: { codEnabled: true, cardDemoEnabled: true, codFeeCents: 0, autoOpenCartOnAdd: true },
    tax: { rateBps: 0, includedInPrices: true },
  });

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
      <div>
        <div className="border-border text-ink-muted hidden grid-cols-[1fr_auto] border-b pb-3 text-xs tracking-[0.12em] uppercase md:grid">
          <span>Product</span>
          <span>Total</span>
        </div>
        <ul className="divide-border divide-y">
          <AnimatePresence initial={false}>
            {lines.map((l) => (
              <CartLineItem key={l.variantId} line={l} />
            ))}
          </AnimatePresence>
        </ul>
        <Link
          href={routes.shop}
          className="mt-8 inline-flex items-center gap-2 text-sm underline underline-offset-4"
        >
          Continue shopping
        </Link>
      </div>

      <aside className="bg-surface border-border h-fit rounded-sm border p-6 lg:sticky lg:top-28">
        <h2 className="font-display text-2xl italic">Order summary</h2>
        <div className="mt-5">
          <FreeShippingBar
            subtotalCents={subtotal}
            thresholdCents={shipping.freeShippingThresholdCents}
          />
        </div>
        <dl className="border-border mt-6 space-y-2.5 border-t pt-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Subtotal</dt>
            <dd>{formatMoney(subtotal, "USD", { withCode: false })}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Estimated shipping</dt>
            <dd>
              {estimate.freeShipping
                ? "Free"
                : formatMoney(estimate.shippingCents, "USD", { withCode: false })}
            </dd>
          </div>
          <div className="border-border flex items-baseline justify-between border-t pt-4 text-base">
            <dt className="font-medium">Estimated total</dt>
            <dd className="text-xl">{formatMoney(estimate.totalCents)}</dd>
          </div>
        </dl>
        <p className="text-ink-muted mt-3 text-xs">
          Standard delivery {shipping.standardEta}. Express available at checkout.
        </p>
        <Button asChild block size="lg" className="mt-6">
          <Link href={routes.checkout}>
            Checkout <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
        <p className="text-ink-muted mt-4 flex items-center justify-center gap-2 text-xs">
          <Lock className="size-3.5" aria-hidden /> Secure checkout · Cash on delivery or card
        </p>
      </aside>
    </div>
  );
}
