"use client";

import { ORDER_STATUS_LABELS, type OrderStatus } from "@repo/shared";
import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  addInternalNote,
  addTrackingEvent,
  changeOrderStatus,
  markCodPaid,
  saveOrderTracking,
} from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Checkbox, Field, Textarea } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/actions";
import { LocalTime } from "@/components/ui/local-time";

function useRun() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<ActionResult<unknown>>, onOk?: () => void) =>
    startTransition(async () => {
      const r = await fn();
      if (r.ok) {
        toast.success(r.message ?? "Saved");
        onOk?.();
        router.refresh();
      } else toast.error(r.error);
    });
  return { pending, run };
}

/** Primary next action + secondary actions (cancel, refund, mark paid). */
export function OrderActions({
  orderNumber,
  status,
  next,
  paymentMethod,
  paymentStatus,
  hasTracking,
  can,
}: {
  orderNumber: string;
  status: OrderStatus;
  next: { to: OrderStatus; label: string } | null;
  paymentMethod: "cod" | "card_demo";
  paymentStatus: string;
  hasTracking: boolean;
  can: { confirm: boolean; update: boolean; ship: boolean; cancel: boolean; refund: boolean };
}) {
  const { pending, run } = useRun();
  const [shipOpen, setShipOpen] = useState(false);
  const allowed = (to: OrderStatus) =>
    to === "confirmed"
      ? can.confirm
      : to === "processing"
        ? can.update
        : ["shipped", "out_for_delivery", "delivered"].includes(to)
          ? can.ship
          : false;
  const canCancel = can.cancel && ["pending", "confirmed", "processing"].includes(status);
  const canRefund = can.refund && status === "delivered";
  const canMarkPaid =
    can.update &&
    paymentMethod === "cod" &&
    paymentStatus === "pending" &&
    !["cancelled", "refunded"].includes(status);

  const advance = () => {
    if (!next) return;
    // Shipping without tracking details: ask for them first.
    if (next.to === "shipped" && !hasTracking) {
      setShipOpen(true);
      return;
    }
    run(() => changeOrderStatus(orderNumber, next.to));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {next && allowed(next.to) ? (
        <Button size="lg" onClick={advance} disabled={pending}>
          {pending ? "Working…" : next.label}
        </Button>
      ) : next ? (
        <p className="text-ink-muted text-sm">Next step: {next.label} (needs permission)</p>
      ) : (
        <p className="text-ink-muted text-sm">
          {status === "delivered"
            ? "Order complete."
            : `No further steps (${ORDER_STATUS_LABELS[status]}).`}
        </p>
      )}
      {canMarkPaid ? (
        <Button
          variant="secondary"
          onClick={() => run(() => markCodPaid(orderNumber))}
          disabled={pending}
        >
          Mark cash received
        </Button>
      ) : null}
      {canCancel || canRefund ? (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            className="border-border hover:bg-surface-muted rounded-control inline-flex size-10 items-center justify-center border"
            aria-label="More order actions"
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              className="bg-surface border-border rounded-card z-50 min-w-48 border p-1.5 text-sm shadow-lg"
            >
              {canCancel ? (
                <DropdownMenu.Item
                  className="text-danger data-[highlighted]:bg-surface-muted rounded-control cursor-pointer px-3 py-2 outline-none"
                  onSelect={() => {
                    if (
                      window.confirm(
                        `Cancel ${orderNumber}? Stock will be restored${paymentStatus === "paid" ? " and the payment marked refunded" : ""}.`,
                      )
                    )
                      run(() => changeOrderStatus(orderNumber, "cancelled"));
                  }}
                >
                  Cancel order
                </DropdownMenu.Item>
              ) : null}
              {canRefund ? (
                <DropdownMenu.Item
                  className="text-danger data-[highlighted]:bg-surface-muted rounded-control cursor-pointer px-3 py-2 outline-none"
                  onSelect={() => {
                    if (
                      window.confirm(
                        `Mark ${orderNumber} as refunded? (No money is moved in demo mode.)`,
                      )
                    )
                      run(() => changeOrderStatus(orderNumber, "refunded"));
                  }}
                >
                  Refund order
                </DropdownMenu.Item>
              ) : null}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      ) : null}

      <Dialog open={shipOpen} onOpenChange={setShipOpen}>
        <DialogContent
          title="Ship with tracking"
          description="The customer will see this on their tracking page."
        >
          <TrackingForm
            orderNumber={orderNumber}
            initial={{ carrier: "", trackingNumber: "", trackingUrl: "", estimatedDelivery: "" }}
            submitLabel="Save & mark shipped"
            onSaved={() => {
              setShipOpen(false);
              run(() => changeOrderStatus(orderNumber, "shipped"));
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function TrackingForm({
  orderNumber,
  initial,
  disabled,
  submitLabel = "Save tracking",
  onSaved,
}: {
  orderNumber: string;
  initial: {
    carrier: string;
    trackingNumber: string;
    trackingUrl: string;
    estimatedDelivery: string;
  };
  disabled?: boolean;
  submitLabel?: string;
  onSaved?: () => void;
}) {
  const uid = useId();
  const [v, setV] = useState(initial);
  const { pending, run } = useRun();
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));
  return (
    <form
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () =>
            saveOrderTracking(orderNumber, {
              carrier: v.carrier || null,
              trackingNumber: v.trackingNumber || null,
              trackingUrl: v.trackingUrl || null,
              estimatedDelivery: v.estimatedDelivery || null,
            }),
          onSaved,
        );
      }}
    >
      <Field label="Carrier" htmlFor={`${uid}-carrier`}>
        <Input
          id={`${uid}-carrier`}
          value={v.carrier}
          onChange={set("carrier")}
          placeholder="UPS, DHL, TCS…"
          disabled={disabled}
        />
      </Field>
      <Field label="Tracking number" htmlFor={`${uid}-tn`}>
        <Input
          id={`${uid}-tn`}
          value={v.trackingNumber}
          onChange={set("trackingNumber")}
          disabled={disabled}
        />
      </Field>
      <Field label="Tracking URL" htmlFor={`${uid}-tu`}>
        <Input
          id={`${uid}-tu`}
          type="url"
          value={v.trackingUrl}
          onChange={set("trackingUrl")}
          placeholder="https://"
          disabled={disabled}
        />
      </Field>
      <Field label="Estimated delivery" htmlFor={`${uid}-eta`}>
        <Input
          id={`${uid}-eta`}
          type="date"
          value={v.estimatedDelivery}
          onChange={set("estimatedDelivery")}
          disabled={disabled}
        />
      </Field>
      {!disabled ? (
        <div className="sm:col-span-2">
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "Saving…" : submitLabel}
          </Button>
        </div>
      ) : null}
    </form>
  );
}

