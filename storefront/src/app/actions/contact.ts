"use server";

import { createContactMessage } from "@repo/db";
import { contactFormSchema } from "@repo/shared";
import { clientIp, rateLimit } from "@/lib/rate-limit";

type Field = "name" | "email" | "phone" | "subject" | "message";
export type ContactState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Partial<Record<Field, string>>;
};

/**
 * Contact form → `contact_messages` (admin inbox). Honeypot + per-IP rate limit. Emailing the
 * owner is wired in once a mailer is configured (PLAN §5.7; mailer is optional in Phase 1).
 */
export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const raw = Object.fromEntries(
    (["name", "email", "phone", "subject", "message", "website"] as const).map((k) => [
      k,
      formData.get(k) ?? undefined,
    ]),
  );
  const parsed = contactFormSchema.safeParse({ ...raw, phone: raw.phone || undefined });
  if (!parsed.success) {
    // A filled honeypot means a bot: pretend success, store nothing.
    if (parsed.error.issues.some((i) => i.path[0] === "website")) {
      return { status: "success", message: "Thanks — we’ll be in touch shortly." };
    }
    const fieldErrors: ContactState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as Field;
      fieldErrors[key] ??= issue.message;
    }
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors };
  }

  const limited = rateLimit(`contact:${await clientIp()}`, { limit: 5, windowMs: 30 * 60_000 });
  if (!limited.ok)
    return { status: "error", message: "Too many messages — please try again a little later." };

  try {
    await createContactMessage(parsed.data);
  } catch (error) {
    console.error("[contact] insert failed", error);
    return {
      status: "error",
      message: "Something went wrong sending your message. Please try again.",
    };
  }
  return {
    status: "success",
    message: "Thanks — your message is on its way. We usually reply within one business day.",
  };
}
