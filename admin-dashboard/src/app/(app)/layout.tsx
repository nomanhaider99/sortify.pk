import { getAttentionCounts } from "@repo/db/admin";
import type { Route } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import type { QuickAction } from "@/components/shell/command-palette";
import { AppShell } from "@/components/shell/app-shell";
import { filterNav } from "@/lib/nav";
import { requirePagePermission } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requirePagePermission();
  // Server-side enforcement of the forced password change (the proxy redirect is a convenience).
  if (session.mustChangePassword) redirect("/account/password");
  const nav = filterNav(session.can);
  const counts = await getAttentionCounts();
  const actions: QuickAction[] = [
    ...(session.can("products:create")
      ? [{ label: "Create product", href: "/products/new" as Route }]
      : []),
    ...(session.can("orders:view")
      ? [{ label: "Orders needing confirmation", href: "/orders?view=needs-confirmation" as Route }]
      : []),
    ...(session.can("reviews:moderate")
      ? [{ label: "Moderate pending reviews", href: "/reviews?status=pending" as Route }]
      : []),
    ...(session.can("users:invite")
      ? [{ label: "Invite a user", href: "/users?invite=1" as Route }]
      : []),
  ];
  return (
    <AppShell
      user={{ name: session.name, email: session.email, roleName: session.roleName }}
      nav={nav}
      counts={{
        orders: session.can("orders:view") ? counts.orders : 0,
        reviews: session.can("reviews:view") ? counts.reviews : 0,
        messages: session.can("messages:view") ? counts.messages : 0,
      }}
      actions={actions}
    >
      {children}
    </AppShell>
  );
}
