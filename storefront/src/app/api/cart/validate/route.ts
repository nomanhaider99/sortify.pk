import { getCartVariants } from "@repo/db";
import { cartValidateSchema, MAX_LINE_QUANTITY } from "@repo/shared";
import { NextResponse, type NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export type ValidatedLine = {
  variantId: string;
  productId: string;
  slug: string;
  title: string;
  variantLabel: string;
  image: string | null;
  unitPriceCents: number;
  quantity: number;
  maxQuantity: number;
};

export type CartValidateResponse = {
  lines: ValidatedLine[];
  /** Human-readable notes about anything that changed (price, stock, removed). */
  issues: string[];
};

/** Re-prices a cart from the database and clamps quantities to available stock. */
export async function POST(request: NextRequest) {
  const limited = rateLimit(`cart:${await clientIp()}`, { limit: 120, windowMs: 60_000 });
  if (!limited.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body: unknown = await request.json().catch(() => null);
  const parsed = cartValidateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid cart" }, { status: 400 });

  const variants = await getCartVariants(parsed.data.lines.map((l) => l.variantId));
  const issues: string[] = [];
  const lines: ValidatedLine[] = [];

  for (const line of parsed.data.lines) {
    const v = variants.get(line.variantId);
    if (!v?.available || v.stockQty <= 0) {
      issues.push(`${v?.title ?? "An item"} is no longer available and was removed.`);
      continue;
    }
    const max = Math.min(v.stockQty, MAX_LINE_QUANTITY);
    const quantity = Math.min(line.quantity, max);
    if (quantity < line.quantity)
      issues.push(`Only ${max} of ${v.title} available — quantity updated.`);
    lines.push({
      variantId: v.variantId,
      productId: v.productId,
      slug: v.slug,
      title: v.title,
      variantLabel: v.variantLabel,
      image: v.image,
      unitPriceCents: v.priceCents,
      quantity,
      maxQuantity: max,
    });
  }
  return NextResponse.json<CartValidateResponse>({ lines, issues });
}
