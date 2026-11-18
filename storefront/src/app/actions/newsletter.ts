"use server";

import { db, schema } from "@repo/db";
import { newsletterSchema } from "@repo/shared";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export type NewsletterState = { status: "idle" | "success" | "error"; message: string };

export async function subscribeNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const parsed = newsletterSchema.safeParse({
    email: formData.get("email"),
    website: formData.get("website") ?? undefined,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Please check your email.",
    };
  }

  const limited = rateLimit(`newsletter:${await clientIp()}`, { limit: 5, windowMs: 10 * 60_000 });
  if (!limited.ok)
    return { status: "error", message: "Too many attempts — please try again later." };

  try {
    await db
      .insert(schema.newsletterSubscribers)
      .values({ email: parsed.data.email, source: "footer" })
      .onConflictDoNothing();
  } catch (error) {
    console.error("[newsletter] insert failed", error);
    return { status: "error", message: "Something went wrong. Please try again." };
  }
  // Same message whether or not the email already existed (no enumeration).
  return { status: "success", message: "Thank you — you're on the list." };
}
