"use client";

import { motion, useReducedMotion } from "motion/react";

const CONFETTI = Array.from({ length: 14 }, (_, i) => ({
  angle: (i / 14) * Math.PI * 2,
  distance: 70 + (i % 3) * 18,
  color: ["#9CAF88", "#4F6B3F", "#C2A878", "#E4EBDC"][i % 4],
}));

/** Animated checkmark draw with a light confetti burst (PLAN §5.10). */
export function SuccessCheck() {
  const reduced = useReducedMotion() ?? false;
  return (
    <div className="relative mx-auto size-28" aria-hidden>
      {!reduced
        ? CONFETTI.map((c, i) => (
            <motion.span
              key={i}
              className="absolute top-1/2 left-1/2 size-2 rounded-full"
              style={{ backgroundColor: c.color }}
              initial={{ x: "-50%", y: "-50%", scale: 0, opacity: 1 }}
              animate={{
                x: `calc(-50% + ${Math.cos(c.angle) * c.distance}px)`,
                y: `calc(-50% + ${Math.sin(c.angle) * c.distance}px)`,
                scale: [0, 1, 0.6],
                opacity: [1, 1, 0],
              }}
              transition={{ duration: 1.1, delay: 0.75, ease: "easeOut" }}
            />
          ))
        : null}
      <svg viewBox="0 0 52 52" className="text-primary-strong relative size-28">
        <motion.circle
          cx="26"
          cy="26"
          r="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          initial={{ pathLength: reduced ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.path
          d="M15 27l7 7 15-16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: reduced ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        />
      </svg>
    </div>
  );
}
