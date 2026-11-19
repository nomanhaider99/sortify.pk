"use client";

import { Check, Copy, MoreHorizontal, UserPlus } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import {
  createResetLink,
  forceLogout,
  inviteUser,
  removeUser,
  resendInvite,
  toggleUserActive,
  updateUserRole,
} from "@/app/actions/users";
import { Badge } from "@/components/ui/badge";
import type { ActionResult } from "@/lib/actions";
import { formString } from "@/lib/form-data";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Select } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";

type User = {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  hasPassword: boolean;
  roleId: string;
  roleName: string;
  lastLoginAt: string | null;
  createdAt: string;
};

const dateFmt = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export function UsersTable({
  users,
  roles,
  currentUserId,
  can,
  openInvite,
}: {
  users: User[];
  roles: { id: string; name: string }[];
  currentUserId: string;
  can: { invite: boolean; update: boolean; delete: boolean };
  openInvite: boolean;
}) {
  const [inviteOpen, setInviteOpen] = useState(openInvite && can.invite);
  const [link, setLink] = useState<{ title: string; url: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const run = <T,>(fn: () => Promise<ActionResult<T>>, onOk?: (data: T) => void) =>
    startTransition(async () => {
      const r = await fn();
      if (r.ok) {
        if (r.message) toast.success(r.message);
        onOk?.(r.data);
      } else toast.error(r.error);
    });

  return (
    <>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Team members</CardTitle>
            <p className="text-ink-muted text-sm">{users.length} users</p>
          </div>
          {can.invite ? (
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus /> Invite user
            </Button>
          ) : null}
        </CardHeader>
        <Table stack>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Role</TH>
              <TH>Status</TH>
              <TH>Last sign-in</TH>
              <TH className="w-10">
                <span className="sr-only">Actions</span>
              </TH>
            </tr>
          </THead>
          <TBody>
            {users.map((u) => {
              const self = u.id === currentUserId;
              return (
                <TR key={u.id}>
                  <TD>
                    <p className="font-medium">
                      {u.name}{" "}
                      {self ? (
                        <span className="text-ink-muted text-xs font-normal">(you)</span>
                      ) : null}
                    </p>
                    <p className="text-ink-muted text-xs">{u.email}</p>
                  </TD>
                  <TD>
                    {can.update && !self ? (
                      <Select
                        aria-label={`Role for ${u.name}`}
                        value={u.roleId}
                        disabled={pending}
                        onChange={(e) => run(() => updateUserRole(u.id, e.target.value))}
                        className="h-8 w-40"
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      u.roleName
                    )}
                  </TD>
                  <TD>
                    {!u.isActive ? (
                      <Badge tone="danger">Disabled</Badge>
                    ) : !u.hasPassword ? (
                      <Badge tone="warning">Invite pending</Badge>
                    ) : (
                      <Badge tone="success">Active</Badge>
                    )}
                  </TD>
                  <TD className="text-ink-muted whitespace-nowrap">
                    {u.lastLoginAt ? dateFmt.format(new Date(u.lastLoginAt)) : "Never"}
                  </TD>
                  <TD>
                    {(can.update || can.invite || can.delete) && !self ? (
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger
                          className="text-ink-muted hover:bg-surface-muted hover:text-ink rounded-control p-1.5"
                          aria-label={`Actions for ${u.name}`}
                        >
                          <MoreHorizontal className="size-4" aria-hidden />
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            align="end"
                            className="bg-surface border-border rounded-card z-50 min-w-52 border p-1.5 text-sm shadow-lg"
                          >
                            {can.invite && !u.hasPassword ? (
                              <MenuItem
                                onSelect={() =>
                                  run(
                                    () => resendInvite(u.id),
                                    (d) => setLink({ title: "New invite link", url: d.link }),
                                  )
                                }
                              >
                                New invite link
                              </MenuItem>
                            ) : null}
                            {can.update && u.hasPassword ? (
                              <MenuItem
                                onSelect={() =>
                                  run(
                                    () => createResetLink(u.id),
                                    (d) => setLink({ title: "Password reset link", url: d.link }),
                                  )
                                }
                              >
                                Reset password
                              </MenuItem>
                            ) : null}
                            {can.update ? (
                              <MenuItem onSelect={() => run(() => forceLogout(u.id))}>
                                Sign out everywhere
                              </MenuItem>
                            ) : null}
                            {can.update ? (
                              <MenuItem
                                onSelect={() => run(() => toggleUserActive(u.id, !u.isActive))}
                              >
                                {u.isActive ? "Disable account" : "Enable account"}
                              </MenuItem>
                            ) : null}
                            {can.delete ? (
                              <>
                                <DropdownMenu.Separator className="bg-border my-1 h-px" />
                                <MenuItem
                                  danger
                                  onSelect={() => {
                                    if (window.confirm(`Delete ${u.name}? This can’t be undone.`))
                                      run(() => removeUser(u.id));
                                  }}
                                >
                                  Delete user
                                </MenuItem>
                              </>
                            ) : null}
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    ) : null}
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </Card>

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        roles={roles}
        onInvited={(url) => setLink({ title: "Invite link created", url })}
      />
      <LinkDialog link={link} onClose={() => setLink(null)} />
    </>
  );
}

function MenuItem({
  children,
  onSelect,
  danger,
}: {
  children: ReactNode;
  onSelect: () => void;
  danger?: boolean;
}) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className={`data-[highlighted]:bg-surface-muted rounded-control cursor-pointer px-3 py-2 outline-none ${danger ? "text-danger" : ""}`}
    >
      {children}
    </DropdownMenu.Item>
  );
}

function InviteDialog({
  open,
  onOpenChange,
  roles,
  onInvited,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  roles: { id: string; name: string }[];
  onInvited: (url: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const defaultRole = roles.find((r) => r.name === "Viewer")?.id ?? roles[0]?.id ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Invite a team member"
        description="They’ll get a one-time link (valid 48 hours) to set their own password."
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setError(null);
            startTransition(async () => {
              const r = await inviteUser({
                name: formString(fd, "name"),
                email: formString(fd, "email"),
                roleId: formString(fd, "roleId"),
              });
              if (r.ok) {
                onOpenChange(false);
                onInvited(r.data.link);
              } else setError(r.error);
            });
          }}
        >
          <Field label="Full name" htmlFor="invite-name">
            <Input id="invite-name" name="name" required autoFocus />
          </Field>
          <Field label="Email" htmlFor="invite-email">
            <Input id="invite-email" name="email" type="email" required />
          </Field>
          <Field label="Role" htmlFor="invite-role" hint="You can change this later.">
            <Select id="invite-role" name="roleId" defaultValue={defaultRole}>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Field>
          {error ? (
            <p role="alert" className="bg-danger/10 text-danger rounded-control px-3 py-2 text-sm">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create invite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LinkDialog({
  link,
  onClose,
}: {
  link: { title: string; url: string } | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Dialog
      open={link !== null}
      onOpenChange={(v) => {
        if (!v) {
          onClose();
          setCopied(false);
        }
      }}
    >
      {link ? (
        <DialogContent
          title={link.title}
          description="Email isn’t configured yet, so share this one-time link directly with the person. It can only be used once."
        >
          <div className="flex gap-2">
            <Input
              readOnly
              value={link.url}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="One-time link"
            />
            <Button
              variant="secondary"
              onClick={() => {
                void navigator.clipboard.writeText(link.url).then(() => setCopied(true));
              }}
            >
              {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
