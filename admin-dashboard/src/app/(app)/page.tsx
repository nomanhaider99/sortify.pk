import { getAttentionCounts } from "@repo/db/admin";
import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await requirePagePermission("dashboard:view");
  const counts = await getAttentionCounts();
  return (
    <div className="space-y-6">
      <p className="text-ink-muted">Welcome back, {session.name.split(" ")[0]}.</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-ink-muted text-sm">Orders awaiting confirmation</p>
          <p className="mt-2 text-3xl font-semibold">{counts.orders}</p>
        </Card>
        <Card>
          <p className="text-ink-muted text-sm">Reviews to moderate</p>
          <p className="mt-2 text-3xl font-semibold">{counts.reviews}</p>
        </Card>
        <Card>
          <p className="text-ink-muted text-sm">Unread messages</p>
          <p className="mt-2 text-3xl font-semibold">{counts.messages}</p>
        </Card>
      </div>
    </div>
  );
}
