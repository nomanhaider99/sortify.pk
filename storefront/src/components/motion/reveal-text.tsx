"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";
import { REVEAL_VIEWPORT, STAGGER, maskReveal, staggerContainer } from "@/lib/motion";

const TAGS = {
  p: motion.p,
  span: motion.span,
  div: motion.div,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
} as const;

type RevealTextProps = {
  /** Text to reveal. Each array item becomes its own masked line; a string is split by words. */
  text: string | string[];
  as?: keyof typeof TAGS;
  className?: string;
  lineClassName?: string;
  /** Split a string into words (default) or keep it as a single line. */
  by?: "word" | "line";
  delay?: number;
  stagger?: number;
  immediate?: boolean;
};

/**
 * Split-line mask reveal (PLAN.md §4.4). Each segment sits in an `overflow-hidden` wrapper and
 * slides up into place. The full text stays in the DOM for screen readers (segments are
 * `aria-hidden`; an sr-only copy carries the text).
 */
export function RevealText({
  text,
  as = "p",
  className,
  lineClassName,
  by = "word",
  delay = 0,
  stagger = STAGGER.tight,
  immediate = false,
}: RevealTextProps) {
  const reduced = useReducedMotion() ?? false;
  const segments = Array.isArray(text) ? text : by === "word" ? text.split(" ") : [text];
  const label = Array.isArray(text) ? text.join(" ") : text;
  const MotionTag = TAGS[as];
  const isWords = !Array.isArray(text) && by === "word";

  return (
    <MotionTag
      className={className}
      initial="hidden"
      {...(immediate
        ? { animate: "visible" }
        : { whileInView: "visible", viewport: REVEAL_VIEWPORT })}
      variants={staggerContainer(stagger, delay)}
    >
      <span className="sr-only">{label}</span>
      {segments.map((segment, i) => (
        <span
          key={`${segment}-${i}`}
          aria-hidden
          className={cn(
            "inline-block overflow-hidden pb-[0.12em] align-bottom",
            !isWords && "block",
            lineClassName,
          )}
        >
          <motion.span
            className="inline-block will-change-transform"
            variants={maskReveal(reduced)}
          >
            {segment}
            {isWords && i < segments.length - 1 ? " " : null}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}
