"use client";

import { ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { useHydrated } from "@/lib/use-hydrated";
import { selectCartCount, useCart } from "@/stores/cart";

/** Cart icon with the small outlined count badge from ref-1; bumps when an item is added. */
export function CartButton() {
  const hydrated = useHydrated();
  const count = useCart(selectCartCount);
  const tick = useCart((s) => s.addedTick);
  const shown = hydrated ? count : 0;

  return (
    <Link
      href={routes.cart}
      aria-label={`Cart, ${shown} ${shown === 1 ? "item" : "items"}`}
      data-cart-target
      className="relative inline-flex size-10 items-center justify-center transition-opacity duration-300 hover:opacity-70"
    >
      <motion.span
        key={tick}
        className="inline-flex"
        initial={tick ? { scale: 1 } : false}
        animate={tick ? { scale: [1, 1.22, 0.94, 1] } : {}}
        transition={{ duration: 0.5 }}
      >
        <ShoppingBag className="size-[22px]" strokeWidth={1.5} aria-hidden />
      </motion.span>
      <span
        aria-hidden
        className="absolute top-0.5 right-0 flex size-[15px] items-center justify-center overflow-hidden rounded-full border border-current text-[0.5625rem] leading-none font-medium"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={shown}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {shown > 99 ? "99" : shown}
          </motion.span>
        </AnimatePresence>
      </span>
    </Link>
  );
}
