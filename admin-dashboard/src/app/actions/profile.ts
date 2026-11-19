"use server";

import { updateOwnProfile, writeAuditLog } from "@repo/db/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSession } from "@/lib/session";

export type ProfileState = { error: string | null; saved?: boolean };

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const session = await getAdminSession();
  if (!session) return { error: "Please sign in again." };
  const name = z
    .string()
    .trim()
    .min(2, "Name is too short")
    .max(80)
    .safeParse(formData.get("name"));
  if (!name.success) return { error: name.error.issues[0]?.message ?? "Invalid name" };
  await updateOwnProfile(session.id, name.data);
  await writeAuditLog({
    actorId: session.id,
    action: "user.profile_updated",
    entityType: "admin_user",
    entityId: session.id,
    summary: "Updated own profile",
    diff: { name: { before: session.name, after: name.data } },
  });
  revalidatePath("/", "layout");
  return { error: null, saved: true };
}
