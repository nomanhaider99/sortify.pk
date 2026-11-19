"use client";

import { Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Spinner } from "@/components/ui/spinner";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { AddStatus } from "@/lib/use-add-to-cart";

type Props = {
  status: AddStatus;
  disabled?: boolean;
  onClick: () => void;
  label?: string;
  className?: string;
  variant?: "primary" | "secondary" | "inverse";
  size?: "sm" | "md" | "lg";
};

/** Label → spinner → "Added ✓" → label, with AnimatePresence crossfades (PLAN §5.4 step 1). */
export function AddToCartButton({
  status,
  disabled,
  onClick,
  label = "Add to cart",
  className,
  variant = "primary",
  size = "lg",
}: Props) {
  const content =
    status === "loading" ? (
      <Spinner label="Adding to cart" />
    ) : status === "added" ? (
      <span className="inline-flex items-center gap-2">
        <Check className="size-4" aria-hidden /> Added
      </span>
    ) : (
      <span>{label}</span>
    );

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || status === "loading"}
      aria-live="polite"
      className={cn(buttonVariants({ variant, size }), "relative overflow-hidden", className)}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={status}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="inline-flex items-center"
        >
          {content}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
