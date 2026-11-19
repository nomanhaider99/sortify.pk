import { BRAND } from "./brand";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I for readability

/** Generates a human-friendly order number: `SF-YYYYMMDD-XXXX`. Uniqueness is enforced by the DB. */
export function generateOrderNumber(
  date: Date = new Date(),
  prefix: string = BRAND.orderPrefix,
  random: () => number = Math.random,
): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += ALPHABET.charAt(Math.floor(random() * ALPHABET.length));
  return `${prefix}-${y}${m}${d}-${suffix}`;
}

export const ORDER_NUMBER_PATTERN = /^[A-Z]{2,5}-\d{8}-[A-Z0-9]{4}$/;
