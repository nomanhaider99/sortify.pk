import { formatMoney, ORDER_STATUS_LABELS, type OrderStatus } from "@repo/shared";

export const money = (cents: number) => formatMoney(cents, "USD", { withCode: false });

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
export const fmtDate = (d: Date | string) => dateFmt.format(new Date(d));
export const fmtDateTime = (d: Date | string) => dateTimeFmt.format(new Date(d));

export function timeAgo(d: Date | string): string {
  const s = Math.round((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  return days < 30 ? `${days}d ago` : fmtDate(d);
}

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

export const ORDER_TONE: Record<OrderStatus, BadgeTone> = {
  pending: "warning",
  confirmed: "accent",
  processing: "accent",
  shipped: "accent",
  out_for_delivery: "accent",
  delivered: "success",
  cancelled: "danger",
  refunded: "neutral",
};

export const statusLabel = (s: OrderStatus) => ORDER_STATUS_LABELS[s];
