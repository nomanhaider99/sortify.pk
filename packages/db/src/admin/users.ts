import { OWNER_ROLE, isPermission, ownerGuard } from "@repo/shared";
import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { db as sharedDb, type Database } from "../client";
import { adminUsers, rolePermissions, roles } from "../schema";

export class AdminRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminRuleError";
  }
}

export async function listAdminUsers(db: Database = sharedDb) {
  return db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      isActive: adminUsers.isActive,
      hasPassword: sql<boolean>`${adminUsers.passwordHash} is not null`,
      mustChangePassword: adminUsers.mustChangePassword,
      lastLoginAt: adminUsers.lastLoginAt,
      createdAt: adminUsers.createdAt,
      roleId: roles.id,
      roleName: roles.name,
    })
    .from(adminUsers)
    .innerJoin(roles, eq(roles.id, adminUsers.roleId))
    .orderBy(asc(adminUsers.name));
}

export async function getAdminUser(id: string, db: Database = sharedDb) {
  const [u] = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      isActive: adminUsers.isActive,
      roleId: adminUsers.roleId,
      roleName: roles.name,
    })
    .from(adminUsers)
    .innerJoin(roles, eq(roles.id, adminUsers.roleId))
    .where(eq(adminUsers.id, id))
    .limit(1);
  return u ?? null;
}

async function ownerRoleId(db: Database) {
  const [r] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(and(eq(roles.name, OWNER_ROLE), eq(roles.isSystem, true)))
    .limit(1);
  return r?.id ?? null;
}

async function activeOwnerCount(db: Database) {
  const ownerId = await ownerRoleId(db);
  if (!ownerId) return 0;
  const [r] = await db
    .select({ n: count() })
    .from(adminUsers)
    .where(and(eq(adminUsers.roleId, ownerId), eq(adminUsers.isActive, true)));
  return r?.n ?? 0;
}

async function assertOwnerGuard(
  userId: string,
  change: "disable" | "demote" | "delete",
  db: Database,
) {
  const user = await getAdminUser(userId, db);
  if (!user) throw new AdminRuleError("User not found.");
  const error = ownerGuard({
    targetIsActiveOwner: user.roleName === OWNER_ROLE && user.isActive,
    activeOwnerCount: await activeOwnerCount(db),
    change,
  });
  if (error) throw new AdminRuleError(error);
  return user;
}

export async function createAdminUser(
  input: { email: string; name: string; roleId: string; invitedBy: string },
  db: Database = sharedDb,
) {
  const [exists] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(sql`lower(${adminUsers.email}) = ${input.email.toLowerCase()}`)
    .limit(1);
  if (exists) throw new AdminRuleError("A user with that email already exists.");
  const [role] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.id, input.roleId))
    .limit(1);
  if (!role) throw new AdminRuleError("Role not found.");
  const [user] = await db
    .insert(adminUsers)
    .values({
      email: input.email.toLowerCase(),
      name: input.name,
      roleId: input.roleId,
      invitedBy: input.invitedBy,
      passwordHash: null,
    })
    .returning({ id: adminUsers.id });
  if (!user) throw new Error("Failed to create user");
  return user.id;
}

export async function changeUserRole(userId: string, roleId: string, db: Database = sharedDb) {
  const user = await getAdminUser(userId, db);
  if (!user) throw new AdminRuleError("User not found.");
  const [role] = await db
    .select({ id: roles.id, name: roles.name })
    .from(roles)
    .where(eq(roles.id, roleId))
    .limit(1);
  if (!role) throw new AdminRuleError("Role not found.");
  if (user.roleName === OWNER_ROLE && role.name !== OWNER_ROLE)
    await assertOwnerGuard(userId, "demote", db);
  // Role change takes effect immediately: bump session version so permissions are re-read.
  await db
    .update(adminUsers)
    .set({ roleId, sessionVersion: sql`${adminUsers.sessionVersion} + 1` })
    .where(eq(adminUsers.id, userId));
  return { before: user.roleName, after: role.name };
}

export async function setUserActive(userId: string, active: boolean, db: Database = sharedDb) {
  if (!active) await assertOwnerGuard(userId, "disable", db);
  await db
    .update(adminUsers)
    .set({ isActive: active, sessionVersion: sql`${adminUsers.sessionVersion} + 1` })
    .where(eq(adminUsers.id, userId));
}

