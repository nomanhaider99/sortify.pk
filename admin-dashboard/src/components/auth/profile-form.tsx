"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, {
    error: null,
  });
  return (
    <form action={action} className="space-y-4">
      <Field label="Name" htmlFor="profile-name" error={state.error ?? undefined}>
        <Input id="profile-name" name="name" defaultValue={name} required />
      </Field>
      <Field
        label="Email"
        htmlFor="profile-email"
        hint="Ask an Owner to change your sign-in email."
      >
        <Input id="profile-email" value={email} disabled readOnly />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
        {state.saved ? <span className="text-accent-ink text-sm">Saved</span> : null}
      </div>
    </form>
  );
}
