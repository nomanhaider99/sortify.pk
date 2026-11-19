import { listAdminReviews } from "@repo/db/admin";
import { REVIEW_STATUSES, type ReviewStatus } from "@repo/shared";
import type { Metadata } from "next";
import { ReviewsBoard } from "@/components/catalog/reviews-board";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Reviews" };

export default async function ReviewsPage({ searchParams }: PageProps<"/reviews">) {
  const session = await requirePagePermission("reviews:view");
  const sp = await searchParams;
  const status: ReviewStatus =
    typeof sp.status === "string" && (REVIEW_STATUSES as readonly string[]).includes(sp.status)
      ? (sp.status as ReviewStatus)
      : "pending";
  const { rows, counts } = await listAdminReviews({
    status,
    q: typeof sp.q === "string" ? sp.q.slice(0, 80) : undefined,
  });
  return (
    <ReviewsBoard
      status={status}
      counts={counts}
      rows={rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
      can={{ moderate: session.can("reviews:moderate"), delete: session.can("reviews:delete") }}
    />
  );
}
