"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/** Counts from 0 to `to` once the number scrolls into view (instant under reduced motion). */
export function CountUp({
  to,
  duration = 1.6,
  suffix = "",
  prefix = "",
}: {
  to: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduced = useReducedMotion() ?? false;
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      const id = requestAnimationFrame(() => setValue(to));
      return () => cancelAnimationFrame(id);
    }
    const controls = animate(0, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduced, to, duration]);

  return (
    <span ref={ref}>
      <span aria-hidden>
        {prefix}
        {value.toLocaleString("en-US")}
        {suffix}
      </span>
      <span className="sr-only">
        {prefix}
        {to.toLocaleString("en-US")}
        {suffix}
      </span>
    </span>
  );
}
