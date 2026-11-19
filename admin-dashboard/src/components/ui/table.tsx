import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Table styles from the reference: muted small-caps header, hairline rows, roomy cells.
 * Inside a padded Card the scroll area bleeds to the card edges (`bleed`); in an unpadded
 * card (`p-0`) it adds the padding itself instead.
 */
export function Table({
  className,
  bleed = true,
  stack = false,
  ...props
}: HTMLAttributes<HTMLTableElement> & {
  bleed?: boolean;
  /**
   * Below `md`, render each row as a wrapped "card" (header hidden, first cell full width)
   * instead of a horizontally scrolling table.
   */
  stack?: boolean;
}) {
  return (
    <div className={cn("overflow-x-auto px-4 sm:px-6", bleed && "-mx-4 sm:-mx-6")}>
      <table
        className={cn(
          "w-full text-left text-sm",
          stack &&
            "max-md:block max-md:[&_tbody]:block max-md:[&_td]:p-0 max-md:[&_td:first-child]:w-full max-md:[&_thead]:hidden max-md:[&_tr]:flex max-md:[&_tr]:flex-wrap max-md:[&_tr]:items-center max-md:[&_tr]:gap-x-3 max-md:[&_tr]:gap-y-1.5 max-md:[&_tr]:py-3",
          className,
        )}
        {...props}
      />
    </div>
  );
}
export function THead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props} />;
}
export function TBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-border divide-y", className)} {...props} />;
}
export function TR({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("hover:bg-surface-muted/60 transition-colors", className)} {...props} />;
}
export function TH({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "border-border text-ink-muted border-b px-3 py-2.5 text-xs font-medium tracking-wide whitespace-nowrap uppercase first:pl-0 last:pr-0",
        className,
      )}
      {...props}
    />
  );
}
export function TD({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-3 py-3 align-middle first:pl-0 last:pr-0", className)} {...props} />;
}
