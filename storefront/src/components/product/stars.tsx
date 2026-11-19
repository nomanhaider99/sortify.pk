import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

/** Read-only star rating; the accessible label carries the value. */
export function Stars({
  rating,
  className,
  size = 14,
  tone = "dark",
}: {
  rating: number;
  className?: string;
  size?: number;
  /** "light" for use on dark backgrounds. */
  tone?: "dark" | "light";
}) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const fill = rounded >= i + 1 ? 1 : rounded >= i + 0.5 ? 0.5 : 0;
        return (
          <span
            key={i}
            className="relative inline-flex"
            style={{ width: size, height: size }}
            aria-hidden
          >
            <Star
              className={cn(
                "absolute inset-0",
                tone === "light" ? "text-on-strong/35" : "text-border",
              )}
              style={{ width: size, height: size }}
              strokeWidth={1.5}
            />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star
                className={tone === "light" ? "fill-on-strong text-on-strong" : "fill-ink text-ink"}
                style={{ width: size, height: size }}
                strokeWidth={1.5}
              />
            </span>
          </span>
        );
      })}
    </span>
  );
}
