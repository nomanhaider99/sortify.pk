import { getSettings } from "@repo/db";
import type { Metadata } from "next";
import { CartPageView } from "@/components/cart/cart-page-view";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Your cart", robots: { index: false } };
export const revalidate = 300;

export default async function CartPage() {
  const { shipping } = await getSettings(["shipping"]);
  return (
    <Container className="pb-section pt-10 md:pt-14">
      <h1 className="font-display text-display-xl italic">Your cart</h1>
      <div className="mt-10">
        <CartPageView shipping={shipping} />
      </div>
    </Container>
  );
}
