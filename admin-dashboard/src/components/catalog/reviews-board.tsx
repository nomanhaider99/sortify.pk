"use client";

import type { ReviewStatus } from "@repo/shared";
import { BadgeCheck, MessageSquareReply, Star } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteReviewsAction,
  featureReviewAction,
  moderateReviewsAction,
  replyReviewAction,
} from "@/app/actions/catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/actions";
import { cn } from "@/lib/cn";
import { LocalTime } from "@/components/ui/local-time";
import { storefrontLink } from "@/lib/links";

type Row = {
  id: string;
  rating: number;
  title: string;
  body: string;
  customerName: string;
  customerEmail: string;
  status: ReviewStatus;
  isFeatured: boolean;
  isVerifiedPurchase: boolean;
  ownerReply: string | null;
  createdAt: string;
  productTitle: string;
  productSlug: string;
};

const TABS: { key: ReviewStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn("size-3.5", i < n ? "text-warning-ink fill-current" : "text-border")}
          aria-hidden
        />
      ))}
    </span>
  );
}

export function ReviewsBoard({
  status,
  counts,
  rows,
  can,
}: {
  status: ReviewStatus;
  counts: Partial<Record<ReviewStatus, number>>;
  rows: Row[];
  can: { moderate: boolean; delete: boolean };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [replying, setReplying] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [pending, startTransition] = useTransition();

  const go = (params: Record<string, string | null>) => {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(params)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    setChecked(new Set());
    router.replace(`${pathname}?${p.toString()}` as Route, { scroll: false });
  };
  const run = (fn: () => Promise<ActionResult<unknown>>, msg: string) =>
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) toast.error(r.error);
      else {
        toast.success(r.message ?? msg);
        setChecked(new Set());
        setReplying(null);
        router.refresh();
      }
    });
  const ids = (one?: string) => (one ? [one] : [...checked]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="bg-surface border-border flex rounded-full border p-1 text-sm"
          role="tablist"
          aria-label="Review status"
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={status === t.key}
              onClick={() => go({ status: t.key })}
              className={cn(
                "rounded-full px-3 py-1",
                status === t.key
                  ? "bg-primary-strong text-on-strong"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {t.label} <span className="tabular-nums opacity-80">{counts[t.key] ?? 0}</span>
            </button>
          ))}
        </div>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            go({ q: q.trim() || null });
          }}
        >
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reviews"
            aria-label="Search reviews"
            className="w-64"
          />
        </form>
      </div>

      {checked.size && can.moderate ? (
        <div className="bg-primary-soft rounded-card flex flex-wrap items-center gap-2 px-4 py-2 text-sm">
          <span className="font-medium">{checked.size} selected</span>
          {status !== "approved" ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => run(() => moderateReviewsAction(ids(), "approved"), "Approved")}
            >
              Approve
            </Button>
          ) : null}
          {status !== "rejected" ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => run(() => moderateReviewsAction(ids(), "rejected"), "Rejected")}
            >
              Reject
            </Button>
          ) : null}
          {can.delete ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-danger"
              disabled={pending}
              onClick={() =>
                window.confirm(`Delete ${checked.size} review(s) permanently?`) &&
                run(() => deleteReviewsAction(ids()), "Deleted")
              }
            >
              Delete
            </Button>
          ) : null}
        </div>
      ) : null}

      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id}>
            <Card className="flex gap-4">
              {can.moderate ? (
                <input
                  type="checkbox"
                  className="accent-primary-strong mt-1 size-4 shrink-0"
                  checked={checked.has(r.id)}
                  onChange={() =>
                    setChecked((s) => {
                      const n = new Set(s);
                      if (n.has(r.id)) n.delete(r.id);
                      else n.add(r.id);
                      return n;
                    })
                  }
                  aria-label={`Select review by ${r.customerName}`}
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars n={r.rating} />
                  <p className="font-medium">{r.title}</p>
                  {r.isFeatured ? <Badge>Featured</Badge> : null}
                </div>
                <p className="mt-1.5 text-sm whitespace-pre-wrap">{r.body}</p>
                <p className="text-ink-muted mt-2 flex flex-wrap items-center gap-x-2 text-xs">
                  <span>
                    {r.customerName} ({r.customerEmail})
                  </span>
                  {r.isVerifiedPurchase ? (
                    <span className="text-accent-ink inline-flex items-center gap-0.5">
                      <BadgeCheck className="size-3.5" aria-hidden /> Verified buyer
                    </span>
                  ) : null}
                  <span>
                    · <LocalTime value={r.createdAt} format="ago" /> ·
                  </span>
                  <a
                    href={storefrontLink(`/products/${r.productSlug}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {r.productTitle}
                  </a>
                </p>
                {r.ownerReply && replying !== r.id ? (
                  <p className="bg-surface-muted rounded-control mt-3 px-3 py-2 text-sm">
                    <span className="text-ink-muted text-xs font-medium">Your reply: </span>
                    {r.ownerReply}
                  </p>
                ) : null}
                {replying === r.id ? (
                  <form
                    className="mt-3 space-y-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      run(() => replyReviewAction(r.id, reply), "Reply saved");
                    }}
                  >
                    <label htmlFor={`reply-${r.id}`} className="sr-only">
                      Public reply
                    </label>
                    <Textarea
                      id={`reply-${r.id}`}
                      rows={2}
                      value={reply}
                      maxLength={1000}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Shown publicly under the review"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" type="submit" disabled={pending}>
                        Save reply
                      </Button>
                      <Button
                        size="sm"
                        type="button"
                        variant="ghost"
                        onClick={() => setReplying(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : null}
                {can.moderate ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.status !== "approved" ? (
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          run(() => moderateReviewsAction(ids(r.id), "approved"), "Approved")
                        }
                      >
                        Approve
                      </Button>
                    ) : null}
                    {r.status !== "rejected" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={pending}
                        onClick={() =>
                          run(() => moderateReviewsAction(ids(r.id), "rejected"), "Rejected")
                        }
                      >
                        Reject
                      </Button>
                    ) : null}
                    {r.status === "approved" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={pending}
                        onClick={() =>
                          run(() => featureReviewAction(r.id, !r.isFeatured), "Updated")
                        }
                      >
                        <Star aria-hidden /> {r.isFeatured ? "Unfeature" : "Feature on homepage"}
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setReply(r.ownerReply ?? "");
                        setReplying(r.id);
                      }}
                    >
                      <MessageSquareReply aria-hidden /> {r.ownerReply ? "Edit reply" : "Reply"}
                    </Button>
                  </div>
                ) : null}
              </div>
            </Card>
          </li>
        ))}
        {!rows.length ? (
          <li>
            <Card className="text-ink-muted py-16 text-center text-sm">
              {status === "pending" ? "All caught up — no reviews waiting." : "No reviews here."}
            </Card>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
