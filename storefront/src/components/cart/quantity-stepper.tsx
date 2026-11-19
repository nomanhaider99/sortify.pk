"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  size?: "sm" | "md";
};

export function QuantityStepper({ value, min = 1, max, onChange, label, size = "md" }: Props) {
  const h = size === "sm" ? "h-9" : "h-13";
  return (
    <div
      className={cn("border-border inline-flex items-center rounded-xs border", h)}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className="hover:bg-primary-soft flex h-full w-9 items-center justify-center disabled:opacity-40"
      >
        <Minus className="size-3.5" aria-hidden />
      </button>
      <output aria-live="polite" className="w-8 text-center text-sm tabular-nums">
        {value}
      </output>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
        className="hover:bg-primary-soft flex h-full w-9 items-center justify-center disabled:opacity-40"
      >
        <Plus className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
