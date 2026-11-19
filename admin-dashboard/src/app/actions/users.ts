"use server";

import {
  AdminRuleError,
  changeUserRole,
  createAccountToken,
  createAdminUser,
  createRole,
  deleteAdminUser,
  deleteRole,
  getAdminUser,
  getRole,
  revokeSessions,
  setRolePermissions,
  setUserActive,
} from "@repo/db/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction, type ActionResult } from "@/lib/actions";

const appUrl = () => (process.env.AUTH_URL ?? "http://localhost:3001").replace(/\/$/, "");
const uuid = z.uuid();

const inviteSchema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(80),
  email: z.email("Enter a valid email").trim().toLowerCase().max(200),
  roleId: z.uuid("Choose a role"),
});

/** Creates a user and a 48h one-time invite link (shown in the UI — no mailer in Phase 1). */
export async function inviteUser(
  input: z.input<typeof inviteSchema>,
): Promise<ActionResult<{ link: string }>> {
  return runAction("users:invite", async ({ session, audit }) => {
    const data = inviteSchema.parse(input);
    const userId = await createAdminUser({ ...data, invitedBy: session.id });
    const { token } = await createAccountToken("invite", userId, session.id);
    const user = await getAdminUser(userId);
    await audit({
      action: "user.invited",
      entityType: "admin_user",
      entityId: userId,
      summary: `Invited ${data.name} <${data.email}> as ${user?.roleName ?? "?"}`,
    });
    revalidatePath("/users");
    return { link: `${appUrl()}/invite/${token}` };
  });
}

export async function resendInvite(userId: string): Promise<ActionResult<{ link: string }>> {
  return runAction("users:invite", async ({ session, audit }) => {
    const user = await getAdminUser(uuid.parse(userId));
    if (!user) throw new AdminRuleError("User not found.");
    const { token } = await createAccountToken("invite", user.id, session.id);
    await audit({
      action: "user.invite_resent",
      entityType: "admin_user",
      entityId: user.id,
      summary: `New invite link for ${user.email}`,
    });
    return { link: `${appUrl()}/invite/${token}` };
  });
}

export async function createResetLink(userId: string): Promise<ActionResult<{ link: string }>> {
  return runAction("users:update", async ({ session, audit }) => {
    const user = await getAdminUser(uuid.parse(userId));
    if (!user) throw new AdminRuleError("User not found.");
    const { token } = await createAccountToken("reset", user.id, session.id);
    await audit({
      action: "user.reset_link_created",
      entityType: "admin_user",
      entityId: user.id,
      summary: `Password reset link for ${user.email}`,
    });
    return { link: `${appUrl()}/reset/${token}` };
  });
}

export async function updateUserRole(userId: string, roleId: string): Promise<ActionResult> {
  return runAction(
    "users:update",
    async ({ session, audit }) => {
      const id = uuid.parse(userId);
      if (id === session.id) throw new AdminRuleError("You can’t change your own role.");
      const change = await changeUserRole(id, uuid.parse(roleId));
      await audit({
        action: "user.role_changed",
        entityType: "admin_user",
        entityId: id,
        summary: `Role changed from ${change.before} to ${change.after}`,
        diff: { role: { before: change.before, after: change.after } },
      });
      revalidatePath("/users");
      return undefined;
    },
    "Role updated",
  );
}

export async function toggleUserActive(userId: string, active: boolean): Promise<ActionResult> {
  return runAction(
    "users:update",
    async ({ session, audit }) => {
      const id = uuid.parse(userId);
      if (id === session.id && !active)
        throw new AdminRuleError("You can’t disable your own account.");
      const user = await getAdminUser(id);
      await setUserActive(id, active);
      await audit({
        action: active ? "user.enabled" : "user.disabled",
        entityType: "admin_user",
        entityId: id,
        summary: `${active ? "Enabled" : "Disabled"} ${user?.email ?? id}`,
        diff: { isActive: { before: !active, after: active } },
      });
      revalidatePath("/users");
      return undefined;
    },
    active ? "User enabled" : "User disabled and signed out",
  );
}

export async function forceLogout(userId: string): Promise<ActionResult> {
  return runAction(
    "users:update",
    async ({ audit }) => {
      const id = uuid.parse(userId);
      const user = await getAdminUser(id);
      await revokeSessions(id);
      await audit({
        action: "user.sessions_revoked",
        entityType: "admin_user",
        entityId: id,
        summary: `Signed out ${user?.email ?? id} everywhere`,
      });
      return undefined;
    },
    "User signed out on all devices",
  );
}

export async function removeUser(userId: string): Promise<ActionResult> {
  return runAction(
    "users:delete",
    async ({ session, audit }) => {
      const id = uuid.parse(userId);
      if (id === session.id) throw new AdminRuleError("You can’t delete your own account.");
      const user = await getAdminUser(id);
      await deleteAdminUser(id);
      await audit({
        action: "user.deleted",
        entityType: "admin_user",
        entityId: id,
        summary: `Deleted ${user?.email ?? id}`,
      });
      revalidatePath("/users");
      return undefined;
    },
    "User deleted",
  );
}

// ── Roles ────────────────────────────────────────────────────────────────────

const roleSchema = z.object({
  name: z.string().trim().min(2, "Enter a role name").max(40),
  description: z.string().trim().max(200).default(""),
  permissions: z.array(z.string().max(60)).max(200),
});

export async function createRoleAction(
  input: z.input<typeof roleSchema>,
): Promise<ActionResult<{ id: string }>> {
  return runAction(
    "roles:create",
    async ({ audit }) => {
      const data = roleSchema.parse(input);
      const id = await createRole(data);
      await audit({
        action: "role.created",
        entityType: "role",
        entityId: id,
        summary: `Created role ${data.name} with ${data.permissions.length} permissions`,
      });
      revalidatePath("/roles");
      return { id };
    },
    "Role created",
  );
}

export async function saveRolePermissions(
  roleId: string,
  input: z.input<typeof roleSchema>,
): Promise<ActionResult> {
  return runAction(
    "roles:update",
    async ({ audit }) => {
      const id = uuid.parse(roleId);
      const data = roleSchema.parse(input);
      const before = await getRole(id);
      const change = await setRolePermissions(id, data);
      await audit({
        action: "role.permissions_updated",
        entityType: "role",
        entityId: id,
        summary: `Updated ${before?.name ?? "role"}: +${change.added.length} / −${change.removed.length} permissions`,
        diff: {
          permissionsAdded: { before: null, after: change.added },
          permissionsRemoved: { before: change.removed, after: null },
        },
      });
      revalidatePath("/roles");
      revalidatePath(`/roles/${id}`);
      return undefined;
    },
    "Permissions saved — affected users will pick them up immediately",
  );
}

export async function deleteRoleAction(roleId: string): Promise<ActionResult> {
  return runAction(
    "roles:delete",
    async ({ audit }) => {
      const id = uuid.parse(roleId);
      const name = await deleteRole(id);
      await audit({
        action: "role.deleted",
        entityType: "role",
        entityId: id,
        summary: `Deleted role ${name}`,
      });
      revalidatePath("/roles");
      return undefined;
    },
    "Role deleted",
  );
}
