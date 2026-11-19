"use client";

import { PERMISSION_GROUPS } from "@repo/shared";
import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteRoleAction, saveRolePermissions } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const ACTION_ORDER = ["view", "create", "update", "delete"];
const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  orders: "Orders",
  products: "Products",
  categories: "Categories",
  customers: "Customers",
  reviews: "Reviews",
  messages: "Messages",
  users: "Users",
  roles: "Roles",
  settings: "Settings",
  audit: "Audit log",
  data: "Data",
};

type Role = {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
};

/** Checkbox permission matrix (rows = resources, columns = CRUD + special actions). */
export function PermissionMatrix({
  role,
  readOnly,
  lockedReason,
  canDelete,
}: {
  role: Role;
  readOnly: boolean;
  lockedReason?: string | undefined;
  canDelete: boolean;
}) {
  const [selected, setSelected] = useState(() => new Set(role.permissions));
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const dirty = useMemo(
    () =>
      name !== role.name ||
      description !== role.description ||
      selected.size !== role.permissions.length ||
      role.permissions.some((p) => !selected.has(p)),
    [name, description, selected, role],
  );

  const toggle = (p: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      // Any other permission on a resource implies being able to view it.
      const [resource, action] = p.split(":");
      if (next.has(p) && action !== "view" && resource) {
        const view = `${resource}:view`;
        if (PERMISSION_GROUPS.some((g) => g.permissions.includes(view as never))) next.add(view);
      }
      return next;
    });
  const toggleRow = (perms: string[]) =>
    setSelected((s) => {
      const next = new Set(s);
      const all = perms.every((p) => next.has(p));
      for (const p of perms) {
        if (all) next.delete(p);
        else next.add(p);
      }
      return next;
    });

  const save = () =>
    startTransition(async () => {
      const r = await saveRolePermissions(role.id, {
        name,
        description,
        permissions: [...selected],
      });
      if (r.ok) {
        toast.success(r.message ?? "Saved");
        router.refresh();
      } else toast.error(r.error);
    });

  return (
    <div className="space-y-6">
      <Link
        href={"/roles"}
        className="text-ink-muted hover:text-ink inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden /> All roles
      </Link>

      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Role name"
            htmlFor="role-name"
            hint={role.isSystem ? "System role names can’t be changed." : undefined}
          >
            <Input
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={readOnly || role.isSystem}
            />
          </Field>
          <Field label="Description" htmlFor="role-desc">
            <Input
              id="role-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={readOnly || role.isSystem}
            />
          </Field>
        </div>
        {lockedReason ? (
          <p className="bg-surface-muted text-ink-muted rounded-control mt-4 flex items-center gap-2 px-3 py-2 text-sm">
            <Lock className="size-4" aria-hidden /> {lockedReason}
          </p>
        ) : null}
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Permissions</h2>
            <p className="text-ink-muted text-sm">{selected.size} selected</p>
          </div>
          <div className="flex gap-2">
            {canDelete ? (
              <Button
                variant="ghost"
                className="text-danger"
                disabled={pending}
                onClick={() => {
                  if (!window.confirm(`Delete the ${role.name} role?`)) return;
                  startTransition(async () => {
                    const r = await deleteRoleAction(role.id);
                    if (r.ok) {
                      toast.success(r.message ?? "Deleted");
                      router.push("/roles");
                    } else toast.error(r.error);
                  });
                }}
              >
                Delete role
              </Button>
            ) : null}
            {!readOnly ? (
              <Button onClick={save} disabled={!dirty || pending}>
                {pending ? "Saving…" : "Save changes"}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="-mx-6 overflow-x-auto px-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-ink-muted border-border border-b text-xs tracking-wide uppercase">
                <th className="py-2.5 text-left font-medium">Area</th>
                {ACTION_ORDER.map((a) => (
                  <th key={a} className="px-3 py-2.5 text-center font-medium">
                    {a}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-left font-medium">Special</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {PERMISSION_GROUPS.map((g) => {
                const crud = ACTION_ORDER.map((a) =>
                  g.permissions.find((p) => p === `${g.resource}:${a}`),
                );
                const special = g.permissions.filter(
                  (p) => !ACTION_ORDER.includes(p.split(":")[1] ?? ""),
                );
                return (
                  <tr key={g.resource} className="hover:bg-surface-muted/60">
                    <th scope="row" className="py-3 pr-4 text-left font-medium">
                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => toggleRow(g.permissions)}
                        className="hover:underline disabled:no-underline"
                        title={readOnly ? undefined : "Toggle all in this row"}
                      >
                        {LABELS[g.resource] ?? g.resource}
                      </button>
                    </th>
                    {crud.map((p, i) => (
                      <td key={ACTION_ORDER[i]} className="px-3 py-3 text-center">
                        {p ? (
                          <input
                            type="checkbox"
                            className="accent-primary-strong size-4"
                            checked={selected.has(p)}
                            disabled={readOnly}
                            onChange={() => toggle(p)}
                            aria-label={`${LABELS[g.resource] ?? g.resource}: ${ACTION_ORDER[i]}`}
                          />
                        ) : (
                          <span className="text-border" aria-hidden>
                            —
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {special.map((p) => (
                          <label key={p} className="flex items-center gap-2 whitespace-nowrap">
                            <input
                              type="checkbox"
                              className="accent-primary-strong size-4"
                              checked={selected.has(p)}
                              disabled={readOnly}
                              onChange={() => toggle(p)}
                            />
                            <span className="text-ink-muted">{p.split(":")[1]}</span>
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