export function EventForm({ orderNumber }: { orderNumber: string }) {
  const { pending, run } = useRun();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  return (
    <form
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () =>
            addTrackingEvent(orderNumber, { title, description, location, occurredAt, isPublic }),
          () => {
            setTitle("");
            setDescription("");
            setLocation("");
            setOccurredAt("");
          },
        );
      }}
    >
      <p className="text-sm font-medium sm:col-span-2">Add a tracking event</p>
      <Field label="Title" htmlFor={`ev-title-${orderNumber}`}>
        <Input
          id={`ev-title-${orderNumber}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Arrived at local depot"
          required
        />
      </Field>
      <Field label="Location (optional)" htmlFor={`ev-loc-${orderNumber}`}>
        <Input
          id={`ev-loc-${orderNumber}`}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </Field>
      <Field
        label="Details (optional)"
        htmlFor={`ev-desc-${orderNumber}`}
        className="sm:col-span-2"
      >
        <Input
          id={`ev-desc-${orderNumber}`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      <Field label="When" htmlFor={`ev-at-${orderNumber}`} hint="Leave empty for now">
        <Input
          id={`ev-at-${orderNumber}`}
          type="datetime-local"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
        />
      </Field>
      <label className="flex items-center gap-2 self-center text-sm">
        <Checkbox checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} /> Show to
        customer
      </label>
      <div className="sm:col-span-2">
        <Button type="submit" variant="secondary" disabled={pending || title.trim().length < 2}>
          {pending ? "Adding…" : "Add event"}
        </Button>
      </div>
    </form>
  );
}

export function NotesPanel({
  orderNumber,
  notes,
  disabled,
}: {
  orderNumber: string;
  notes: { id: string; body: string; author: string; createdAt: string }[];
  disabled: boolean;
}) {
  const { pending, run } = useRun();
  const [body, setBody] = useState("");
  return (
    <div className="space-y-4">
      {!disabled ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () => addInternalNote(orderNumber, body),
              () => setBody(""),
            );
          }}
          className="space-y-2"
        >
          <label htmlFor={`note-${orderNumber}`} className="sr-only">
            Internal note
          </label>
          <Textarea
            id={`note-${orderNumber}`}
            rows={2}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Only visible to staff…"
          />
          <Button type="submit" size="sm" variant="secondary" disabled={pending || !body.trim()}>
            Add note
          </Button>
        </form>
      ) : null}
      <ul className="space-y-3">
        {notes.map((n) => (
          <li key={n.id} className="bg-surface-muted rounded-control px-3 py-2 text-sm">
            <p className="whitespace-pre-wrap">{n.body}</p>
            <p className="text-ink-muted mt-1 text-xs">
              {n.author} · <LocalTime value={n.createdAt} />
            </p>
          </li>
        ))}
        {!notes.length ? <li className="text-ink-muted text-sm">No notes yet.</li> : null}
      </ul>
    </div>
  );
}
