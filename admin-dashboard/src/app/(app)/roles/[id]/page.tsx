import { getRole } from "@repo/db/admin";
import { OWNER_ROLE } from "@repo/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PermissionMatrix } from "@/components/users/permission-matrix";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Edit role" };

export default async function RolePage({ params }: PageProps<"/roles/[id]">) {
  const session = await requirePagePermission("roles:view");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const role = await getRole(id);
  if (!role) notFound();
  const locked = role.isSystem && role.name === OWNER_ROLE;
  return (
    <PermissionMatrix
      role={{
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        permissions: role.permissions,
      }}
      readOnly={locked || !session.can("roles:update")}
      lockedReason={
        locked ? "The Owner role always has every permission and can’t be edited." : undefined
      }
      canDelete={!role.isSystem && session.can("roles:delete")}
    />
  );
}
