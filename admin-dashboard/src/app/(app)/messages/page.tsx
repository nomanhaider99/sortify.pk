import { listAdminMessages } from "@repo/db/admin";
import type { Metadata } from "next";
import { MessagesInbox } from "@/components/catalog/messages-inbox";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Messages" };

const STATUSES = ["unread", "read", "archived"] as const;

export default async function MessagesPage({ searchParams }: PageProps<"/messages">) {
  const session = await requirePagePermission("messages:view");
  const sp = await searchParams;
  const status = STATUSES.find((s) => s === sp.status) ?? "unread";
  const { rows, counts } = await listAdminMessages({
    status,
    q: typeof sp.q === "string" ? sp.q.slice(0, 80) : undefined,
  });
  return (
    <MessagesInbox
      status={status}
      counts={counts}
      rows={rows.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        subject: m.subject,
        message: m.message,
        createdAt: m.createdAt.toISOString(),
      }))}
      can={{ update: session.can("messages:update"), delete: session.can("messages:delete") }}
    />
  );
}
