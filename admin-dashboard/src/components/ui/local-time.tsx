"use client";

import { useSyncExternalStore } from "react";
import { fmtDate, fmtDateTime, timeAgo } from "@/lib/format";

const noop = () => () => {};

/**
 * Renders a timestamp in the viewer's timezone. The server (UTC on Vercel) can't know it, so the
 * server/hydration pass prints a neutral UTC date and the client swaps in the local value —
 * avoiding hydration mismatches from timezones and "x minutes ago" drift.
 */
export function LocalTime({
  value,
  format = "datetime",
}: {
  value: Date | string;
  format?: "datetime" | "date" | "ago";
}) {
  const isClient = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const d = new Date(value);
  const text = !isClient
    ? d.toISOString().slice(0, 10)
    : format === "ago"
      ? timeAgo(d)
      : format === "date"
        ? fmtDate(d)
        : fmtDateTime(d);
  return (
    <time dateTime={d.toISOString()} title={isClient ? d.toLocaleString() : undefined}>
      {text}
    </time>
  );
}
