import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** White surface card with soft shadow and ~14px radius (admin-layout-notes.md). */
/** Padding is 16px on phones and 24px from `sm` up, unless the caller sets its own `p-*`. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const customPadding = /(^|\s)p-/.test(className ?? "");
  return (
    <div
      className={cn(
        "rounded-card border-border bg-surface shadow-card border",
        !customPadding && "p-4 sm:p-6",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-4 flex items-center justify-between gap-4", className)} {...props} />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-ink text-base font-semibold", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-ink-muted text-sm", className)} {...props} />;
}
