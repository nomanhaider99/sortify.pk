import { listRoles } from "@repo/db/admin";
import { ChevronRight, Lock } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { NewRoleButton } from "@/components/users/new-role-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Roles & permissions" };

export default async function RolesPage() {
  const session = await requirePagePermission("roles:view");
  const roles = await listRoles();
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Roles</CardTitle>
          <p className="text-ink-muted text-sm">
            Control exactly what each team member can see and do.
          </p>
        </div>
        {session.can("roles:create") ? <NewRoleButton /> : null}
      </CardHeader>
      <Table stack>
        <THead>
          <tr>
            <TH>Role</TH>
            <TH>Users</TH>
            <TH>Permissions</TH>
            <TH className="w-10">
              <span className="sr-only">Open</span>
            </TH>
          </tr>
        </THead>
        <TBody>
          {roles.map((r) => (
            <TR key={r.id}>
              <TD>
                <Link href={`/roles/${r.id}` as Route} className="font-medium hover:underline">
                  {r.name}
                </Link>
                {r.isSystem ? (
                  <Badge tone="neutral" className="ml-2">
                    {r.name === "Owner" ? <Lock className="size-3" aria-hidden /> : null} System
                  </Badge>
                ) : null}
                <p className="text-ink-muted text-xs">{r.description}</p>
              </TD>
              <TD>{r.userCount}</TD>
              <TD>{r.permissionCount}</TD>
              <TD>
                <Link
                  href={`/roles/${r.id}` as Route}
                  aria-label={`Edit ${r.name}`}
                  className="text-ink-muted hover:text-ink"
                >
                  <ChevronRight className="size-4" aria-hidden />
                </Link>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}
