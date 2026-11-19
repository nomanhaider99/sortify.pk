"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/actions/login";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function LoginForm({ callbackUrl, notice }: { callbackUrl: string; notice?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {
    error: null,
  });
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      {notice && !state.error ? (
        <p className="bg-primary-soft text-accent-ink rounded-control px-3 py-2 text-sm">
          {notice}
        </p>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {state.error ? (
        <p role="alert" className="bg-danger/10 text-danger rounded-control px-3 py-2 text-sm">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
