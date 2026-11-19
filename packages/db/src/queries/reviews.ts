import { and, eq, sql } from "drizzle-orm";
import { db as sharedDb, type Database } from "../client";
import { orderItems, orders, products, reviews } from "../schema";

/**
 * Stores a customer review as `pending` (never public until approved in the admin). Marks it as a
 * verified purchase when the email matches a delivered order containing the product.
 * Returns false if the product doesn't exist or isn't active.
 */
export async function createPendingReview(
  input: {
    productId: string;
    name: string;
    email: string;
    rating: number;
    title: string;
    body: string;
  },
  db: Database = sharedDb,
): Promise<boolean> {
  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, input.productId), eq(products.status, "active")))
    .limit(1);
  if (!product) return false;

  const [delivered] = await db
    .select({ orderId: orders.id })
    .from(orders)
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orders.status, "delivered"),
        eq(orderItems.productId, input.productId),
        sql`lower(${orders.email}) = ${input.email.toLowerCase()}`,
      ),
    )
    .limit(1);

  await db.insert(reviews).values({
    productId: input.productId,
    orderId: delivered?.orderId ?? null,
    customerName: input.name,
    customerEmail: input.email,
    rating: input.rating,
    title: input.title,
    body: input.body,
    status: "pending",
    isVerifiedPurchase: Boolean(delivered),
  });
  return true;
}
