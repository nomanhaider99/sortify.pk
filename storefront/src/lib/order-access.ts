import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Proof that this browser may view an order (set after placing it or after a successful
 * order-number + email lookup). HMAC-signed so it can't be forged; httpOnly + sameSite=lax.
 */
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret(): string {
  const s = process.env.AUTH_SECRET ?? process.env.REVALIDATE_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be set");
  return "dev-only-order-access-secret";
}

const cookieName = (orderNumber: string) =>
  `oa_${orderNumber.toUpperCase().replace(/[^A-Z0-9-]/g, "")}`;
const sign = (orderNumber: string) =>
  createHmac("sha256", secret()).update(orderNumber.toUpperCase()).digest("base64url");

export async function grantOrderAccess(orderNumber: string): Promise<void> {
  const jar = await cookies();
  jar.set(cookieName(orderNumber), sign(orderNumber), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function hasOrderAccess(orderNumber: string): Promise<boolean> {
  const jar = await cookies();
  const value = jar.get(cookieName(orderNumber))?.value;
  if (!value) return false;
  const expected = Buffer.from(sign(orderNumber));
  const actual = Buffer.from(value);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
