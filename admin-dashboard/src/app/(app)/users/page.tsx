import { listAdminUsers, listRoles } from "@repo/db/admin";
import type { Metadata } from "next";
import { UsersTable } from "@/components/users/users-table";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage({ searchParams }: PageProps<"/users">) {
  const session = await requirePagePermission("users:view");
  const [users, roles] = await Promise.all([listAdminUsers(), listRoles()]);
  const sp = await searchParams;
  return (
    <UsersTable
      currentUserId={session.id}
      users={users.map((u) => ({
        ...u,
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
      }))}
      roles={roles.map((r) => ({ id: r.id, name: r.name }))}
      can={{
        invite: session.can("users:invite"),
        update: session.can("users:update"),
        delete: session.can("users:delete"),
      }}
      openInvite={sp.invite === "1"}
    />
  );
}
