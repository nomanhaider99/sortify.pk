"use client";

import { formatMoney, freeShippingProgress } from "@repo/shared";
import { motion } from "motion/react";
import { EASE_OUT_EXPO } from "@/lib/motion";

export function FreeShippingBar({
  subtotalCents,
  thresholdCents,
}: {
  subtotalCents: number;
  thresholdCents: number;
}) {
  const { progress, remainingCents } = freeShippingProgress(subtotalCents, thresholdCents);
  return (
    <div>
      <p className="text-sm" aria-live="polite">
        {remainingCents > 0 ? (
          <>
            You’re{" "}
            <strong className="font-medium">
              {formatMoney(remainingCents, "USD", { withCode: false })}
            </strong>{" "}
            away from free standard shipping.
          </>
        ) : (
          <>
            You’ve unlocked <strong className="font-medium">free standard shipping</strong>.
          </>
        )}
      </p>
      <div
        className="bg-primary-soft mt-2.5 h-1.5 overflow-hidden rounded-full"
        role="progressbar"
        aria-label="Progress towards free shipping"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <motion.div
          className="bg-primary-strong h-full origin-left rounded-full"
          initial={false}
          animate={{ scaleX: progress }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
        />
      </div>
    </div>
  );
}
