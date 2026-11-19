"use client";

import type { OrderListFilters } from "@repo/db/admin";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@repo/shared";
import { Download, Search } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { bulkChangeOrderStatus, exportOrdersCsv } from "@/app/actions/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { money, ORDER_TONE } from "@/lib/format";
import { LocalTime } from "@/components/ui/local-time";

type Row = {
  orderNumber: string;
  email: string;
  customerName: string;
  status: OrderStatus;
  paymentMethod: "cod" | "card_demo";
  paymentStatus: string;
  totalCents: number;
  placedAt: string;
  itemCount: number;
};

export function OrdersInbox({
  rows,
  total,
  selected,
  statusCounts,
  views,
  can,
}: {
  rows: Row[];
  total: number;
  selected: string | null;
  statusCounts: Partial<Record<OrderStatus, number>>;
  views: { key: string; label: string }[];
  can: { confirm: boolean; update: boolean; cancel: boolean; export: boolean };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(sp.get("q") ?? "");

  const setParam = (updates: Record<string, string | null>) => {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    router.replace(`${pathname}?${p.toString()}` as Route, { scroll: false });
  };
  const select = (n: string) => setParam({ selected: n });

  // J / K keyboard navigation through the list (ignored while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      )
        return;
      if (e.key !== "j" && e.key !== "k") return;
      const i = rows.findIndex((r) => r.orderNumber === selected);
      const next = rows[e.key === "j" ? Math.min(rows.length - 1, i + 1) : Math.max(0, i - 1)];
      if (next) {
        e.preventDefault();
        select(next.orderNumber);
        document
          .getElementById(`order-row-${next.orderNumber}`)
          ?.scrollIntoView({ block: "nearest" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const toggle = (n: string) =>
    setChecked((s) => {
      const next = new Set(s);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });

  const bulk = (to: OrderStatus) =>
    startTransition(async () => {
      const r = await bulkChangeOrderStatus([...checked], to);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(
        `${r.data.done} order(s) moved to ${ORDER_STATUS_LABELS[to]}${r.data.failed.length ? ` · ${r.data.failed.length} skipped (not eligible)` : ""}`,
      );
      setChecked(new Set());
      router.refresh();
    });

  const exportCsv = () =>
    startTransition(async () => {
      const from = sp.get("from");
      const to = sp.get("to");
      const r = await exportOrdersCsv({
        q: sp.get("q") ?? undefined,
        view: (sp.get("view") as OrderListFilters["view"] | null) ?? undefined,
        status: (sp.get("status") as OrderStatus | null) ?? undefined,
        paymentMethod: (sp.get("payment") as OrderListFilters["paymentMethod"] | null) ?? undefined,
        from: from ? new Date(`${from}T00:00:00`) : undefined,
        to: to ? new Date(`${to}T23:59:59`) : undefined,
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      const url = URL.createObjectURL(new Blob([r.data.csv], { type: "text/csv;charset=utf-8" }));
      const a = Object.assign(document.createElement("a"), {
        href: url,
        download: r.data.filename,
      });
      a.click();
      URL.revokeObjectURL(url);
    });

  const activeView = sp.get("view");
  const allChecked = rows.length > 0 && rows.every((r) => checked.has(r.orderNumber));

  return (
    <Card className="p-0">
      <div className="border-border space-y-3 border-b p-4">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Saved views">
          <button
            type="button"
            role="tab"
            aria-selected={!activeView}
            onClick={() => setParam({ view: null, selected: null })}
            className={cn(
              "rounded-full px-3 py-1 text-xs",
              !activeView
                ? "bg-primary-strong text-on-strong"
                : "bg-surface-muted text-ink-muted hover:text-ink",
            )}
          >
            All orders
          </button>
          {views.map((v) => (
            <button
              key={v.key}
              type="button"
              role="tab"
              aria-selected={activeView === v.key}
              onClick={() => setParam({ view: v.key, selected: null })}
              className={cn(
                "rounded-full px-3 py-1 text-xs",
                activeView === v.key
                  ? "bg-primary-strong text-on-strong"
                  : "bg-surface-muted text-ink-muted hover:text-ink",
              )}
            >
              {v.label}
              {v.key === "needs-confirmation" && statusCounts.pending
                ? ` · ${statusCounts.pending}`
                : ""}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setParam({ q: q.trim() || null, selected: null });
          }}
        >
          <div className="relative flex-1">
            <Search
              className="text-ink-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Order #, email or name"
              className="pl-9"
              aria-label="Search orders"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        <div className="grid grid-cols-2 gap-2">
          <Select
            aria-label="Status"
            value={sp.get("status") ?? ""}
            onChange={(e) => setParam({ status: e.target.value || null, selected: null })}
          >
            <option value="">Any status</option>
            {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v} {statusCounts[k as OrderStatus] ? `(${statusCounts[k as OrderStatus]})` : ""}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Payment method"
            value={sp.get("payment") ?? ""}
            onChange={(e) => setParam({ payment: e.target.value || null, selected: null })}
          >
            <option value="">Any payment</option>
            <option value="cod">Cash on delivery</option>
            <option value="card_demo">Card</option>
          </Select>
          <Input
            type="date"
            aria-label="From date"
            value={sp.get("from") ?? ""}
            onChange={(e) => setParam({ from: e.target.value || null, selected: null })}
          />
          <Input
            type="date"
            aria-label="To date"
            value={sp.get("to") ?? ""}
            onChange={(e) => setParam({ to: e.target.value || null, selected: null })}
          />
        </div>
      </div>

      <div className="border-border flex items-center gap-3 border-b px-4 py-2 text-xs">
        <input
          type="checkbox"
          className="accent-primary-strong size-4"
          checked={allChecked}
          onChange={() =>
            setChecked(allChecked ? new Set() : new Set(rows.map((r) => r.orderNumber)))
          }
          aria-label="Select all orders"
        />
        {checked.size ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{checked.size} selected</span>
            {can.confirm ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => bulk("confirmed")}
              >
                Confirm
              </Button>
            ) : null}
            {can.update ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => bulk("processing")}
              >
                Processing
              </Button>
            ) : null}
            {can.cancel ? (
              <Button
                size="sm"
                variant="ghost"
                className="text-danger"
                disabled={pending}
                onClick={() =>
                  window.confirm(`Cancel ${checked.size} order(s)? Stock will be restored.`) &&
                  bulk("cancelled")
                }
              >
                Cancel
              </Button>
            ) : null}
          </div>
        ) : (
          <span className="text-ink-muted">
            {total} order{total === 1 ? "" : "s"} ·{" "}
            <kbd className="border-border rounded border px-1">J</kbd>/
            <kbd className="border-border rounded border px-1">K</kbd> to move
          </span>
        )}
        {can.export ? (
          <button
            type="button"
            onClick={exportCsv}
            disabled={pending}
            className="text-ink-muted hover:text-ink ml-auto inline-flex items-center gap-1"
          >
            <Download className="size-3.5" aria-hidden /> CSV
          </button>
        ) : null}
      </div>

      <ul
        className="divide-border max-h-[calc(100svh-22rem)] min-h-64 divide-y overflow-y-auto"
        aria-label="Orders"
      >
        {rows.map((r) => {
          const active = r.orderNumber === selected;
          return (
            <li
              key={r.orderNumber}
              id={`order-row-${r.orderNumber}`}
              className={cn(
                "flex items-start gap-3 px-4 py-3 transition-colors",
                active ? "bg-primary-soft" : "hover:bg-surface-muted",
              )}
            >
              <input
                type="checkbox"
                className="accent-primary-strong mt-1 size-4"
                checked={checked.has(r.orderNumber)}
                onChange={() => toggle(r.orderNumber)}
                aria-label={`Select ${r.orderNumber}`}
              />
              <button
                type="button"
                onClick={() => select(r.orderNumber)}
                aria-current={active ? "true" : undefined}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium">{r.customerName}</span>
                  <span className="text-sm tabular-nums">{money(r.totalCents)}</span>
                </div>
                <div className="text-ink-muted mt-0.5 flex items-center justify-between gap-3 text-xs">
                  <span className="truncate">
                    {r.orderNumber} · {r.itemCount} item{r.itemCount === 1 ? "" : "s"} ·{" "}
                    <LocalTime value={r.placedAt} format="ago" />
                  </span>
                  <Badge tone={ORDER_TONE[r.status]}>{ORDER_STATUS_LABELS[r.status]}</Badge>
                </div>
                <p className="text-ink-muted mt-1 text-[0.6875rem]">
                  {r.paymentMethod === "cod" ? "Cash on delivery" : "Card"} · {r.paymentStatus}
                </p>
              </button>
            </li>
          );
        })}
        {!rows.length ? (
          <li className="text-ink-muted px-4 py-16 text-center text-sm">No orders match.</li>
        ) : null}
      </ul>
    </Card>
  );
}
