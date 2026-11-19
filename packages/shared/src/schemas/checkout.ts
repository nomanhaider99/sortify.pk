import { z } from "zod";
import { DELIVERY_METHODS, PAYMENT_METHODS } from "../constants";
import { addressSchema } from "./forms";

export const MAX_LINE_QUANTITY = 20;

export const cartLineInputSchema = z.object({
  variantId: z.uuid(),
  quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
});
export type CartLineInput = z.infer<typeof cartLineInputSchema>;

export const cartValidateSchema = z.object({
  lines: z.array(cartLineInputSchema).max(50),
});

/** True if MM/YY is the current month or later. */
export function isFutureExpiry(expiry: string, now = new Date()): boolean {
  const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(expiry.trim());
  if (!m) return false;
  const month = Number(m[1]);
  if (month < 1 || month > 12) return false;
  const year = 2000 + Number(m[2]);
  const endOfMonth = new Date(Date.UTC(year, month, 1));
  return endOfMonth.getTime() > now.getTime();
}

/** Demo card fields — validated, used for the demo decision, and NEVER stored. */
export const demoCardSchema = z.object({
  number: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().regex(/^\d{13,19}$/, "Enter a valid card number")),
  expiry: z
    .string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/, "Use MM / YY")
    .refine((v) => isFutureExpiry(v), "This card has expired"),
  cvc: z
    .string()
    .trim()
    .regex(/^\d{3,4}$/, "3 or 4 digits"),
  name: z.string().trim().min(2, "Name on card").max(80),
});
export type DemoCardInput = z.infer<typeof demoCardSchema>;

const checkoutFields = {
  email: z.email("Please enter a valid email").trim().toLowerCase().max(200),
  phone: z
    .string()
    .trim()
    .min(6, "Please enter a phone number")
    .max(30)
    .regex(/^[+\d\s().-]+$/, "Please enter a valid phone number"),
  newsletter: z.boolean(),
  address: addressSchema,
  deliveryMethod: z.enum(DELIVERY_METHODS),
  paymentMethod: z.enum(PAYMENT_METHODS),
  /** Raw card inputs; only validated (via demoCardSchema) when paying by card. */
  card: z
    .object({ number: z.string(), expiry: z.string(), cvc: z.string(), name: z.string() })
    .partial()
    .optional(),
  note: z.string().trim().max(500).optional(),
};

function refineCard(
  v: {
    paymentMethod: (typeof PAYMENT_METHODS)[number];
    card?: Partial<Record<keyof DemoCardInput, string>> | undefined;
  },
  ctx: z.RefinementCtx,
) {
  if (v.paymentMethod !== "card_demo") return;
  const r = demoCardSchema.safeParse(v.card ?? {});
  if (!r.success) {
    for (const issue of r.error.issues) {
      ctx.addIssue({ code: "custom", path: ["card", ...issue.path], message: issue.message });
    }
  }
}

/** Client checkout form (React Hook Form + zodResolver). */
export const checkoutFormSchema = z.object(checkoutFields).superRefine(refineCard);
export type CheckoutFormValues = z.input<typeof checkoutFormSchema>;

/** Server action payload: the form plus cart lines and an idempotency key. */
export const checkoutSchema = z
  .object({
    ...checkoutFields,
    lines: z.array(cartLineInputSchema).min(1, "Your cart is empty").max(50),
    idempotencyKey: z.uuid(),
  })
  .superRefine(refineCard);
export type CheckoutInput = z.infer<typeof checkoutSchema>;
