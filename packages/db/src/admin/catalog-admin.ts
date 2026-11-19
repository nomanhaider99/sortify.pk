import { settingsSchemas, type ReviewStatus, type SettingsMap } from "@repo/shared";
import { and, asc, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db as sharedDb, type Database } from "../client";
import {
  categories,
  contactMessages,
  customers,
  orders,
  productCategories,
  products,
  reviews,
  settings,
} from "../schema";
import { AdminRuleError } from "./users";

// ── Categories ───────────────────────────────────────────────────────────────

export async function listAdminCategories(db: Database = sharedDb) {
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      description: categories.description,
      imageUrl: categories.imageUrl,
      sortOrder: categories.sortOrder,
      isVisible: categories.isVisible,
      showInMenu: categories.showInMenu,
      productCount: sql<number>`(select count(*)::int from ${productCategories} pc where pc.category_id = ${sql.raw(`"categories"."id"`)})`,
    })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export type CategoryInput = {
  id?: string | undefined;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  isVisible: boolean;
  showInMenu: boolean;
};

export async function saveCategory(input: CategoryInput, db: Database = sharedDb) {
  const [dup] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(
      and(
        eq(categories.slug, input.slug),
        input.id ? sql`${categories.id} <> ${input.id}` : undefined,
      ),
    )
    .limit(1);
  if (dup) throw new AdminRuleError(`The URL handle “${input.slug}” is already used.`);
  const data = {
    name: input.name,
    slug: input.slug,
    description: input.description,
    imageUrl: input.imageUrl,
    isVisible: input.isVisible,
    showInMenu: input.showInMenu,
  };
  if (input.id) {
    const [before] = await db.select().from(categories).where(eq(categories.id, input.id)).limit(1);
    if (!before) throw new AdminRuleError("Category not found.");
    await db.update(categories).set(data).where(eq(categories.id, input.id));
    return { id: input.id, before };
  }
  const [{ max } = { max: 0 }] = await db
    .select({ max: sql<number>`coalesce(max(${categories.sortOrder}), -1)::int` })
    .from(categories);
  const [row] = await db
    .insert(categories)
    .values({ ...data, sortOrder: max + 1 })
    .returning({ id: categories.id });
  if (!row) throw new Error("Failed to create category");
  return { id: row.id, before: null };
}

export async function deleteCategory(id: string, db: Database = sharedDb) {
  const [c] = await db
    .select({ name: categories.name, slug: categories.slug })
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  if (!c) throw new AdminRuleError("Category not found.");
  await db.delete(categories).where(eq(categories.id, id));
  return c;
}

export async function reorderCategories(ids: string[], db: Database = sharedDb) {
  await db.transaction(async (tx) => {
    for (const [i, id] of ids.entries())
      await tx.update(categories).set({ sortOrder: i }).where(eq(categories.id, id));
  });
}

// ── Reviews ──────────────────────────────────────────────────────────────────

