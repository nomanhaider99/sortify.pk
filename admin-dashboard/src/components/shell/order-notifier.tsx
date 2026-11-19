"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { pollNewOrders } from "@/app/actions/orders";
import { money } from "@/lib/format";

const INTERVAL = 15_000;

/** Polls for new orders every ~15s while the tab is visible and shows a toast for each. */
export function OrderNotifier() {
  const router = useRouter();
  const since = useRef(new Date().toISOString());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const tick = async () => {
      if (document.visibilityState === "visible") {
        try {
          const { orders, now } = await pollNewOrders(since.current);
          since.current = now;
          for (const o of orders.slice(0, 3)) {
            toast.success(`New order ${o.orderNumber}`, {
              description: `${o.name} · ${money(o.totalCents)}`,
              action: {
                label: "Open",
                onClick: () => router.push(`/orders?selected=${o.orderNumber}` as Route),
              },
            });
          }
          if (orders.length > 3) toast(`+${orders.length - 3} more new orders`);
          if (orders.length) router.refresh();
        } catch {
          // Network hiccup: try again on the next tick.
        }
      }
      if (!stopped) timer = setTimeout(() => void tick(), INTERVAL);
    };
    timer = setTimeout(() => void tick(), INTERVAL);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [router]);

  return null;
}
