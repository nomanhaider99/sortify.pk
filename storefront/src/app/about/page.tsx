import { BRAND } from "@repo/shared";
import { Hammer, Leaf, PackageCheck, Recycle } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CountUp } from "@/components/motion/count-up";
import { Parallax } from "@/components/motion/parallax";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { RevealText } from "@/components/motion/reveal-text";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "About us",
  description: `The story behind ${BRAND.name}: handmade decor and kitchen essentials from small studios, made to be used and loved for years.`,
};

const VALUES = [
  {
    image: "/images/site/clay-pot.webp",
    title: "Made by hand",
    body: "We partner with small studios — potters, woodturners and candle makers — and pay fairly for skilled work.",
  },
  {
    image: "/images/site/crockery.webp",
    title: "Built to be used",
    body: "Everything we sell is meant for daily life: dishwasher-safe stoneware, boards that take a knife, pans that last decades.",
  },
  {
    image: "/images/site/calm-room.webp",
    title: "Quietly beautiful",
    body: "Natural materials and calm forms that sit happily in any room and never go out of style.",
  },
];

const PROCESS = [
  {
    Icon: Leaf,
    title: "Thoughtfully sourced",
    body: "FSC-certified woods, lead-free glazes, natural waxes and recycled glass.",
  },
  {
    Icon: Hammer,
    title: "Crafted in small batches",
    body: "Made by hand by makers we know by name — never mass-produced.",
  },
  {
    Icon: PackageCheck,
    title: "Checked one by one",
    body: "Our team inspects every piece before it is wrapped and shipped.",
  },
  {
    Icon: Recycle,
    title: "Packed plastic-free",
    body: "Recycled paper and card protect your order on its way to you.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative isolate flex min-h-[78svh] items-end overflow-hidden">
        <Parallax offset={140} zoom={0.08} className="absolute inset-0 -z-20">
          <Image
            src="/images/site/workshop.webp"
            alt="A potter shaping a vase on a wheel in a bright studio"
            fill
            priority
            sizes="100vw"
            className="scale-110 object-cover"
          />
        </Parallax>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/35 to-black/25" />
        <Container className="text-on-strong pt-40 pb-16 md:pb-24">
          <p className="text-on-strong/80 text-xs tracking-[0.16em] uppercase">Our story</p>
          <RevealText
            as="h1"
            immediate
            text={["Small studios,", "lasting pieces"]}
            className="font-display text-display-2xl mt-4 italic"
            stagger={0.12}
          />
        </Container>
      </section>

      {/* Intro statement */}
      <Container className="py-section">
        <Reveal className="mx-auto max-w-4xl text-center">
          <p className="font-display text-[clamp(1.75rem,1.2rem+2vw,3rem)] leading-snug italic">
            “We believe the things you use every day — a bowl, a spoon, the table by your sofa —
            should be made with care and built to last.”
          </p>
          <p className="text-ink-muted mt-8 text-sm tracking-[0.1em] uppercase">
            The {BRAND.name} team
          </p>
        </Reveal>
      </Container>

      {/* Story split */}
      <section className="pb-section">
        <Container className="grid items-center gap-14 lg:grid-cols-2 lg:gap-24">
          <Reveal className="order-2 lg:order-1">
            <h2 className="font-display text-display-lg italic">It started at a kitchen table</h2>
            <div className="text-ink-muted mt-6 space-y-4 leading-relaxed">
              <p>
                {BRAND.name} began with a simple frustration: it was hard to find home and kitchen
                pieces that were beautiful, honestly made and affordable. So we started visiting
                makers — a potter two towns over, a woodturner who carved spoons from fallen olive
                trees, a candle maker pouring by hand.
              </p>
              <p>
                Today we work with more than a hundred small studios. We design some pieces
                together, choose others exactly as the maker imagined them, and bring them to homes
                everywhere.
              </p>
              <p>
                No warehouses full of trend-driven stock — just things we’re proud to live with
                ourselves.
              </p>
            </div>
          </Reveal>
          <div className="order-1 grid grid-cols-5 gap-4 lg:order-2">
            <Parallax offset={50} className="col-span-3 aspect-[3/4] rounded-sm">
              <Image
                src="/images/site/hands-clay.webp"
                alt="Hands forming a clay bowl on a pottery wheel"
                fill
                sizes="30vw"
                className="scale-110 object-cover"
              />
            </Parallax>
            <Parallax offset={90} className="col-span-2 mt-16 aspect-[3/4] rounded-sm">
              <Image
                src="/images/products/spoon-set.webp"
                alt="Olive wood spoons on linen"
                fill
                sizes="20vw"
                className="scale-110 object-cover"
              />
            </Parallax>
          </div>
        </Container>
      </section>

      {/* Stats on sage (ink text per contrast rule) */}
      <section className="bg-primary text-ink py-20">
        <Container>
          <RevealGroup className="grid grid-cols-2 gap-10 text-center lg:grid-cols-4">
            {[
              { to: 120, suffix: "+", label: "Independent makers" },
              { to: 18, suffix: "", label: "Countries we ship to" },
              { to: 42000, suffix: "+", label: "Happy homes" },
              { to: 98, suffix: "%", label: "Five-star deliveries" },
            ].map((s) => (
              <RevealItem key={s.label}>
                <p className="font-display text-[clamp(2.5rem,1.8rem+2.5vw,4rem)] italic">
                  <CountUp to={s.to} suffix={s.suffix} />
                </p>
                <p className="mt-2 text-xs font-medium tracking-[0.12em] uppercase">{s.label}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* Values */}
      <Container className="py-section">
        <div className="max-w-2xl">
          <p className="text-ink-muted text-xs tracking-[0.16em] uppercase">What we stand for</p>
          <RevealText
            as="h2"
            text="Three things we never compromise on"
            className="font-display text-display-lg mt-3 italic"
          />
        </div>
        <RevealGroup className="mt-14 grid gap-10 md:grid-cols-3">
          {VALUES.map((v) => (
            <RevealItem key={v.title}>
              <div className="bg-surface-muted relative aspect-[4/5] overflow-hidden rounded-sm">
                <Image
                  src={v.image}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
              <h3 className="font-display mt-6 text-3xl italic">{v.title}</h3>
              <p className="text-ink-muted mt-3 text-sm leading-relaxed">{v.body}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>

      {/* Process */}
      <section className="bg-surface-muted py-section">
        <Container>
          <RevealText
            as="h2"
            text="From the studio to your door"
            className="font-display text-display-lg text-center italic"
          />
          <RevealGroup className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map(({ Icon, title, body }, i) => (
              <RevealItem key={title} className="bg-surface border-border rounded-sm border p-7">
                <div className="flex items-center justify-between">
                  <Icon className="text-primary-strong size-7" strokeWidth={1.25} aria-hidden />
                  <span className="font-display text-ink-muted text-2xl italic">0{i + 1}</span>
                </div>
                <h3 className="mt-8 text-sm font-medium tracking-[0.08em] uppercase">{title}</h3>
                <p className="text-ink-muted mt-2 text-sm leading-relaxed">{body}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* Mosaic */}
      <Container className="py-section">
        <RevealGroup className="grid auto-rows-[200px] grid-cols-2 gap-4 md:auto-rows-[260px] md:grid-cols-4">
          {[
            {
              src: "/images/site/breakfast.webp",
              alt: "Breakfast tray with coffee and fruit",
              span: "md:col-span-2 md:row-span-2",
            },
            { src: "/images/products/vase-trio.webp", alt: "White ceramic vases", span: "" },
            { src: "/images/products/amber-candle.webp", alt: "Lit glass candle", span: "" },
            {
              src: "/images/site/kitchen.webp",
              alt: "Kitchen shelves with jars",
              span: "md:col-span-2",
            },
          ].map((m) => (
            <RevealItem key={m.src} className={`relative overflow-hidden rounded-sm ${m.span}`}>
              <Image
                src={m.src}
                alt={m.alt}
                fill
                sizes="(min-width: 768px) 50vw, 50vw"
                className="object-cover transition-transform duration-[1.2s] hover:scale-105"
              />
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>

      {/* CTA */}
      <section className="bg-ink text-on-strong">
        <Container className="flex flex-col items-center py-24 text-center">
          <RevealText
            as="h2"
            text="Bring something lovely home"
            className="font-display text-display-lg italic"
          />
          <Reveal delay={0.15}>
            <p className="text-on-strong/80 mx-auto mt-4 max-w-md">
              Explore side tables, decor and kitchen essentials made by people who care.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button asChild variant="inverse">
                <Link href={routes.shop}>Shop the collection</Link>
              </Button>
              <Button asChild variant="outline-inverse">
                <Link href={routes.contact}>Get in touch</Link>
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
