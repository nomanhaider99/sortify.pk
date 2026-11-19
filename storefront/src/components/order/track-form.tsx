"use client";

import { useActionState } from "react";
import { lookupOrder, type TrackState } from "@/app/actions/track";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function TrackForm({ defaultOrderNumber = "" }: { defaultOrderNumber?: string }) {
  const [state, action, pending] = useActionState<TrackState, FormData>(lookupOrder, {
    error: null,
  });
  const field =
    "border-border bg-surface focus-visible:outline-primary-strong w-full rounded-xs border px-4 py-3.5 text-sm";
  return (
    <form action={action} className="grid gap-5" noValidate>
      <div>
        <label htmlFor="orderNumber" className="mb-1.5 block text-sm">
          Order number
        </label>
        <input
          id="orderNumber"
          name="orderNumber"
          defaultValue={defaultOrderNumber}
          placeholder="SF-20261118-AB12"
          autoComplete="off"
          className={`${field} uppercase`}
          aria-describedby="track-error"
        />
      </div>
      <div>
        <label htmlFor="trackEmail" className="mb-1.5 block text-sm">
          Email used at checkout
        </label>
        <input
          id="trackEmail"
          name="email"
          type="email"
          autoComplete="email"
          className={field}
          aria-describedby="track-error"
        />
      </div>
      <p id="track-error" role="alert" className="text-danger min-h-5 text-sm">
        {state.error}
      </p>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Spinner label="Looking up your order" /> : "Track order"}
      </Button>
    </form>
  );
}
