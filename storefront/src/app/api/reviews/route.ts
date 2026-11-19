import { listApprovedReviews } from "@repo/db";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  productId: z.uuid(),
  sort: z.enum(["newest", "highest", "lowest"]).default("newest"),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
});

export type ReviewDTO = {
  id: string;
  customerName: string;
  rating: number;
  title: string;
  body: string;
  isVerifiedPurchase: boolean;
  ownerReply: string | null;
  createdAt: string;
};

/** Paginated approved reviews (never returns pending/rejected ones). */
export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  const rows = await listApprovedReviews(parsed.data.productId, {
    sort: parsed.data.sort,
    offset: parsed.data.offset,
    limit: 6,
  });
  const reviews: ReviewDTO[] = rows.map((r) => ({
    id: r.id,
    customerName: r.customerName,
    rating: r.rating,
    title: r.title,
    body: r.body,
    isVerifiedPurchase: r.isVerifiedPurchase,
    ownerReply: r.ownerReply,
    createdAt: r.createdAt.toISOString(),
  }));
  return NextResponse.json({ reviews });
}
