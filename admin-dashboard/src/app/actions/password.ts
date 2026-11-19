"use server";

import {
  consumeTokenAndSetPassword,
  findAdminById,
  setOwnPassword,
  writeAuditLog,
} from "@repo/db/admin";
import { hashPassword, passwordPolicyErrors, verifyPassword } from "@repo/db/password";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formString } from "@/lib/form-data";
import { signOut } from "@/auth";
import { getAdminSession } from "@/lib/session";

export type PasswordState = { error: string | null };

function validateNew(password: string, confirm: string): string | null {
  if (password !== confirm) return "The two passwords don’t match.";
  const issues = passwordPolicyErrors(password);
  if (issues.length) return `Password needs ${issues.join(", ")}.`;
  if (password.length > 200) return "Password is too long.";
  return null;
}

async function ip() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

/** Accept an invite or a reset link: set the password, then sign in fresh. */
export async function setPasswordWithToken(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const kind = formData.get("kind") === "invite" ? "invite" : "reset";
  const token = z.string().min(20).max(100).safeParse(formData.get("token"));
  if (!token.success) return { error: "This link is invalid." };
  const password = formString(formData, "password");
  const problem = validateNew(password, formString(formData, "confirm"));
  if (problem) return { error: problem };

  const userId = await consumeTokenAndSetPassword(kind, token.data, await hashPassword(password));
  if (!userId)
    return { error: "This link has expired or was already used. Ask an admin for a new one." };
  await writeAuditLog({
    actorId: userId,
    action: kind === "invite" ? "user.invite_accepted" : "user.password_reset",
    entityType: "admin_user",
    entityId: userId,
    summary: kind === "invite" ? "Accepted invite and set a password" : "Reset password via link",
    ip: await ip(),
  });
  redirect("/login?set=1");
}

/** Change own password (also used for the forced change on first login). Signs out everywhere. */
export async function changeOwnPassword(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const session = await getAdminSession();
  if (!session) redirect("/login");
  const user = await findAdminById(session.id);
  const current = formString(formData, "current");
  if (!user?.passwordHash || !(await verifyPassword(user.passwordHash, current))) {
    return { error: "Your current password is incorrect." };
  }
  const password = formString(formData, "password");
  const problem = validateNew(password, formString(formData, "confirm"));
  if (problem) return { error: problem };
  if (password === current) return { error: "Choose a password different from your current one." };

  await setOwnPassword(session.id, await hashPassword(password));
  await writeAuditLog({
    actorId: session.id,
    action: "user.password_changed",
    entityType: "admin_user",
    entityId: session.id,
    summary: "Changed own password (all sessions signed out)",
    ip: await ip(),
  });
  await signOut({ redirectTo: "/login?set=1" });
  return { error: null };
}
