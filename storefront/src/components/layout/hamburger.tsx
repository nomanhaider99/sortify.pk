"use client";

import { motion } from "motion/react";
import { transition } from "@/lib/motion";

type HamburgerProps = { open: boolean; onClick: () => void; controls: string };

export const MENU_TOGGLE_ID = "menu-toggle";

/** Three thin lines (ref-1) that morph into an X when the menu is open. */
export function Hamburger({ open, onClick, controls }: HamburgerProps) {
  const t = transition(0.45);
  return (
    <button
      id={MENU_TOGGLE_ID}
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-controls={controls}
      aria-label={open ? "Close menu" : "Open menu"}
      className="relative flex size-11 items-center justify-center focus-visible:outline-2 focus-visible:outline-current"
    >
      <span className="relative block h-[14px] w-[26px]" aria-hidden>
        <motion.span
          className="absolute top-0 left-0 h-[1.5px] w-full bg-current"
          animate={open ? { y: 6.25, rotate: 45 } : { y: 0, rotate: 0 }}
          transition={t}
        />
        <motion.span
          className="absolute top-[6.25px] left-0 h-[1.5px] w-full bg-current"
          animate={{ opacity: open ? 0 : 1, scaleX: open ? 0.4 : 1 }}
          transition={t}
        />
        <motion.span
          className="absolute top-[12.5px] left-0 h-[1.5px] w-full bg-current"
          animate={open ? { y: -6.25, rotate: -45 } : { y: 0, rotate: 0 }}
          transition={t}
        />
      </span>
    </button>
  );
}
