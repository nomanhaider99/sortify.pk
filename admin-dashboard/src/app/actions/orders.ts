"use server";

import {
  OrderWorkflowError,
  addOrderEvent,
  addOrderNote,
  exportOrders,
  markOrderPaid,
  ordersSince,
  transitionOrder,
  updateOrderTracking,
  type OrderListFilters,
} from "@repo/db/admin";
import { AdminRuleError } from "@repo/db/admin";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  permissionForTransition,
  type OrderStatus,
} from "@repo/shared";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction, type ActionResult } from "@/lib/actions";
import { csvRow } from "@/lib/csv";
import { getAdminSession } from "@/lib/session";

const orderNumber = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2,5}-\d{8}-[A-Z0-9]{4}$/, "Invalid order number");
const status = z.enum(ORDER_STATUSES);

function wrap(error: unknown): never {
  if (error instanceof OrderWorkflowError) throw new AdminRuleError(error.message);
  throw error;
}

/** Moves an order along the workflow. Permission depends on the target status. */
export async function changeOrderStatus(
  rawNumber: string,
  rawTo: OrderStatus,
  extra: { note?: string; location?: string } = {},
): Promise<ActionResult> {
  const to = status.parse(rawTo);
  return runAction(
    permissionForTransition(to),
    async ({ session, audit }) => {
      const n = orderNumber.parse(rawNumber);
      const result = await transitionOrder(n, to, session.id, {
        note: z.string().max(500).optional().parse(extra.note),
        location: z.string().max(120).optional().parse(extra.location),
      }).catch(wrap);
      await audit({
        action: `order.${to}`,
        entityType: "order",
        entityId: n,
        summary: `${n}: ${ORDER_STATUS_LABELS[result.before]} → ${ORDER_STATUS_LABELS[to]}${result.restocked ? " (stock restored)" : ""}`,
        diff: {
          status: { before: result.before, after: result.after },
          ...(result.paymentBefore !== result.paymentAfter
            ? { paymentStatus: { before: result.paymentBefore, after: result.paymentAfter } }
            : {}),
        },
      });
      revalidatePath("/orders");
      revalidatePath("/");
      return undefined;
    },
    `Order moved to ${ORDER_STATUS_LABELS[to]}`,
  );
}

/** Bulk transition (e.g. confirm all selected). Orders that can't make the move are reported. */
export async function bulkChangeOrderStatus(
  rawNumbers: string[],
  rawTo: OrderStatus,
): Promise<ActionResult<{ done: number; failed: string[] }>> {
  const to = status.parse(rawTo);
  return runAction(permissionForTransition(to), async ({ session, audit }) => {
    const numbers = z.array(orderNumber).max(100).parse(rawNumbers);
    const failed: string[] = [];
    let done = 0;
    for (const n of numbers) {
      try {
        const r = await transitionOrder(n, to, session.id);
        done++;
        await audit({
          action: `order.${to}`,
          entityType: "order",
          entityId: n,
          summary: `${n}: ${ORDER_STATUS_LABELS[r.before]} → ${ORDER_STATUS_LABELS[to]} (bulk)`,
          diff: { status: { before: r.before, after: r.after } },
        });
      } catch {
        failed.push(n);
      }
    }
    revalidatePath("/orders");
    return { done, failed };
  });
}

const trackingSchema = z.object({
  carrier: z.string().trim().max(60).nullable(),
  trackingNumber: z.string().trim().max(80).nullable(),
  trackingUrl: z.union([z.url().max(500), z.literal("")]).nullable(),
  estimatedDelivery: z.union([z.iso.date(), z.literal("")]).nullable(),
});

export async function saveOrderTracking(
  rawNumber: string,
  input: z.input<typeof trackingSchema>,
): Promise<ActionResult> {
  return runAction(
    "orders:ship",
    async ({ audit }) => {
      const n = orderNumber.parse(rawNumber);
      const d = trackingSchema.parse(input);
      const clean = {
        carrier: d.carrier || null,
        trackingNumber: d.trackingNumber || null,
        trackingUrl: d.trackingUrl || null,
        estimatedDelivery: d.estimatedDelivery || null,
      };
      const before = await updateOrderTracking(n, clean).catch(wrap);
      await audit({
        action: "order.tracking_updated",
        entityType: "order",
        entityId: n,
        summary: `${n}: tracking ${clean.carrier ?? ""} ${clean.trackingNumber ?? ""}`.trim(),
        diff: {
          carrier: { before: before.carrier, after: clean.carrier },
          trackingNumber: { before: before.trackingNumber, after: clean.trackingNumber },
          estimatedDelivery: { before: before.estimatedDelivery, after: clean.estimatedDelivery },
        },
      });
      revalidatePath("/orders");
      return undefined;
    },
    "Tracking details saved",
  );
}

