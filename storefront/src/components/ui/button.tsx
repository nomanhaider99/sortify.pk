import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Buttons follow the contrast rule (PLAN.md §4.1):
 * - primary: filled --primary-strong with off-white text
 * - secondary: outlined with --ink
 * - inverse: white fill + ink text for dark photo backgrounds (hover fills green)
 */
export const buttonVariants = cva(
  "ease-out-expo inline-flex items-center justify-center gap-2 rounded-xs font-sans text-sm font-medium tracking-[0.08em] whitespace-nowrap uppercase transition-[background-color,color,border-color,transform] duration-300 select-none focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary-strong text-on-strong hover:bg-primary-strong-hover focus-visible:outline-primary-strong",
        secondary:
          "border-ink text-ink hover:bg-ink hover:text-bg focus-visible:outline-ink border bg-transparent",
        inverse:
          "bg-surface text-ink hover:bg-primary-strong hover:text-on-strong focus-visible:outline-on-strong",
        ghost: "text-ink hover:bg-primary-soft bg-transparent",
        link: "text-primary-strong tracking-normal normal-case underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-6",
        lg: "h-13 px-8",
        icon: "size-11 p-0",
      },
      block: { true: "w-full" },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    /** Render as the child element (e.g. a Next `<Link>`), keeping button styles. */
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  type,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...(asChild ? {} : { type: type ?? "button" })}
      {...props}
    />
  );
}
