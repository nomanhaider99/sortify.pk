import { getSettings } from "@repo/db";
import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const { shipping, payments, tax } = await getSettings(["shipping", "payments", "tax"]);
  return (
    <Container className="pb-section pt-10 md:pt-14">
      <h1 className="font-display text-display-xl italic">Checkout</h1>
      <p className="text-ink-muted mt-2 text-sm">Guest checkout — no account needed.</p>
      <div className="mt-10">
        <Suspense>
          <CheckoutForm shipping={shipping} payments={payments} tax={tax} />
        </Suspense>
      </div>
    </Container>
  );
}
