"use client";

import { Archive, Mail, MailOpen, Trash2 } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteMessagesAction, setMessagesStatusAction } from "@/app/actions/catalog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ActionResult } from "@/lib/actions";
import { cn } from "@/lib/cn";
import { LocalTime } from "@/components/ui/local-time";

type Status = "unread" | "read" | "archived";
type Row = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
};

export function MessagesInbox({
  status,
  counts,
  rows,
  can,
}: {
  status: Status;
  counts: Partial<Record<Status, number>>;
  rows: Row[];
  can: { update: boolean; delete: boolean };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [openId, setOpenId] = useState<string | null>(rows[0]?.id ?? null);
  const [pending, startTransition] = useTransition();
  const open = rows.find((r) => r.id === openId) ?? rows[0];

  const run = (fn: () => Promise<ActionResult>, msg: string) =>
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) toast.error(r.error);
      else {
        toast.success(r.message ?? msg);
        router.refresh();
      }
    });

  return (
    <div className="space-y-4">
      <div
        className="bg-surface border-border inline-flex rounded-full border p-1 text-sm"
        role="tablist"
        aria-label="Folder"
      >
        {(["unread", "read", "archived"] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={status === s}
            onClick={() => router.replace(`${pathname}?status=${s}` as Route)}
            className={cn(
              "rounded-full px-3 py-1 capitalize",
              status === s ? "bg-primary-strong text-on-strong" : "text-ink-muted hover:text-ink",
            )}
          >
            {s} <span className="tabular-nums opacity-80">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="p-0">
          <ul
            className="divide-border max-h-[70svh] divide-y overflow-y-auto"
            aria-label="Messages"
          >
            {rows.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenId(m.id);
                    if (window.matchMedia("(max-width: 1023px)").matches)
                      document
                        .getElementById("message-detail")
                        ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  aria-current={open?.id === m.id ? "true" : undefined}
                  className={cn(
                    "w-full px-4 py-3 text-left",
                    open?.id === m.id ? "bg-primary-soft" : "hover:bg-surface-muted",
                  )}
                >
                  <div className="flex justify-between gap-2">
                    <span
                      className={cn("truncate text-sm", status === "unread" && "font-semibold")}
                    >
                      {m.name}
                    </span>
                    <span className="text-ink-muted shrink-0 text-xs">
                      <LocalTime value={m.createdAt} format="ago" />
                    </span>
                  </div>
                  <p className="truncate text-sm">{m.subject}</p>
                  <p className="text-ink-muted truncate text-xs">{m.message}</p>
                </button>
              </li>
            ))}
            {!rows.length ? (
              <li className="text-ink-muted py-16 text-center text-sm">Nothing here.</li>
            ) : null}
          </ul>
        </Card>
        {open ? (
          <Card id="message-detail" className="scroll-mt-20">
            <div className="border-border flex flex-wrap items-start justify-between gap-3 border-b pb-4">
              <div>
                <h2 className="text-lg font-semibold break-words">{open.subject}</h2>
                <p className="text-ink-muted text-sm break-words">
                  {open.name} &lt;{open.email}&gt; · <LocalTime value={open.createdAt} />
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject}`)}`}
                  className="bg-primary-strong text-on-strong hover:bg-primary-strong-hover rounded-control inline-flex h-8 items-center gap-1.5 px-3 text-xs font-medium"
                >
                  <Mail className="size-4" aria-hidden /> Reply by email
                </a>
                {can.update && status !== "read" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() =>
                      run(() => setMessagesStatusAction([open.id], "read"), "Marked as read")
                    }
                  >
                    <MailOpen aria-hidden /> Mark read
                  </Button>
                ) : null}
                {can.update && status !== "unread" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() =>
                      run(() => setMessagesStatusAction([open.id], "unread"), "Marked unread")
                    }
                  >
                    <Mail aria-hidden /> Mark unread
                  </Button>
                ) : null}
                {can.update && status !== "archived" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() =>
                      run(() => setMessagesStatusAction([open.id], "archived"), "Archived")
                    }
                  >
                    <Archive aria-hidden /> Archive
                  </Button>
                ) : null}
                {can.delete ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger"
                    disabled={pending}
                    onClick={() =>
                      window.confirm("Delete this message permanently?") &&
                      run(() => deleteMessagesAction([open.id]), "Deleted")
                    }
                  >
                    <Trash2 aria-hidden /> Delete
                  </Button>
                ) : null}
              </div>
            </div>
            <p className="pt-4 text-sm leading-relaxed break-words whitespace-pre-wrap">
              {open.message}
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
