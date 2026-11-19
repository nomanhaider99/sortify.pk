import { count, eq } from "drizzle-orm";
import { db as sharedDb, type Database } from "../client";
import { contactMessages, orders, reviews } from "../schema";

/** Sidebar badges / needs-attention counts. */
export async function getAttentionCounts(db: Database = sharedDb) {
  const [[o], [r], [m]] = await Promise.all([
    db.select({ n: count() }).from(orders).where(eq(orders.status, "pending")),
    db.select({ n: count() }).from(reviews).where(eq(reviews.status, "pending")),
    db.select({ n: count() }).from(contactMessages).where(eq(contactMessages.status, "unread")),
  ]);
  return { orders: o?.n ?? 0, reviews: r?.n ?? 0, messages: m?.n ?? 0 };
}
