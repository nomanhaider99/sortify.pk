"use server";

import { createPendingReview } from "@repo/db";
import { reviewFormSchema } from "@repo/shared";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export type ReviewState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Partial<Record<"name" | "email" | "rating" | "title" | "body", string>>;
};

/** Stores a review as `pending` — it only appears on the storefront once approved in the admin. */
export async function submitReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const parsed = reviewFormSchema.safeParse({
    productId: formData.get("productId"),
    name: formData.get("name"),
    email: formData.get("email"),
    rating: Number(formData.get("rating")),
    title: formData.get("title"),
    body: formData.get("body"),
    website: formData.get("website") ?? undefined,
  });
  if (!parsed.success) {
    const fieldErrors: ReviewState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (
        key === "name" ||
        key === "email" ||
        key === "rating" ||
        key === "title" ||
        key === "body"
      ) {
        fieldErrors[key] ??= key === "rating" ? "Please choose a star rating" : issue.message;
      }
    }
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors };
  }

  const limited = rateLimit(`review:${await clientIp()}`, { limit: 5, windowMs: 60 * 60_000 });
  if (!limited.ok)
    return {
      status: "error",
      message: "You’ve submitted several reviews recently — please try again later.",
    };

  const { productId, name, email, rating, title, body } = parsed.data;
  try {
    const ok = await createPendingReview({ productId, name, email, rating, title, body });
    if (!ok) return { status: "error", message: "This product is no longer available." };
  } catch (error) {
    console.error("[review] insert failed", error);
    return { status: "error", message: "Something went wrong. Please try again." };
  }
  return { status: "success", message: "Thanks — your review will appear once approved." };
}
