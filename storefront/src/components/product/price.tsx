import { formatMoney } from "@repo/shared";
import { cn } from "@/lib/cn";

export function Price({
  cents,
  compareAtCents,
  className,
  size = "sm",
}: {
  cents: number;
  compareAtCents?: number | null;
  className?: string;
  size?: "sm" | "lg";
}) {
  const onSale = compareAtCents != null && compareAtCents > cents;
  return (
    <p
      className={cn(
        "flex flex-wrap items-baseline gap-x-2",
        size === "lg" ? "text-lg" : "text-xs",
        className,
      )}
    >
      <span className={cn(onSale && "text-danger")}>
        {onSale ? <span className="sr-only">Sale price </span> : null}
        {formatMoney(cents)}
      </span>
      {onSale ? (
        <s className="text-ink-muted">
          <span className="sr-only">Regular price </span>
          {formatMoney(compareAtCents)}
        </s>
      ) : null}
    </p>
  );
}
