import { getProductBySlug } from "@repo/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { toProductPayload } from "@/lib/product-payload";

const slugSchema = z.string().regex(/^[a-z0-9-]{1,120}$/);

/** Variant data for the Quick Add sheet. */
export async function GET(_req: Request, ctx: RouteContext<"/api/products/[slug]">) {
  const { slug } = await ctx.params;
  if (!slugSchema.safeParse(slug).success)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const product = await getProductBySlug(slug);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(toProductPayload(product), {
    headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=300" },
  });
}
