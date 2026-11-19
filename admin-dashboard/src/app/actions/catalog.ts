"use server";

import {
  deleteCategory,
  deleteMessages,
  deleteReviews,
  getProductSlugs,
  listAdminCustomers,
  moderateReviews,
  reorderCategories,
  replyToReview,
  saveCategory,
  saveSetting,
  setMessagesStatus,
  setReviewFeatured,
} from "@repo/db/admin";
import { REVIEW_STATUSES, type SettingsMap } from "@repo/shared";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction, type ActionResult } from "@/lib/actions";
import { csvRow } from "@/lib/csv";
import { productPaths, revalidateStorefront } from "@/lib/storefront";

const ids = z.array(z.uuid()).min(1).max(200);

// ── Categories ───────────────────────────────────────────────────────────────

const categorySchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2, "Add a name").max(60),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes")
    .max(80),
  description: z.string().trim().max(400),
  imageUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (u) => u === "" || u.startsWith("/images/") || /^https:\/\//.test(u),
      "Use an https URL or a library image",
    )
    .transform((u) => u || null),
  isVisible: z.boolean(),
  showInMenu: z.boolean(),
});

export async function saveCategoryAction(
  input: z.input<typeof categorySchema>,
): Promise<ActionResult<{ id: string }>> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const data = parsed.data;
  return runAction(
    data.id ? "categories:update" : "categories:create",
    async ({ audit }) => {
      const { id, before } = await saveCategory(data);
      await audit({
        action: before ? "category.updated" : "category.created",
        entityType: "category",
        entityId: id,
        summary: `${before ? "Updated" : "Created"} category “${data.name}”`,
        diff: before
          ? Object.fromEntries(
              (["name", "slug", "isVisible", "showInMenu"] as const)
                .filter((k) => before[k] !== data[k])
                .map((k) => [k, { before: before[k], after: data[k] }]),
            )
          : null,
      });
      revalidatePath("/categories");
      await revalidateStorefront({
        tags: ["catalog"],
        paths: ["/", "/categories", `/categories/${data.slug}`, "/products"],
      });
      return { id };
    },
    "Category saved",
  );
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  return runAction(
    "categories:delete",
    async ({ audit }) => {
      const c = await deleteCategory(z.uuid().parse(id));
      await audit({
        action: "category.deleted",
        entityType: "category",
        entityId: id,
        summary: `Deleted category “${c.name}”`,
      });
      revalidatePath("/categories");
      await revalidateStorefront({
        tags: ["catalog"],
        paths: ["/", "/categories", `/categories/${c.slug}`],
      });
      return undefined;
    },
    "Category deleted",
  );
}

export async function reorderCategoriesAction(orderedIds: string[]): Promise<ActionResult> {
  return runAction(
    "categories:update",
    async ({ audit }) => {
      await reorderCategories(ids.parse(orderedIds));
      await audit({
        action: "category.reordered",
        entityType: "category",
        summary: "Reordered categories",
      });
      revalidatePath("/categories");
      await revalidateStorefront({ tags: ["catalog"], paths: ["/", "/categories"] });
      return undefined;
    },
    "Order saved",
  );
}

// ── Reviews ──────────────────────────────────────────────────────────────────

export async function moderateReviewsAction(
  rawIds: string[],
  status: (typeof REVIEW_STATUSES)[number],
): Promise<ActionResult<{ count: number }>> {
  const s = z.enum(REVIEW_STATUSES).parse(status);
  return runAction("reviews:moderate", async ({ session, audit }) => {
    const list = ids.parse(rawIds);
    const productIds = await moderateReviews(list, s, session.id);
    await audit({
      action: `review.${s}`,
      entityType: "review",
      entityId: list.length === 1 ? list[0] : null,
      summary: `${s === "approved" ? "Approved" : s === "rejected" ? "Rejected" : "Moved to pending"} ${list.length} review(s)`,
    });
    revalidatePath("/reviews");
    // Approval changes what's public and the product rating.
    const slugs = await getProductSlugs([...new Set(productIds)]);
    await revalidateStorefront({
      tags: ["catalog"],
      paths: productPaths(slugs.map((p) => p.slug)),
    });
    return { count: list.length };
  });
}

