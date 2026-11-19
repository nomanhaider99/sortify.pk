import { LOCKOUT } from "@repo/shared";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { db as sharedDb, type Database } from "../client";
import { adminUsers, loginAttempts, rolePermissions, roles } from "../schema";

export type AdminIdentity = {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  sessionVersion: number;
  roleId: string;
  roleName: string;
  permissions: string[];
};

async function withPermissions(
  row: Omit<AdminIdentity, "permissions"> | undefined,
  db: Database,
): Promise<AdminIdentity | null> {
  if (!row) return null;
  const perms = await db
    .select({ p: rolePermissions.permission })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, row.roleId));
  return { ...row, permissions: perms.map((x) => x.p) };
}

const identityColumns = {
  id: adminUsers.id,
  email: adminUsers.email,
  name: adminUsers.name,
  passwordHash: adminUsers.passwordHash,
  isActive: adminUsers.isActive,
  mustChangePassword: adminUsers.mustChangePassword,
  sessionVersion: adminUsers.sessionVersion,
  roleId: adminUsers.roleId,
  roleName: roles.name,
};

export async function findAdminByEmail(email: string, db: Database = sharedDb) {
  const [row] = await db
    .select(identityColumns)
    .from(adminUsers)
    .innerJoin(roles, eq(roles.id, adminUsers.roleId))
    .where(sql`lower(${adminUsers.email}) = ${email.trim().toLowerCase()}`)
    .limit(1);
  return withPermissions(row, db);
}

export async function findAdminById(id: string, db: Database = sharedDb) {
  const [row] = await db
    .select(identityColumns)
    .from(adminUsers)
    .innerJoin(roles, eq(roles.id, adminUsers.roleId))
    .where(eq(adminUsers.id, id))
    .limit(1);
  return withPermissions(row, db);
}

/** Failed login attempts in the lockout window, by email and by IP. */
export async function countRecentFailures(
  email: string,
  ip: string | null,
  db: Database = sharedDb,
) {
  const since = new Date(Date.now() - LOCKOUT.windowMs);
  const [byEmail] = await db
    .select({ n: count() })
    .from(loginAttempts)
    .where(
      and(
        sql`lower(${loginAttempts.email}) = ${email.trim().toLowerCase()}`,
        eq(loginAttempts.success, false),
        gte(loginAttempts.createdAt, since),
      ),
    );
  let byIp = 0;
  if (ip) {
    const [r] = await db
      .select({ n: count() })
      .from(loginAttempts)
      .where(
        and(
          sql`${loginAttempts.ip} = ${ip}::inet`,
          eq(loginAttempts.success, false),
          gte(loginAttempts.createdAt, since),
        ),
      );
    byIp = r?.n ?? 0;
  }
  return { byEmail: byEmail?.n ?? 0, byIp };
}

const IP_RE = /^[0-9a-fA-F:.]{2,45}$/;

export async function recordLoginAttempt(
  input: { email: string; ip: string | null; success: boolean; reason?: string },
  db: Database = sharedDb,
) {
  await db.insert(loginAttempts).values({
    email: input.email.trim().toLowerCase().slice(0, 200),
    ip: input.ip && IP_RE.test(input.ip) ? input.ip : null,
    success: input.success,
    reason: input.reason ?? null,
  });
}

export async function touchLastLogin(userId: string, db: Database = sharedDb) {
  await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, userId));
}
