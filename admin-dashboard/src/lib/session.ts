import "server-only";
import { findAdminById } from "@repo/db/admin";
import { hasPermission, type Permission } from "@repo/shared";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/auth";

export type AdminSession = {
  id: string;
  email: string;
  name: string;
  roleName: string;
  mustChangePassword: boolean;
  permissions: ReadonlySet<string>;
  can: (permission: Permission) => boolean;
};

/**
 * Resolves the signed-in admin from the JWT *and the database* on every request (cached per
 * render): disabled users, revoked sessions (session_version bump) and role changes take effect
 * immediately, not when the token expires.
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const session = await auth();
  const uid = session?.user?.id;
  if (!session || !uid) return null;
  const user = await findAdminById(uid);
  if (!user?.isActive) return null;
  // Revoked session (sign out everywhere, role change, password change, disable).
  if (session.sessionVersion !== user.sessionVersion) return null;
  const permissions = new Set(user.permissions);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    roleName: user.roleName,
    mustChangePassword: user.mustChangePassword,
    permissions,
    can: (p) => hasPermission(permissions, p),
  };
});

/** For pages/layouts: redirect to login, or to the 403 page if the permission is missing. */
export async function requirePagePermission(permission?: Permission): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/login?expired=1");
  if (permission && !session.can(permission)) redirect("/403");
  return session;
}

export class ForbiddenError extends Error {
  constructor(public readonly permission: Permission) {
    super(`Missing permission: ${permission}`);
    this.name = "ForbiddenError";
  }
}

/**
 * The single server-side permission check for mutations (PLAN §6.3 `requirePermission`).
 * Throws when not signed in or not allowed — `runAction` turns that into a result object.
 */
export async function requirePermission(permission: Permission): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session?.can(permission) || session.mustChangePassword) throw new ForbiddenError(permission);
  return session;
}
