import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  tags: z
    .array(z.enum(["catalog", "settings"]))
    .max(5)
    .default([]),
  paths: z
    .array(
      z
        .string()
        .regex(/^\/[a-z0-9/_-]*$/i)
        .max(200),
    )
    .max(50)
    .default([]),
});

function authorized(req: NextRequest): boolean {
  const secret = process.env.REVALIDATE_SECRET;
  const given = req.headers.get("x-revalidate-secret");
  if (!secret || !given) return false;
  const a = Buffer.from(secret);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * On-demand revalidation webhook, called by the admin after it publishes changes
 * (products, categories, reviews, settings). Protected by REVALIDATE_SECRET.
 */
export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  for (const tag of parsed.data.tags) revalidateTag(tag, "max");
  for (const path of parsed.data.paths) revalidatePath(path);
  return NextResponse.json({ revalidated: true, ...parsed.data });
}
