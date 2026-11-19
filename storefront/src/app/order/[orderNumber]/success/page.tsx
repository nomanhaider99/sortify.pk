import { formatMoney } from "@repo/shared";
import { Mail, PackageCheck, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Reveal } from "@/components/motion/reveal";
import { OrderAddress, OrderItems } from "@/components/order/order-items";
import { SuccessCheck } from "@/components/order/success-check";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { hasOrderAccess } from "@/lib/order-access";
import { getPublicOrder } from "@/lib/public-order";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Thank you for your order", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({
  params,
}: PageProps<"/order/[orderNumber]/success">) {
  const { orderNumber } = await params;
  // Only the browser that placed (or looked up) the order may see it.
  if (!(await hasOrderAccess(orderNumber))) redirect(routes.track);
  const order = await getPublicOrder(orderNumber);
  if (!order) notFound();

  const next = [
    {
      Icon: Mail,
      title: "Keep your order number",
      body: `Use ${order.orderNumber} with ${order.email} to track your order at any time.`,
    },
    {
      Icon: PackageCheck,
      title: "We prepare your order",
      body: "Our team confirms your order and packs it with care.",
    },
    { Icon: Truck, title: "On its way", body: "You’ll get a tracking number as soon as it ships." },
  ];

  return (
    <Container className="pb-section max-w-4xl pt-14">
      <div className="text-center">
        <SuccessCheck />
        <Reveal immediate delay={0.4}>
          <p className="text-ink-muted mt-8 text-xs tracking-[0.16em] uppercase">
            Order {order.orderNumber}
          </p>
          <h1 className="font-display text-display-xl mt-3 italic">Thank you!</h1>
          <p className="text-ink-muted mx-auto mt-4 max-w-md">
            Your order has been placed.{" "}
            {order.paymentMethod === "cod"
              ? `Please have ${formatMoney(order.totalCents)} ready in cash for the courier.`
              : `Your card ending ${order.cardLast4 ?? "••••"} was charged ${formatMoney(order.totalCents)} (demo — no real charge).`}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href={routes.trackOrder(order.orderNumber)}>Track your order</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={routes.shop}>Continue shopping</Link>
            </Button>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.2} className="mt-16 grid gap-6 sm:grid-cols-3">
        {next.map(({ Icon, title, body }, i) => (
          <div key={title} className="bg-surface border-border rounded-sm border p-6">
            <div className="flex items-center justify-between">
              <Icon className="text-primary-strong size-6" strokeWidth={1.25} aria-hidden />
              <span className="font-display text-ink-muted text-xl italic">0{i + 1}</span>
            </div>
            <p className="mt-5 text-sm font-medium">{title}</p>
            <p className="text-ink-muted mt-1 text-sm">{body}</p>
          </div>
        ))}
      </Reveal>

      <Reveal
        delay={0.25}
        className="bg-surface border-border mt-6 grid gap-10 rounded-sm border p-6 md:grid-cols-[1fr_220px] md:p-8"
      >
        <div>
          <h2 className="font-display text-2xl italic">Order summary</h2>
          <div className="mt-2">
            <OrderItems order={order} />
          </div>
        </div>
        <div>
          <h2 className="text-xs font-medium tracking-[0.12em] uppercase">Shipping to</h2>
          <div className="mt-3">
            <OrderAddress order={order} />
          </div>
        </div>
      </Reveal>
    </Container>
  );
}
