"use client";

import { ORDER_FLOW, ORDER_STATUS_LABELS, type OrderStatus } from "@repo/shared";
import { Check, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

type Event = {
  id: string;
  status: OrderStatus | null;
  title: string;
  description: string;
  location: string | null;
  occurredAt: string;
};

/**
 * Animated tracking stepper (Placed → Confirmed → Processing → Shipped → Out for delivery →
 * Delivered) plus the event history. Cancelled/refunded orders show a terminal state.
 */
export function OrderTimeline({ status, events }: { status: OrderStatus; events: Event[] }) {
  const reduced = useReducedMotion() ?? false;
  const terminal = status === "cancelled" || status === "refunded";
  // For refunded orders, show how far it got before the refund.
  const reachedIdx = terminal
    ? Math.max(-1, ...events.map((e) => (e.status ? ORDER_FLOW.indexOf(e.status) : -1)))
    : ORDER_FLOW.indexOf(status);
  const eventFor = (s: OrderStatus) => events.find((e) => e.status === s);
  const progress = Math.max(0, reachedIdx) / (ORDER_FLOW.length - 1);

  return (
    <div>
      {/* Stepper */}
      <div className="relative">
        <div
          className="bg-border absolute top-4 right-4 left-4 h-px md:right-8 md:left-8"
          aria-hidden
        />
        <motion.div
          className={cn(
            "absolute top-4 left-4 h-px origin-left md:left-8",
            terminal ? "bg-ink-muted" : "bg-primary-strong",
          )}
          style={{ width: "calc(100% - 2rem)" }}
          initial={{ scaleX: reduced ? progress : 0 }}
          animate={{ scaleX: progress }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          aria-hidden
        />
        <ol className="relative grid grid-cols-6 gap-2">
          {ORDER_FLOW.map((s, i) => {
            const done = i <= reachedIdx;
            const current = i === reachedIdx && !terminal;
            const ev = eventFor(s);
            return (
              <li
                key={s}
                className="flex flex-col items-center text-center"
                aria-current={current ? "step" : undefined}
              >
                <motion.span
                  className={cn(
                    "relative flex size-8 items-center justify-center rounded-full border text-xs",
                    done
                      ? "bg-primary-strong border-primary-strong text-on-strong"
                      : "bg-bg border-border text-ink-muted",
                  )}
                  initial={reduced ? false : { scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.25 + i * 0.18, duration: 0.4 }}
                >
                  {done ? <Check className="size-4" aria-hidden /> : i + 1}
                  {current && !reduced ? (
                    <motion.span
                      className="border-primary-strong absolute inset-0 rounded-full border"
                      animate={{ scale: [1, 1.6], opacity: [0.7, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                      aria-hidden
                    />
                  ) : null}
                </motion.span>
                <span
                  className={cn(
                    "mt-3 text-[0.7rem] leading-tight md:text-xs",
                    done ? "text-ink" : "text-ink-muted",
                  )}
                >
                  {ORDER_STATUS_LABELS[s]}
                </span>
                {ev ? (
                  <span className="text-ink-muted mt-1 hidden text-[0.65rem] md:block">
                    {dateFmt.format(new Date(ev.occurredAt))}
                  </span>
                ) : null}
                <span className="sr-only">{done ? "completed" : "pending"}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {terminal ? (
        <p className="bg-danger/10 text-danger mt-8 flex items-center gap-2 rounded-xs px-4 py-3 text-sm">
          <X className="size-4" aria-hidden /> This order was{" "}
          {status === "cancelled" ? "cancelled" : "refunded"}.
        </p>
      ) : null}

      {/* History */}
      <h2 className="mt-14 text-xs font-medium tracking-[0.12em] uppercase">Tracking history</h2>
      <ol className="border-border mt-5 space-y-6 border-l pl-6">
        {[...events].reverse().map((e, i) => (
          <motion.li
            key={e.id}
            className="relative"
            initial={reduced ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.08 }}
          >
            <span
              className={cn(
                "border-bg absolute top-1.5 -left-[1.95rem] size-3 rounded-full border-2",
                i === 0 ? "bg-primary-strong" : "bg-border",
              )}
              aria-hidden
            />
            <p className="text-sm font-medium">{e.title}</p>
            {e.description ? (
              <p className="text-ink-muted mt-0.5 text-sm">{e.description}</p>
            ) : null}
            <p className="text-ink-muted mt-1 text-xs">
              <time dateTime={e.occurredAt}>{dateFmt.format(new Date(e.occurredAt))}</time>
              {e.location ? ` · ${e.location}` : ""}
            </p>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
