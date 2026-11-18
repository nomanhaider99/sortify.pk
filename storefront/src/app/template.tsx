"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { EASE_OUT_EXPO } from "@/lib/motion";

/**
 * Route transition: every navigation remounts the template, fading the page in with a short
 * rise. Under reduced motion `MotionConfig reducedMotion="user"` drops the transform.
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.div>
  );
}
