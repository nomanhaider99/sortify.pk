"use client";

import { useActionState, useState } from "react";
import type { PasswordState } from "@/app/actions/password";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/cn";

const RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: "10+ characters", test: (p) => p.length >= 10 },
  { label: "Upper & lower case", test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: "A number", test: (p) => /\d/.test(p) },
  { label: "A symbol", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

type Action = (prev: PasswordState, formData: FormData) => Promise<PasswordState>;

export function SetPasswordForm({
  action,
  hidden,
  requireCurrent = false,
  submitLabel = "Save password",
}: {
  action: Action;
  hidden?: Record<string, string>;
  requireCurrent?: boolean;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [pw, setPw] = useState("");
  return (
    <form action={formAction} className="space-y-4">
      {Object.entries(hidden ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {requireCurrent ? (
        <div className="space-y-1.5">
          <Label htmlFor="current">Current password</Label>
          <Input
            id="current"
            name="current"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
      </div>
      <ul className="grid grid-cols-2 gap-1.5 text-xs" aria-label="Password requirements">
        {RULES.map((r) => (
          <li
            key={r.label}
            className={cn(
              "flex items-center gap-1.5",
              r.test(pw) ? "text-accent-ink" : "text-ink-muted",
            )}
          >
            <span
              className={cn("size-1.5 rounded-full", r.test(pw) ? "bg-accent-ink" : "bg-border")}
              aria-hidden
            />
            {r.label}
            <span className="sr-only">{r.test(pw) ? " — met" : " — not met"}</span>
          </li>
        ))}
      </ul>
      <div className="space-y-1.5">
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
      </div>
      {state.error ? (
        <p role="alert" className="bg-danger/10 text-danger rounded-control px-3 py-2 text-sm">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
