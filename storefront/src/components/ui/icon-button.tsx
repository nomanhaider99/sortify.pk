import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Required accessible name — icon buttons have no visible text. */
  label: string;
};

/** Square, borderless icon button (header icons, drawer close…). Inherits `currentColor`. */
export function IconButton({
  label,
  className,
  children,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        "relative inline-flex size-10 items-center justify-center rounded-xs transition-opacity duration-300 hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
