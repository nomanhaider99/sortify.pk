"use client";

import type { ProductCard as ProductCardData } from "@repo/db";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useId, useState } from "react";
import { Reveal } from "@/components/motion/reveal";
import { ProductCard } from "@/components/product/product-card";
import { cn } from "@/lib/cn";
import { transition } from "@/lib/motion";
import { routes } from "@/lib/routes";

export type CollectionTab = { slug: string; name: string; products: ProductCardData[] };

/**
 * Featured Collections (ref-4): centred italic heading, pill tabs with an animated active outline
 * (shared layoutId), 4-column product grid that crossfades when the tab changes.
 */
export function FeaturedCollections({ tabs }: { tabs: CollectionTab[] }) {
  const [active, setActive] = useState(tabs[0]?.slug ?? "");
  const reduced = useReducedMotion() ?? false;
  const id = useId();
  const current = tabs.find((t) => t.slug === active) ?? tabs[0];
  if (!current) return null;

  return (
    <section className="py-section" aria-labelledby={`${id}-title`}>
      <div className="px-5 md:px-7">
        <Reveal className="text-center">
          <h2 id={`${id}-title`} className="font-display text-display-lg text-ink italic">
            Featured Collections
          </h2>
        </Reveal>

        <LayoutGroup id={id}>
          <div
            role="tablist"
            aria-label="Collections"
            className="mt-9 flex flex-wrap justify-center gap-1 md:gap-2"
          >
            {tabs.map((t) => {
              const selected = t.slug === current.slug;
              return (
                <button
                  key={t.slug}
                  role="tab"
                  type="button"
                  id={`${id}-tab-${t.slug}`}
                  aria-selected={selected}
                  aria-controls={`${id}-panel`}
                  onClick={() => setActive(t.slug)}
                  className={cn(
                    "relative rounded-full px-4 py-1.5 text-[0.8125rem] font-light transition-colors",
                    selected ? "text-ink" : "text-ink-muted hover:text-ink",
                  )}
                >
                  {selected ? (
                    <motion.span
                      layoutId="collection-pill"
                      className="border-ink absolute inset-0 rounded-full border"
                      transition={{ type: "spring", stiffness: 420, damping: 36 }}
                    />
                  ) : null}
                  <span className="relative">{t.name}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>

        <div
          id={`${id}-panel`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${current.slug}`}
          className="mt-10"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.ul
              key={current.slug}
              className="grid grid-cols-2 gap-x-3.5 gap-y-9 md:grid-cols-3 lg:grid-cols-4"
              initial={{ opacity: 0, y: reduced ? 0 : 16 }}
              animate={{ opacity: 1, y: 0, transition: transition(0.55) }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
            >
              {current.products.map((p, i) => (
                <motion.li
                  key={p.id}
                  initial={{ opacity: 0, y: reduced ? 0 : 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                  transition={transition(0.7, i * 0.07)}
                >
                  <ProductCard product={p} />
                </motion.li>
              ))}
            </motion.ul>
          </AnimatePresence>
          <div className="mt-12 text-center">
            <Link
              href={routes.category(current.slug)}
              className="group text-ink inline-flex min-h-11 items-center gap-2 text-sm tracking-[0.08em] uppercase"
            >
              Shop all {current.name}
              <ArrowRight
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
