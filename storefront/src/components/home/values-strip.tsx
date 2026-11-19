import { formatMoney } from "@repo/shared";
import { HandHeart, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { CountUp } from "@/components/motion/count-up";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";

/** Sage values strip — dark ink text on sage per the contrast rule (PLAN §4.1). */
export function ValuesStrip({
  freeShippingThresholdCents,
}: {
  freeShippingThresholdCents: number;
}) {
  const values = [
    {
      Icon: HandHeart,
      figure: <CountUp to={120} suffix="+" />,
      title: "Makers we work with",
      body: "Potters, woodworkers and candle makers paid fairly for their craft.",
    },
    {
      Icon: Truck,
      figure: <>Free</>,
      title: "Shipping over " + formatMoney(freeShippingThresholdCents, "USD", { withCode: false }),
      body: "Carefully packed in recycled materials and tracked to your door.",
    },
    {
      Icon: RotateCcw,
      figure: <CountUp to={30} suffix=" days" />,
      title: "Easy returns",
      body: "Changed your mind? Send it back within 30 days, no questions asked.",
    },
    {
      Icon: ShieldCheck,
      figure: <CountUp to={100} suffix="%" />,
      title: "Secure checkout",
      body: "Pay by card or cash on delivery — your details are always protected.",
    },
  ];
  return (
    <section className="bg-primary text-ink py-20 md:py-24">
      <Container>
        <RevealGroup className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
          {values.map(({ Icon, figure, title, body }) => (
            <RevealItem key={title} className="border-ink/20 border-t pt-6">
              <Icon className="size-7" strokeWidth={1.25} aria-hidden />
              <p className="font-display mt-5 text-4xl italic">{figure}</p>
              <h3 className="mt-2 text-sm font-medium tracking-[0.06em] uppercase">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed">{body}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