export async function listAdminReviews(
  f: { status: ReviewStatus; q?: string | undefined; limit?: number; offset?: number },
  db: Database = sharedDb,
) {
  const where: (SQL | undefined)[] = [eq(reviews.status, f.status)];
  if (f.q?.trim()) {
    const like = `%${f.q.trim().replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    where.push(
      or(
        ilike(reviews.title, like),
        ilike(reviews.body, like),
        ilike(reviews.customerName, like),
        ilike(products.title, like),
      ),
    );
  }
  const cond = and(...where);
  const [rows, counts] = await Promise.all([
    db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        title: reviews.title,
        body: reviews.body,
        customerName: reviews.customerName,
        customerEmail: reviews.customerEmail,
        status: reviews.status,
        isFeatured: reviews.isFeatured,
        isVerifiedPurchase: reviews.isVerifiedPurchase,
        ownerReply: reviews.ownerReply,
        createdAt: reviews.createdAt,
        productId: products.id,
        productTitle: products.title,
        productSlug: products.slug,
      })
      .from(reviews)
      .innerJoin(products, eq(products.id, reviews.productId))
      .where(cond)
      .orderBy(desc(reviews.createdAt))
      .limit(Math.min(f.limit ?? 50, 200))
      .offset(f.offset ?? 0),
    db.select({ status: reviews.status, n: count() }).from(reviews).groupBy(reviews.status),
  ]);
  return {
    rows,
    counts: Object.fromEntries(counts.map((c) => [c.status, c.n])) as Partial<
      Record<ReviewStatus, number>
    >,
  };
}

/** Recomputes rating_avg / rating_count from approved reviews only. */
export async function recomputeRatings(productIds: string[], db: Database = sharedDb) {
  for (const pid of new Set(productIds)) {
    const [agg] = await db
      .select({
        avg: sql<number>`coalesce(round(avg(${reviews.rating})::numeric, 2), 0)::float`,
        n: count(),
      })
      .from(reviews)
      .where(and(eq(reviews.productId, pid), eq(reviews.status, "approved")));
    await db
      .update(products)
      .set({ ratingAvg: agg?.avg ?? 0, ratingCount: agg?.n ?? 0 })
      .where(eq(products.id, pid));
  }
}

export async function moderateReviews(
  ids: string[],
  status: ReviewStatus,
  moderatorId: string,
  db: Database = sharedDb,
) {
  if (!ids.length) return [];
  const rows = await db
    .update(reviews)
    .set({
      status,
      moderatedBy: moderatorId,
      moderatedAt: new Date(),
      ...(status !== "approved" ? { isFeatured: false } : {}),
    })
    .where(inArray(reviews.id, ids))
    .returning({ productId: reviews.productId });
  const productIds = rows.map((r) => r.productId);
  await recomputeRatings(productIds, db);
  return productIds;
}

export async function setReviewFeatured(id: string, featured: boolean, db: Database = sharedDb) {
  const [r] = await db
    .select({ status: reviews.status })
    .from(reviews)
    .where(eq(reviews.id, id))
    .limit(1);
  if (!r) throw new AdminRuleError("Review not found.");
  if (featured && r.status !== "approved")
    throw new AdminRuleError("Only approved reviews can be featured.");
  await db.update(reviews).set({ isFeatured: featured }).where(eq(reviews.id, id));
}

export async function replyToReview(id: string, reply: string | null, db: Database = sharedDb) {
  await db.update(reviews).set({ ownerReply: reply }).where(eq(reviews.id, id));
}

export async function deleteReviews(ids: string[], db: Database = sharedDb) {
  if (!ids.length) return;
  const rows = await db
    .delete(reviews)
    .where(inArray(reviews.id, ids))
    .returning({ productId: reviews.productId });
  await recomputeRatings(
    rows.map((r) => r.productId),
    db,
  );
}

// ── Customers ────────────────────────────────────────────────────────────────

const CUSTOMER_ID = sql.raw(`"customers"."id"`);

export async function listAdminCustomers(
  f: { q?: string | undefined; limit?: number; offset?: number },
  db: Database = sharedDb,
) {
  const cond = f.q?.trim()
    ? (() => {
        const like = `%${f.q.trim().replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
        return or(
          ilike(customers.name, like),
          ilike(customers.email, like),
          ilike(customers.phone, like),
        );
      })()
    : undefined;
  const counted = sql`o.status not in ('cancelled','refunded')`;
  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        acceptsMarketing: customers.acceptsMarketing,
        createdAt: customers.createdAt,
        orderCount: sql<number>`(select count(*)::int from ${orders} o where o.customer_id = ${CUSTOMER_ID})`,
        totalSpent: sql<number>`(select coalesce(sum(o.total_cents),0)::int from ${orders} o where o.customer_id = ${CUSTOMER_ID} and ${counted})`,
        lastOrderAt: sql<Date | null>`(select max(o.placed_at) from ${orders} o where o.customer_id = ${CUSTOMER_ID})`,
      })
      .from(customers)
      .where(cond)
      .orderBy(desc(customers.createdAt))
      .limit(Math.min(f.limit ?? 50, 5000))
      .offset(f.offset ?? 0),
    db.select({ n: count() }).from(customers).where(cond),
  ]);
  return { rows, total: total?.n ?? 0 };
}

export async function getAdminCustomer(id: string, db: Database = sharedDb) {
  const c = await db.query.customers.findFirst({
    where: eq(customers.id, id),
    with: { orders: { orderBy: [desc(orders.placedAt)] } },
  });
  return c ?? null;
}

// ── Messages ─────────────────────────────────────────────────────────────────

export async function listAdminMessages(
  f: { status: "unread" | "read" | "archived"; q?: string | undefined },
  db: Database = sharedDb,
) {
  const where: (SQL | undefined)[] = [eq(contactMessages.status, f.status)];
  if (f.q?.trim()) {
    const like = `%${f.q.trim().replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    where.push(
      or(
        ilike(contactMessages.subject, like),
        ilike(contactMessages.message, like),
        ilike(contactMessages.email, like),
        ilike(contactMessages.name, like),
      ),
    );
  }
  const [rows, counts] = await Promise.all([
    db
      .select()
      .from(contactMessages)
      .where(and(...where))
      .orderBy(desc(contactMessages.createdAt))
      .limit(200),
    db
      .select({ status: contactMessages.status, n: count() })
      .from(contactMessages)
      .groupBy(contactMessages.status),
  ]);
  return {
    rows,
    counts: Object.fromEntries(counts.map((c) => [c.status, c.n])) as Partial<
      Record<"unread" | "read" | "archived", number>
    >,
  };
}

export async function setMessagesStatus(
  ids: string[],
  status: "unread" | "read" | "archived",
  handledBy: string,
  db: Database = sharedDb,
) {
  if (!ids.length) return;
  await db
    .update(contactMessages)
    .set({ status, ...(status === "archived" ? { handledBy, handledAt: new Date() } : {}) })
    .where(inArray(contactMessages.id, ids));
}

export async function deleteMessages(ids: string[], db: Database = sharedDb) {
  if (ids.length) await db.delete(contactMessages).where(inArray(contactMessages.id, ids));
}

// ── Settings ─────────────────────────────────────────────────────────────────

/** Validates with the shared Zod schema, saves, and returns the previous value for the audit diff. */
export async function saveSetting(
  key: keyof SettingsMap,
  value: unknown,
  updatedBy: string,
  db: Database = sharedDb,
) {
  const parsed = settingsSchemas[key].parse(value);
  const [before] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  await db
    .insert(settings)
    .values({ key, value: parsed, updatedBy })
    .onConflictDoUpdate({ target: settings.key, set: { value: parsed, updatedBy } });
  return { before: before?.value ?? null, after: parsed };
}