/** Signs a user out everywhere by invalidating all existing JWTs. */
export async function revokeSessions(userId: string, db: Database = sharedDb) {
  await db
    .update(adminUsers)
    .set({ sessionVersion: sql`${adminUsers.sessionVersion} + 1` })
    .where(eq(adminUsers.id, userId));
}

export async function deleteAdminUser(userId: string, db: Database = sharedDb) {
  await assertOwnerGuard(userId, "delete", db);
  await db.delete(adminUsers).where(eq(adminUsers.id, userId));
}

export async function updateOwnProfile(userId: string, name: string, db: Database = sharedDb) {
  await db.update(adminUsers).set({ name }).where(eq(adminUsers.id, userId));
}

export async function setOwnPassword(
  userId: string,
  passwordHash: string,
  db: Database = sharedDb,
) {
  await db
    .update(adminUsers)
    .set({
      passwordHash,
      mustChangePassword: false,
      sessionVersion: sql`${adminUsers.sessionVersion} + 1`,
    })
    .where(eq(adminUsers.id, userId));
}

// ── Roles ────────────────────────────────────────────────────────────────────

export async function listRoles(db: Database = sharedDb) {
  return db
    .select({
      id: roles.id,
      name: roles.name,
      description: roles.description,
      isSystem: roles.isSystem,
      userCount: sql<number>`(select count(*)::int from ${adminUsers} u where u.role_id = ${sql.raw(`"roles"."id"`)})`,
      permissionCount: sql<number>`(select count(*)::int from ${rolePermissions} rp where rp.role_id = ${sql.raw(`"roles"."id"`)})`,
    })
    .from(roles)
    .orderBy(desc(roles.isSystem), asc(roles.createdAt));
}

export async function getRole(id: string, db: Database = sharedDb) {
  const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  if (!role) return null;
  const perms = await db
    .select({ p: rolePermissions.permission })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, id));
  return { ...role, permissions: perms.map((p) => p.p) };
}

export async function createRole(
  input: { name: string; description: string; permissions: string[] },
  db: Database = sharedDb,
) {
  const [dup] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(sql`lower(${roles.name}) = ${input.name.toLowerCase()}`)
    .limit(1);
  if (dup) throw new AdminRuleError("A role with that name already exists.");
  const perms = input.permissions.filter(isPermission);
  return db.transaction(async (tx) => {
    const [role] = await tx
      .insert(roles)
      .values({ name: input.name, description: input.description, isSystem: false })
      .returning({ id: roles.id });
    if (!role) throw new Error("Failed to create role");
    if (perms.length)
      await tx
        .insert(rolePermissions)
        .values(perms.map((permission) => ({ roleId: role.id, permission })));
    return role.id;
  });
}

/** Replaces a role's permissions. The Owner role is immutable (always has everything). */
export async function setRolePermissions(
  roleId: string,
  input: { name?: string; description?: string; permissions: string[] },
  db: Database = sharedDb,
) {
  const role = await getRole(roleId, db);
  if (!role) throw new AdminRuleError("Role not found.");
  if (role.isSystem && role.name === OWNER_ROLE)
    throw new AdminRuleError("The Owner role always has every permission and can't be edited.");
  const perms = [...new Set(input.permissions.filter(isPermission))];
  await db.transaction(async (tx) => {
    if (!role.isSystem && (input.name || input.description !== undefined)) {
      await tx
        .update(roles)
        .set({
          ...(input.name ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
        })
        .where(eq(roles.id, roleId));
    }
    await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
    if (perms.length)
      await tx.insert(rolePermissions).values(perms.map((permission) => ({ roleId, permission })));
    // Everyone with this role re-reads permissions on their next request.
    await tx
      .update(adminUsers)
      .set({ sessionVersion: sql`${adminUsers.sessionVersion} + 1` })
      .where(eq(adminUsers.roleId, roleId));
  });
  const added = perms.filter((p) => !role.permissions.includes(p));
  const kept = new Set<string>(perms);
  const removed = role.permissions.filter((p) => !kept.has(p));
  return { added, removed };
}

export async function deleteRole(roleId: string, db: Database = sharedDb) {
  const role = await getRole(roleId, db);
  if (!role) throw new AdminRuleError("Role not found.");
  if (role.isSystem) throw new AdminRuleError("System roles can't be deleted.");
  const [r] = await db.select({ n: count() }).from(adminUsers).where(eq(adminUsers.roleId, roleId));
  if ((r?.n ?? 0) > 0) throw new AdminRuleError("Reassign this role's users before deleting it.");
  await db.delete(roles).where(eq(roles.id, roleId));
  return role.name;
}
