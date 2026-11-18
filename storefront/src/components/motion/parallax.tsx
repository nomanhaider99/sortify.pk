"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type ParallaxProps = {
  children: ReactNode;
  className?: string;
  /** Total vertical travel in px across the element's pass through the viewport. */
  offset?: number;
  /** Optional slow zoom from `1 + zoom` to 1 while scrolling. */
  zoom?: number;
};

/** Scroll-linked parallax (and optional zoom). Disabled entirely under reduced motion. */
export function Parallax({ children, className, offset = 80, zoom = 0 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-offset / 2, offset / 2]);
  const scale = useTransform(scrollYProgress, [0, 1], [1 + zoom, 1]);

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <motion.div
        className="h-full w-full will-change-transform"
        style={reduced ? undefined : { y, scale }}
      >
        {children}
      </motion.div>
    </div>
  );
}
