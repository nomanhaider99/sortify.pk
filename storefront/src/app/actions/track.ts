"use server";

import { getOrderForTracking } from "@repo/db";
import { trackLookupSchema } from "@repo/shared";
import { redirect } from "next/navigation";
import { grantOrderAccess } from "@/lib/order-access";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { routes } from "@/lib/routes";

export type TrackState = { error: string | null };

/** Order number + email lookup. The same message is returned for "not found" and "wrong email". */
export async function lookupOrder(_prev: TrackState, formData: FormData): Promise<TrackState> {
  const parsed = trackLookupSchema.safeParse({
    orderNumber: formData.get("orderNumber"),
    email: formData.get("email"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };

  const limited = rateLimit(`track:${await clientIp()}`, { limit: 15, windowMs: 10 * 60_000 });
  if (!limited.ok) return { error: "Too many attempts — please try again in a few minutes." };

  const order = await getOrderForTracking(parsed.data.orderNumber, parsed.data.email);
  if (!order) return { error: "We couldn’t find an order matching that number and email." };

  await grantOrderAccess(order.orderNumber);
  redirect(routes.trackOrder(order.orderNumber));
}