const eventSchema = z.object({
  title: z.string().trim().min(2, "Add a title").max(120),
  description: z.string().trim().max(500).default(""),
  location: z.string().trim().max(120).optional(),
  occurredAt: z.iso.datetime({ local: true }).optional().or(z.literal("")),
  isPublic: z.boolean(),
});

/** Custom tracking event — shown on the customer's tracking page when public. */
export async function addTrackingEvent(
  rawNumber: string,
  input: z.input<typeof eventSchema>,
): Promise<ActionResult> {
  return runAction(
    "orders:update",
    async ({ session, audit }) => {
      const n = orderNumber.parse(rawNumber);
      const d = eventSchema.parse(input);
      await addOrderEvent(
        n,
        {
          title: d.title,
          description: d.description,
          location: d.location || null,
          occurredAt: d.occurredAt ? new Date(d.occurredAt) : undefined,
          isPublic: d.isPublic,
        },
        session.id,
      ).catch(wrap);
      await audit({
        action: "order.event_added",
        entityType: "order",
        entityId: n,
        summary: `${n}: ${d.isPublic ? "public" : "internal"} event “${d.title}”`,
      });
      revalidatePath("/orders");
      return undefined;
    },
    "Event added",
  );
}

export async function addInternalNote(rawNumber: string, body: string): Promise<ActionResult> {
  return runAction(
    "orders:update",
    async ({ session, audit }) => {
      const n = orderNumber.parse(rawNumber);
      const text = z.string().trim().min(1, "Write a note").max(2000).parse(body);
      await addOrderNote(n, text, session.id).catch(wrap);
      await audit({
        action: "order.note_added",
        entityType: "order",
        entityId: n,
        summary: `${n}: internal note added`,
      });
      revalidatePath("/orders");
      return undefined;
    },
    "Note added",
  );
}

export async function markCodPaid(rawNumber: string): Promise<ActionResult> {
  return runAction(
    "orders:update",
    async ({ audit }) => {
      const n = orderNumber.parse(rawNumber);
      await markOrderPaid(n).catch(wrap);
      await audit({
        action: "order.marked_paid",
        entityType: "order",
        entityId: n,
        summary: `${n}: cash collected`,
        diff: { paymentStatus: { before: "pending", after: "paid" } },
      });
      revalidatePath("/orders");
      return undefined;
    },
    "Payment marked as received",
  );
}

/** CSV export of the current filter (permission: data:export). */
export async function exportOrdersCsv(
  filters: OrderListFilters,
): Promise<ActionResult<{ csv: string; filename: string }>> {
  return runAction("data:export", async ({ audit }) => {
    const rows = await exportOrders(filters);
    const header = [
      "Order",
      "Placed",
      "Status",
      "Customer",
      "Email",
      "City",
      "Country",
      "Payment",
      "Payment status",
      "Subtotal",
      "Shipping",
      "Total",
      "Carrier",
      "Tracking",
    ];
    const money = (c: number) => (c / 100).toFixed(2);
    const lines = rows.map((r) =>
      csvRow([
        r.orderNumber,
        r.placedAt,
        r.status,
        r.name,
        r.email,
        r.city,
        r.country,
        r.paymentMethod,
        r.paymentStatus,
        money(r.subtotalCents),
        money(r.shippingCents),
        money(r.totalCents),
        r.carrier,
        r.trackingNumber,
      ]),
    );
    await audit({
      action: "data.export",
      entityType: "order",
      summary: `Exported ${rows.length} orders to CSV`,
    });
    return {
      csv: [header, ...lines].join("\n"),
      filename: `orders-${new Date().toISOString().slice(0, 10)}.csv`,
    };
  });
}

/** Live new-order notifications (polled by the shell every ~15s). */
export async function pollNewOrders(
  sinceIso: string,
): Promise<{ orders: { orderNumber: string; totalCents: number; name: string }[]; now: string }> {
  const session = await getAdminSession();
  const now = new Date().toISOString();
  if (!session?.can("orders:view")) return { orders: [], now };
  const since = new Date(sinceIso);
  if (Number.isNaN(since.getTime())) return { orders: [], now };
  const rows = await ordersSince(since);
  return {
    orders: rows.map((r) => ({
      orderNumber: r.orderNumber,
      totalCents: r.totalCents,
      name: r.name,
    })),
    now,
  };
}
