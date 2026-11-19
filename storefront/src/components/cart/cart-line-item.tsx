"use client";

import { formatMoney } from "@repo/shared";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { type CartLine, useCart } from "@/stores/cart";
import { QuantityStepper } from "./quantity-stepper";

export function CartLineItem({
  line,
  highlight,
  onNavigate,
}: {
  line: CartLine;
  highlight?: boolean;
  onNavigate?: () => void;
}) {
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: 1,
        y: 0,
        backgroundColor: highlight
          ? ["rgba(156,175,136,0.35)", "rgba(156,175,136,0)"]
          : "rgba(156,175,136,0)",
      }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.5, backgroundColor: { duration: 1.6 } }}
      className="-mx-3 flex gap-4 rounded-sm px-3 py-4"
    >
      <Link
        href={routes.product(line.slug)}
        onClick={onNavigate}
        className="bg-surface-muted relative h-28 w-22 shrink-0 overflow-hidden rounded-xs"
      >
        {line.image ? (
          <Image src={line.image} alt={line.title} fill sizes="88px" className="object-cover" />
        ) : null}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={routes.product(line.slug)}
              onClick={onNavigate}
              className="font-display text-lg leading-tight italic hover:underline"
            >
              {line.title}
            </Link>
            {line.variantLabel ? (
              <p className="text-ink-muted mt-0.5 text-xs">{line.variantLabel}</p>
            ) : null}
          </div>
          <p className="shrink-0 text-sm">
            {formatMoney(line.unitPriceCents * line.quantity, "USD", { withCode: false })}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <QuantityStepper
            size="sm"
            value={line.quantity}
            max={line.maxQuantity ?? 20}
            onChange={(q) => setQuantity(line.variantId, q)}
            label={`Quantity of ${line.title}`}
          />
          <button
            type="button"
            onClick={() => remove(line.variantId)}
            className="text-ink-muted hover:text-ink text-xs underline underline-offset-4"
          >
            Remove<span className="sr-only"> {line.title}</span>
          </button>
        </div>
      </div>
    </motion.li>
  );
}