export async function featureReviewAction(id: string, featured: boolean): Promise<ActionResult> {
  return runAction(
    "reviews:moderate",
    async ({ audit }) => {
      await setReviewFeatured(z.uuid().parse(id), featured);
      await audit({
        action: featured ? "review.featured" : "review.unfeatured",
        entityType: "review",
        entityId: id,
        summary: `${featured ? "Featured" : "Unfeatured"} a review on the homepage`,
      });
      revalidatePath("/reviews");
      await revalidateStorefront({ paths: ["/"] });
      return undefined;
    },
    featured ? "Featured on the homepage" : "Removed from the homepage",
  );
}

export async function replyReviewAction(id: string, reply: string): Promise<ActionResult> {
  return runAction(
    "reviews:moderate",
    async ({ audit }) => {
      const text = z.string().trim().max(1000).parse(reply);
      await replyToReview(z.uuid().parse(id), text || null);
      await audit({
        action: "review.replied",
        entityType: "review",
        entityId: id,
        summary: text ? "Replied to a review" : "Removed reply",
      });
      revalidatePath("/reviews");
      await revalidateStorefront({ tags: ["catalog"] });
      return undefined;
    },
    "Reply saved",
  );
}

export async function deleteReviewsAction(rawIds: string[]): Promise<ActionResult> {
  return runAction(
    "reviews:delete",
    async ({ audit }) => {
      const list = ids.parse(rawIds);
      await deleteReviews(list);
      await audit({
        action: "review.deleted",
        entityType: "review",
        summary: `Deleted ${list.length} review(s)`,
      });
      revalidatePath("/reviews");
      await revalidateStorefront({ tags: ["catalog"] });
      return undefined;
    },
    "Deleted",
  );
}

// ── Customers ────────────────────────────────────────────────────────────────

export async function exportCustomersCsv(
  q: string,
): Promise<ActionResult<{ csv: string; filename: string }>> {
  return runAction("data:export", async ({ audit }) => {
    const { rows } = await listAdminCustomers({ q, limit: 5000 });
    const header = [
      "Name",
      "Email",
      "Phone",
      "Orders",
      "Total spent",
      "Marketing",
      "Customer since",
    ];
    const lines = rows.map((r) =>
      csvRow([
        r.name,
        r.email,
        r.phone,
        r.orderCount,
        (r.totalSpent / 100).toFixed(2),
        r.acceptsMarketing ? "yes" : "no",
        r.createdAt,
      ]),
    );
    await audit({
      action: "data.export",
      entityType: "customer",
      summary: `Exported ${rows.length} customers to CSV`,
    });
    return {
      csv: [header, ...lines].join("\n"),
      filename: `customers-${new Date().toISOString().slice(0, 10)}.csv`,
    };
  });
}

// ── Messages ─────────────────────────────────────────────────────────────────

export async function setMessagesStatusAction(
  rawIds: string[],
  status: "unread" | "read" | "archived",
): Promise<ActionResult> {
  const s = z.enum(["unread", "read", "archived"]).parse(status);
  return runAction("messages:update", async ({ session, audit }) => {
    const list = ids.parse(rawIds);
    await setMessagesStatus(list, s, session.id);
    await audit({
      action: `message.${s}`,
      entityType: "message",
      entityId: list.length === 1 ? list[0] : null,
      summary: `Marked ${list.length} message(s) as ${s}`,
    });
    revalidatePath("/messages");
    return undefined;
  });
}

export async function deleteMessagesAction(rawIds: string[]): Promise<ActionResult> {
  return runAction(
    "messages:delete",
    async ({ audit }) => {
      const list = ids.parse(rawIds);
      await deleteMessages(list);
      await audit({
        action: "message.deleted",
        entityType: "message",
        summary: `Deleted ${list.length} message(s)`,
      });
      revalidatePath("/messages");
      return undefined;
    },
    "Deleted",
  );
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function saveSettingsAction(
  key: keyof SettingsMap,
  value: unknown,
): Promise<ActionResult> {
  const k = z.enum(["store", "hero", "announcement", "shipping", "payments", "tax"]).parse(key);
  return runAction(
    "settings:update",
    async ({ session, audit }) => {
      const { before, after } = await saveSetting(k, value, session.id);
      await audit({
        action: "settings.updated",
        entityType: "settings",
        entityId: k,
        summary: `Updated ${k} settings`,
        diff: { [k]: { before, after } },
      });
      revalidatePath("/settings", "layout");
      await revalidateStorefront({
        tags: ["settings"],
        paths: ["/", "/contact", "/checkout", "/cart"],
      });
      return undefined;
    },
    "Settings saved — the storefront will update shortly",
  );
}
