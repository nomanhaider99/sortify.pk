"use client";

import type { HeroSettings } from "@repo/shared";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useRef } from "react";
import { Reveal } from "@/components/motion/reveal";
import { RevealText } from "@/components/motion/reveal-text";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

/**
 * Home hero (ref-3): full-bleed interior photo with a dark gradient, slow zoom + parallax on
 * scroll, two-line italic serif headline revealed word-by-word, subcopy and a white CTA.
 * All copy and the image come from admin Settings → Homepage hero.
 */
export function Hero({ hero }: { hero: HeroSettings }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative isolate flex min-h-svh items-center overflow-hidden">
      <motion.div className="absolute inset-0 -z-20" style={reduced ? undefined : { y, scale }}>
        {/* Slow intro zoom on load, separate from the scroll-linked transform above. */}
        <motion.div
          className="absolute inset-0"
          initial={reduced ? false : { scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src={hero.imageUrl}
            alt={hero.imageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
      </motion.div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/35 to-black/60" />

      <motion.div
        className="w-full"
        style={reduced ? undefined : { y: contentY, opacity: contentOpacity }}
      >
        <Container className="text-on-strong pt-24 text-center">
          <RevealText
            as="h1"
            immediate
            text={[hero.eyebrow, hero.headline].filter(Boolean)}
            className="font-display italic"
            lineClassNames={["text-display-lg font-normal", "text-display-2xl font-normal -mt-1"]}
            stagger={0.14}
            delay={0.2}
          />
          <Reveal immediate delay={0.75}>
            <p className="mx-auto mt-8 max-w-[32rem] text-base leading-relaxed font-light text-balance md:text-[1.0625rem]">
              {hero.subtext}
            </p>
            <Button asChild variant="inverse" className="mt-8 min-w-48 font-normal">
              <Link href={hero.ctaHref as Route}>{hero.ctaLabel}</Link>
            </Button>
          </Reveal>
        </Container>
      </motion.div>

      <motion.div
        aria-hidden
        className="text-on-strong/80 absolute bottom-8 left-1/2 -translate-x-1/2 text-[0.65rem] tracking-[0.3em] uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
      >
        <span className="flex flex-col items-center gap-3">
          Scroll
          <motion.span
            className="bg-on-strong/70 block h-10 w-px origin-top"
            animate={reduced ? undefined : { scaleY: [0, 1, 0], y: [0, 0, 20] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </motion.div>
    </section>
  );
}
