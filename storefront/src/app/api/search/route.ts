import { searchCatalog } from "@repo/db";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const querySchema = z.object({ q: z.string().trim().min(2).max(60) });

export type SearchResponse = {
  products: {
    slug: string;
    title: string;
    priceCents: number;
    image: { url: string; alt: string } | null;
  }[];
  categories: { slug: string; name: string }[];
};

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({ q: request.nextUrl.searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return NextResponse.json<SearchResponse>({ products: [], categories: [] });
  }

  const limited = rateLimit(`search:${await clientIp()}`, { limit: 60, windowMs: 60_000 });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limited.retryAfterMs / 1000)) } },
    );
  }

  const result = await searchCatalog(parsed.data.q, 6);
  const body: SearchResponse = {
    products: result.products.map((p) => ({
      slug: p.slug,
      title: p.title,
      priceCents: p.priceCents,
      image: p.images[0] ?? null,
    })),
    categories: result.categories.map((c) => ({ slug: c.slug, name: c.name })),
  };
  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" },
  });
}
