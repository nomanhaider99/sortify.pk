"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { REVEAL_VIEWPORT, STAGGER, fadeUp, staggerContainer } from "@/lib/motion";

type RevealProps = HTMLMotionProps<"div"> & {
  /** Delay in seconds before the reveal starts. */
  delay?: number;
  /** Rise distance in px (ignored under reduced motion). */
  distance?: number;
  /** Animate on mount instead of when scrolled into view. */
  immediate?: boolean;
};

/** Fades + rises its content into view once. Reduced motion → opacity only. */
export function Reveal({
  delay = 0,
  distance = 28,
  immediate = false,
  children,
  ...rest
}: RevealProps) {
  const reduced = useReducedMotion() ?? false;
  const variants = fadeUp(reduced, distance);
  return (
    <motion.div
      initial="hidden"
      {...(immediate
        ? { animate: "visible" }
        : { whileInView: "visible", viewport: REVEAL_VIEWPORT })}
      variants={variants}
      transition={{ delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

type RevealGroupProps = HTMLMotionProps<"div"> & {
  stagger?: number;
  delay?: number;
  immediate?: boolean;
};

/** Parent that staggers `RevealItem` children as the group enters the viewport. */
export function RevealGroup({
  stagger = STAGGER.base,
  delay = 0,
  immediate = false,
  children,
  ...rest
}: RevealGroupProps) {
  return (
    <motion.div
      initial="hidden"
      {...(immediate
        ? { animate: "visible" }
        : { whileInView: "visible", viewport: REVEAL_VIEWPORT })}
      variants={staggerContainer(stagger, delay)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  distance = 24,
  ...rest
}: HTMLMotionProps<"div"> & { distance?: number }) {
  const reduced = useReducedMotion() ?? false;
  return (
    <motion.div variants={fadeUp(reduced, distance)} {...rest}>
      {children}
    </motion.div>
  );
}
