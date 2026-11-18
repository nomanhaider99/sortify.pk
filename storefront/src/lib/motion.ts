import type { Transition, Variants } from "motion/react";

/** PLAN.md §4.4 — ease-out-expo-like curve used everywhere. */
export const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;

export const DURATION = {
  fast: 0.3,
  base: 0.5,
  slow: 0.8,
} as const;

export const STAGGER = {
  tight: 0.06,
  base: 0.08,
  loose: 0.1,
} as const;

export const transition = (duration: number = DURATION.base, delay = 0): Transition => ({
  duration,
  delay,
  ease: EASE_OUT_EXPO,
});

/** Fade + rise. Under reduced motion the `y` offset is dropped and only opacity animates. */
export function fadeUp(reduced = false, distance = 28): Variants {
  return {
    hidden: { opacity: 0, y: reduced ? 0 : distance },
    visible: { opacity: 1, y: 0, transition: transition(DURATION.slow) },
  };
}

export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transition(DURATION.base) },
};

/** Line-mask reveal: the child slides up from below its overflow-hidden parent. */
export function maskReveal(reduced = false): Variants {
  return reduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: transition(DURATION.base) } }
    : {
        hidden: { y: "110%" },
        visible: { y: "0%", transition: transition(DURATION.slow) },
      };
}

export function staggerContainer(stagger: number = STAGGER.base, delayChildren = 0): Variants {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren } },
  };
}

/** Viewport options shared by scroll reveals. */
export const REVEAL_VIEWPORT = { once: true, margin: "0px 0px -12% 0px" } as const;
