import type { ProductCard as ProductCardData } from "@repo/db";
import { formatMoney } from "@repo/shared";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Parallax } from "@/components/motion/parallax";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { RevealText } from "@/components/motion/reveal-text";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";

/** Full-bleed kitchen editorial: photo background with a floating panel of kitchen picks. */
export function KitchenEditorial({ products }: { products: ProductCardData[] }) {
  return (
    <section className="relative isolate overflow-hidden">
      <Parallax offset={120} className="absolute inset-0 -z-10">
        <Image
          src="/images/site/kitchen-shelves.webp"
          alt="Ceramic bowls, plates and a carafe on rustic wooden kitchen shelves"
          fill
          sizes="100vw"
          className="scale-110 object-cover"
        />
      </Parallax>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />

      <div className="container-site grid min-h-[86svh] items-center gap-12 py-24 lg:grid-cols-[1.1fr_1fr]">
        <div className="text-on-strong">
          <p className="text-on-strong/80 text-xs tracking-[0.16em] uppercase">
            Kitchen essentials
          </p>
          <RevealText
            as="h2"
            text={["Tools you’ll", "reach for every day"]}
            className="font-display text-display-xl mt-4 italic"
          />
          <Reveal delay={0.2}>
            <p className="text-on-strong/85 mt-6 max-w-md leading-relaxed">
              Cast iron that lasts generations, olive wood that never scratches, glass jars that
              bring calm to the pantry. Good tools make cooking a pleasure.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild variant="inverse">
                <Link href={routes.category("cookware")}>Shop cookware</Link>
              </Button>
              <Button asChild variant="outline-inverse">
                <Link href={routes.category("kitchen-tools")}>Kitchen tools</Link>
              </Button>
            </div>
          </Reveal>
        </div>

        <RevealGroup
          className="bg-bg/95 grid gap-1 rounded-sm p-3 backdrop-blur md:p-4"
          stagger={0.08}
        >
          {products.slice(0, 4).map((p) => (
            <RevealItem key={p.id} distance={16}>
              <Link
                href={routes.product(p.slug)}
                className="group hover:bg-surface flex items-center gap-4 rounded-xs p-2 transition-colors"
              >
                <div className="bg-surface-muted relative size-20 shrink-0 overflow-hidden rounded-xs">
                  {p.images[0] ? (
                    <Image
                      src={p.images[0].url}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg leading-tight italic">{p.title}</p>
                  <p className="text-ink-muted mt-1 text-xs">{formatMoney(p.priceCents)}</p>
                </div>
                <ArrowRight
                  className="text-ink-muted size-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden
                />
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
