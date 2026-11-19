"use client";

import { Plus } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createRoleAction } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formString } from "@/lib/form-data";

export function NewRoleButton() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> New role
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title="Create a custom role"
          description="You’ll choose its permissions on the next screen."
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              setError(null);
              startTransition(async () => {
                const r = await createRoleAction({
                  name: formString(fd, "name"),
                  description: formString(fd, "description"),
                  permissions: ["dashboard:view"],
                });
                if (r.ok) router.push(`/roles/${r.data.id}` as Route);
                else setError(r.error);
              });
            }}
          >
            <Field label="Role name" htmlFor="role-name">
              <Input id="role-name" name="name" required autoFocus placeholder="e.g. Warehouse" />
            </Field>
            <Field label="Description" htmlFor="role-desc">
              <Input id="role-desc" name="description" placeholder="What this role is for" />
            </Field>
            {error ? (
              <p
                role="alert"
                className="bg-danger/10 text-danger rounded-control px-3 py-2 text-sm"
              >
                {error}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Creating…" : "Create role"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
