import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

type MarqueeProps = {
  children: ReactNode;
  className?: string;
  /** Seconds for one full loop. */
  duration?: number;
  /** Pause while hovered/focused. */
  pauseOnHover?: boolean;
  /** Accessible label (the duplicated track is hidden from assistive tech). */
  label?: string;
};

/**
 * Infinite CSS marquee. The content is rendered twice and the track translates by -50%, so the
 * loop is seamless. Pure CSS (no JS), and the global reduced-motion rule stops it.
 */
export function Marquee({
  children,
  className,
  duration = 40,
  pauseOnHover = true,
  label,
}: MarqueeProps) {
  return (
    <div
      className={cn("group relative flex overflow-hidden", className)}
      role={label ? "region" : undefined}
      aria-label={label}
    >
      <div
        className={cn(
          "animate-marquee flex w-max shrink-0 motion-reduce:animate-none",
          pauseOnHover &&
            "group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused]",
        )}
        style={{ "--marquee-duration": `${duration}s` } as CSSProperties}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
