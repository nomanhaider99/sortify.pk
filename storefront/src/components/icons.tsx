import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = { "aria-hidden": true, focusable: false } as const;

export function InstagramIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...base}
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...base} {...props}>
      <path d="M17.75 3h3.07l-6.72 7.68L22 21h-6.19l-4.85-6.34L5.4 21H2.33l7.19-8.21L2 3h6.35l4.38 5.79L17.75 3Zm-1.08 16.2h1.7L7.4 4.72H5.58L16.67 19.2Z" />
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...base} {...props}>
      <path d="M13.5 21v-7.5h2.53l.38-2.94H13.5V8.7c0-.85.24-1.43 1.46-1.43h1.56V4.64A20.9 20.9 0 0 0 14.25 4.5c-2.25 0-3.79 1.37-3.79 3.9v2.16H7.92v2.94h2.54V21h3.04Z" />
    </svg>
  );
}

/** Card / payment method badges for the footer (generic marks, not brand logos). */
export function PaymentBadge({ label }: { label: string }) {
  return (
    <span className="border-border text-ink-muted bg-surface inline-flex h-7 min-w-12 items-center justify-center rounded-xs border px-2 text-[0.65rem] font-semibold tracking-wider uppercase">
      {label}
    </span>
  );
}
