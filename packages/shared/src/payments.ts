import type { PaymentMethod, PaymentStatus } from "./constants";
import type { DemoCardInput } from "./schemas/checkout";

export type PaymentResult = {
  status: Extract<PaymentStatus, "pending" | "paid" | "failed">;
  /** Never the full number — only brand + last 4 are kept. */
  cardBrand?: string;
  cardLast4?: string;
  providerRef?: string;
  /** Customer-facing message when the payment failed. */
  error?: string;
};

export type CreatePaymentInput = {
  amountCents: number;
  currency: string;
  card?: DemoCardInput | undefined;
};

/** Swap-in point for a real gateway (e.g. Stripe) later (PLAN §5.9). */
export interface PaymentProvider {
  readonly method: PaymentMethod;
  createPayment(input: CreatePaymentInput): Promise<PaymentResult>;
  /** Confirms an existing payment, e.g. COD marked paid on delivery from the admin. */
  confirm(providerRef: string | null): Promise<PaymentResult>;
}

export const DEMO_CARDS = {
  success: "4242424242424242",
  declined: "4000000000000002",
} as const;

function cardBrand(number: string): string {
  if (/^4/.test(number)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(number)) return "mastercard";
  if (/^3[47]/.test(number)) return "amex";
  return "card";
}

const ref = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** Cash on delivery: nothing is charged now; payment is collected by the courier. */
export class CodProvider implements PaymentProvider {
  readonly method = "cod" as const;
  createPayment(): Promise<PaymentResult> {
    return Promise.resolve({ status: "pending", providerRef: ref("cod") });
  }
  confirm(providerRef: string | null): Promise<PaymentResult> {
    return Promise.resolve({ status: "paid", providerRef: providerRef ?? ref("cod") });
  }
}

/**
 * Demo card processor — no real charge. 4242 4242 4242 4242 succeeds, 4000 0000 0000 0002 is
 * declined, any other number is rejected with a hint to use the test card.
 */
export class DemoCardProvider implements PaymentProvider {
  readonly method = "card_demo" as const;

  createPayment({ card }: CreatePaymentInput): Promise<PaymentResult> {
    if (!card) return Promise.resolve({ status: "failed", error: "Card details are required." });
    const number = card.number.replace(/\D/g, "");
    const base = { cardBrand: cardBrand(number), cardLast4: number.slice(-4) };
    if (number === DEMO_CARDS.success) {
      return Promise.resolve({ status: "paid", ...base, providerRef: ref("demo") });
    }
    if (number === DEMO_CARDS.declined) {
      return Promise.resolve({
        status: "failed",
        ...base,
        error: "Your card was declined. Please try another card.",
      });
    }
    return Promise.resolve({
      status: "failed",
      ...base,
      error: "Demo mode: use the test card 4242 4242 4242 4242 (any future expiry, any CVC).",
    });
  }

  confirm(providerRef: string | null): Promise<PaymentResult> {
    return Promise.resolve({ status: "paid", providerRef: providerRef ?? ref("demo") });
  }
}

export function getPaymentProvider(method: PaymentMethod): PaymentProvider {
  return method === "cod" ? new CodProvider() : new DemoCardProvider();
}
