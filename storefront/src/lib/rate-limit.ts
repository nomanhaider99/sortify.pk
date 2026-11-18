import "server-only";
import { headers } from "next/headers";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Fixed-window, in-memory rate limiter (per server instance). Good enough for the demo and
 * local dev; swap for a shared store (Upstash/Postgres) when running many instances.
 */
export function rateLimit(key: string, { limit, windowMs }: { limit: number; windowMs: number }) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    }
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 };
  }
  bucket.count++;
  const ok = bucket.count <= limit;
  return {
    ok,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterMs: ok ? 0 : bucket.resetAt - now,
  };
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
