"use client";

import { BadgeCheck, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Stars } from "@/components/product/stars";
import { RevealText } from "@/components/motion/reveal-text";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { routes } from "@/lib/routes";

export type Testimonial = {
  id: string;
  customerName: string;
  rating: number;
  title: string;
  body: string;
  isVerifiedPurchase: boolean;
  productTitle: string;
  productSlug: string;
};

/**
 * Customer reviews carousel over a darkened photo. Only *approved + featured* reviews reach this
 * component (filtered in the query). Auto-advances, pauses on hover/focus.
 */
export function Testimonials({ reviews }: { reviews: Testimonial[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion() ?? false;
  const count = reviews.length;

  useEffect(() => {
    if (paused || reduced || count < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 7000);
    return () => clearInterval(id);
  }, [paused, reduced, count]);

  const review = reviews[index];
  if (!review) return null;
  const go = (d: 1 | -1) => setIndex((i) => (i + d + count) % count);

  return (
    <section
      className="relative isolate overflow-hidden"
      aria-roledescription="carousel"
      aria-label="Customer reviews"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Image
        src="/images/site/table-setting.webp"
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <div className="bg-menu-bg/80 absolute inset-0 -z-10" />

      <div className="container-site text-on-strong py-section text-center">
        <p className="text-on-strong/75 text-xs tracking-[0.16em] uppercase">Kind words</p>
        <RevealText
          as="h2"
          text="Loved in homes everywhere"
          className="font-display text-display-lg mt-3 italic"
        />

        <div className="relative mx-auto mt-12 min-h-[18rem] max-w-3xl">
          <Quote className="text-primary mx-auto size-9" strokeWidth={1.25} aria-hidden />
          <AnimatePresence mode="wait">
            <motion.figure
              key={review.id}
              initial={{ opacity: 0, y: reduced ? 0 : 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduced ? 0 : -12 }}
              transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
              className="mt-6"
              aria-live="polite"
            >
              <Stars rating={review.rating} className="justify-center" size={16} tone="light" />
              <blockquote className="font-display mt-6 text-[clamp(1.375rem,1rem+1.4vw,2.125rem)] leading-snug italic">
                “{review.body}”
              </blockquote>
              <figcaption className="mt-7 text-sm">
                <span className="font-medium">{review.customerName}</span>
                {review.isVerifiedPurchase ? (
                  <span className="text-on-strong/75 ml-2 inline-flex items-center gap-1 text-xs">
                    <BadgeCheck className="size-3.5" aria-hidden /> Verified buyer
                  </span>
                ) : null}
                <span className="text-on-strong/75 mt-1 block text-xs">
                  on{" "}
                  <Link
                    href={routes.product(review.productSlug)}
                    className="hover:text-on-strong underline underline-offset-4"
                  >
                    {review.productTitle}
                  </Link>
                </span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>

        {count > 1 ? (
          <div className="mt-10 flex items-center justify-center gap-5">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous review"
              className="border-on-strong/40 hover:bg-on-strong hover:text-ink flex size-10 items-center justify-center rounded-full border transition-colors"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <div className="flex gap-2">
              {reviews.map((r, i) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Show review ${i + 1} of ${count}`}
                  aria-current={i === index}
                  className="group flex h-6 min-w-6 items-center justify-center"
                >
                  <span
                    className={`block h-px transition-all duration-500 ${i === index ? "bg-on-strong w-8" : "bg-on-strong/40 group-hover:bg-on-strong/70 w-4"}`}
                  />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next review"
              className="border-on-strong/40 hover:bg-on-strong hover:text-ink flex size-10 items-center justify-center rounded-full border transition-colors"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
