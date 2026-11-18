import type { InputHTMLAttributes, LabelHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Input({
  className,
  type = "text",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "rounded-control border-border bg-surface text-ink placeholder:text-ink-muted focus-visible:outline-accent-ink aria-invalid:border-danger h-9 w-full border px-3 text-sm focus-visible:outline-2 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-ink text-sm font-medium", className)} {...props} />;
}
