"use server";

import { revokeSessions } from "@repo/db/admin";
import { signOut } from "@/auth";
import { getAdminSession } from "@/lib/session";

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

/** "Sign out everywhere": invalidates every session of the current user, then signs out here. */
export async function signOutEverywhereAction() {
  const session = await getAdminSession();
  if (session) await revokeSessions(session.id);
  await signOut({ redirectTo: "/login" });
}
