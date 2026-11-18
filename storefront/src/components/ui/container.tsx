import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Max 1440px content container with fluid gutters (PLAN.md §4.3). */
export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("container-site", className)} {...props} />;
}
