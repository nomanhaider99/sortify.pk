import "server-only";
import { AdminRuleError, writeAuditLog, type AuditEntry } from "@repo/db/admin";
import type { Permission } from "@repo/shared";
import { headers } from "next/headers";
import { ZodError } from "zod";
import { ForbiddenError, requirePermission, type AdminSession } from "./session";

export type ActionResult<T = undefined> =
  { ok: true; data: T; message?: string } | { ok: false; error: string };

/**
 * Wraps every admin mutation: checks the permission on the server, runs the handler, and maps
 * known errors to a safe result. Handlers call `ctx.audit(...)` to record what they changed.
 */
export async function runAction<T>(
  permission: Permission,
  handler: (ctx: {
    session: AdminSession;
    audit: (entry: Omit<AuditEntry, "actorId" | "ip" | "userAgent">) => Promise<void>;
  }) => Promise<T>,
  successMessage?: string,
): Promise<ActionResult<T>> {
  try {
    const session = await requirePermission(permission);
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
    const userAgent = h.get("user-agent");
    const audit = (entry: Omit<AuditEntry, "actorId" | "ip" | "userAgent">) =>
      writeAuditLog({ ...entry, actorId: session.id, ip, userAgent });
    const data = await handler({ session, audit });
    return { ok: true, data, ...(successMessage ? { message: successMessage } : {}) };
  } catch (error) {
    if (error instanceof ForbiddenError)
      return { ok: false, error: "You don’t have permission to do that." };
    if (error instanceof AdminRuleError) return { ok: false, error: error.message };
    if (error instanceof ZodError)
      return { ok: false, error: error.issues[0]?.message ?? "Invalid input." };
    console.error("[admin action]", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
