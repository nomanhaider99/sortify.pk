"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  checkoutFormSchema,
  computeTotals,
  formatMoney,
  type CheckoutFormValues,
  type PaymentSettings,
  type ShippingSettings,
  type TaxSettings,
} from "@repo/shared";
import { ChevronDown, CreditCard, Info, Lock, Truck, Wallet } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { placeOrder } from "@/app/actions/checkout";
import type { CartValidateResponse, ValidatedLine } from "@/app/api/cart/validate/route";
import { OrderSummary } from "@/components/cart/order-summary";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { syncCartNow, useCartSync } from "@/lib/use-cart-sync";
import { useHydrated } from "@/lib/use-hydrated";
import { useCart } from "@/stores/cart";

type Props = { shipping: ShippingSettings; payments: PaymentSettings; tax: TaxSettings };

const COUNTRIES = [
  ["US", "United States"],
  ["CA", "Canada"],
  ["GB", "United Kingdom"],
  ["AU", "Australia"],
  ["DE", "Germany"],
  ["FR", "France"],
  ["PK", "Pakistan"],
  ["AE", "United Arab Emirates"],
] as const;

export function CheckoutForm({ shipping, payments, tax }: Props) {
  const hydrated = useHydrated();
  const router = useRouter();
  const search = useSearchParams();
  const cartLines = useCart((s) => s.lines);
  const clearCart = useCart((s) => s.clear);
  const buyVariant = search.get("buy");
  const buyQty = Math.min(Math.max(Number(search.get("qty") ?? "1") || 1, 1), 20);
  const [buyLine, setBuyLine] = useState<ValidatedLine | null>(null);
  const [buyError, setBuyError] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  useCartSync(hydrated && !buyVariant);

  // "Buy it now": checkout with just this item (validated server-side).
  useEffect(() => {
    if (!buyVariant) return;
    fetch("/api/cart/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines: [{ variantId: buyVariant, quantity: buyQty }] }),
    })
      .then((r) => r.json() as Promise<CartValidateResponse>)
      .then((d) => (d.lines[0] ? setBuyLine(d.lines[0]) : setBuyError(true)))
      .catch(() => setBuyError(true));
  }, [buyVariant, buyQty]);

  const lines = useMemo(
    () => (buyVariant ? (buyLine ? [buyLine] : []) : cartLines),
    [buyVariant, buyLine, cartLines],
  );

  const {
    register,
    handleSubmit,
    control,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
      phone: "",
      newsletter: false,
      address: {
        name: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "US",
        phone: "",
      },
      deliveryMethod: "standard",
      paymentMethod: payments.cardDemoEnabled ? "card_demo" : "cod",
      card: { number: "", expiry: "", cvc: "", name: "" },
      note: "",
    },
  });
  const values = useWatch({ control });
  const deliveryMethod = values.deliveryMethod ?? "standard";
  const paymentMethod = values.paymentMethod ?? "card_demo";

  const totals = computeTotals({
    lines: lines.map((l) => ({ unitPriceCents: l.unitPriceCents, quantity: l.quantity })),
    deliveryMethod,
    paymentMethod,
    shipping,
    payments,
    tax,
  });
  const freeStandard = totals.subtotalCents >= shipping.freeShippingThresholdCents;

  // Progress indicator: a step is "done" when its required fields have content.
  const steps = [
    { label: "Contact", done: Boolean(values.email && values.phone) },
    {
      label: "Shipping",
      done: Boolean(
        values.address?.name &&
        values.address.line1 &&
        values.address.city &&
        values.address.postalCode &&
        values.address.phone,
      ),
    },
    { label: "Delivery", done: Boolean(values.deliveryMethod) },
    {
      label: "Payment",
      done:
        paymentMethod === "cod" ||
        Boolean(values.card?.number && values.card.expiry && values.card.cvc && values.card.name),
    },
  ];
  const progress = steps.filter((s) => s.done).length / steps.length;

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);
    const result = await placeOrder({
      ...data,
      card: data.paymentMethod === "card_demo" ? data.card : undefined,
      lines: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
      idempotencyKey,
    });
    if (result.ok) {
      if (!buyVariant) clearCart();
      router.push(routes.orderSuccess(result.orderNumber));
      return;
    }
    setSubmitError(result.error);
    if (result.field) {
      try {
        setFocus(result.field as FieldPath<CheckoutFormValues>);
      } catch {
        // field not focusable — the error banner is enough
      }
    }
    if (result.cartChanged && !buyVariant) void syncCartNow();
  });

  if (!hydrated || (buyVariant && !buyLine && !buyError)) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <Spinner label="Loading checkout" />
      </div>
    );
  }
  if (!lines.length) {
    return (
      <div className="bg-surface-muted rounded-sm px-6 py-24 text-center">
        <p className="font-display text-3xl italic">
          {buyError ? "That item is no longer available" : "Your cart is empty"}
        </p>
        <Button asChild className="mt-8">
          <Link href={routes.shop}>Continue shopping</Link>
        </Button>
      </div>
    );
  }

  const field = (invalid?: boolean) =>
    cn(
      "border-border bg-surface focus-visible:outline-primary-strong w-full rounded-xs border px-4 py-3 text-sm",
      invalid && "border-danger",
    );
  const err = (msg?: string) => (msg ? <p className="text-danger mt-1.5 text-xs">{msg}</p> : null);

  const summary = (
    <OrderSummary lines={lines} totals={totals}>
      <p className="text-ink-muted mt-4 text-xs">
        Final prices and stock are confirmed when you place your order.
      </p>
    </OrderSummary>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
      {/* Mobile summary (collapsible) */}
      <div className="bg-surface border-border rounded-sm border lg:hidden">
        <button
          type="button"
          onClick={() => setSummaryOpen((o) => !o)}
          aria-expanded={summaryOpen}
          className="flex w-full items-center justify-between px-5 py-4 text-sm"
        >
          <span className="inline-flex items-center gap-2">
            {summaryOpen ? "Hide" : "Show"} order summary
            <ChevronDown
              className={cn("size-4 transition-transform", summaryOpen && "rotate-180")}
              aria-hidden
            />
          </span>
          <span className="font-medium">{formatMoney(totals.totalCents)}</span>
        </button>
        <AnimatePresence initial={false}>
          {summaryOpen ? (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5">{summary}</div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-10">
        {/* Progress */}
        <div>
          <ol className="flex justify-between text-xs">
            {steps.map((s, i) => (
              <li
                key={s.label}
                className={cn("flex items-center gap-2", s.done ? "text-ink" : "text-ink-muted")}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border text-[0.65rem] transition-colors",
                    s.done
                      ? "bg-primary-strong border-primary-strong text-on-strong"
                      : "border-border",
                  )}
                >
                  {i + 1}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </li>
            ))}
          </ol>
          <div className="bg-primary-soft mt-3 h-1 overflow-hidden rounded-full">
            <motion.div
              className="bg-primary-strong h-full origin-left"
              animate={{ scaleX: progress }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <Section n={1} title="Contact">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={field(!!errors.email)}
                {...register("email")}
              />
              {err(errors.email?.message)}
            </div>
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                className={field(!!errors.phone)}
                {...register("phone")}
              />
              {err(errors.phone?.message)}
            </div>
          </div>
          <label className="mt-4 flex min-h-10 items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="accent-primary-strong size-5"
              {...register("newsletter")}
            />
            Email me about new collections and offers
          </label>
        </Section>

        <Section n={2} title="Shipping address">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="address.name" className="mb-1.5 block text-sm">
                Full name
              </label>
              <input
                id="address.name"
                autoComplete="name"
                className={field(!!errors.address?.name)}
                {...register("address.name")}
              />
              {err(errors.address?.name?.message)}
            </div>
            <div className="md:col-span-2">
              <label htmlFor="address.line1" className="mb-1.5 block text-sm">
                Address
              </label>
              <input
                id="address.line1"
                autoComplete="address-line1"
                className={field(!!errors.address?.line1)}
                {...register("address.line1")}
              />
              {err(errors.address?.line1?.message)}
            </div>
            <div className="md:col-span-2">
              <label htmlFor="address.line2" className="mb-1.5 block text-sm">
                Apartment, suite, etc. <span className="text-ink-muted">(optional)</span>
              </label>
              <input
                id="address.line2"
                autoComplete="address-line2"
                className={field()}
                {...register("address.line2")}
              />
            </div>
            <div>
              <label htmlFor="address.city" className="mb-1.5 block text-sm">
                City
              </label>
              <input
                id="address.city"
                autoComplete="address-level2"
                className={field(!!errors.address?.city)}
                {...register("address.city")}
              />
              {err(errors.address?.city?.message)}
            </div>
            <div>
              <label htmlFor="address.state" className="mb-1.5 block text-sm">
                State / Province
              </label>
              <input
                id="address.state"
                autoComplete="address-level1"
                className={field(!!errors.address?.state)}
                {...register("address.state")}
              />
              {err(errors.address?.state?.message)}
            </div>
            <div>
              <label htmlFor="address.postalCode" className="mb-1.5 block text-sm">
                Postal code
              </label>
              <input
                id="address.postalCode"
                autoComplete="postal-code"
                className={field(!!errors.address?.postalCode)}
                {...register("address.postalCode")}
              />
              {err(errors.address?.postalCode?.message)}
            </div>
            <div>
              <label htmlFor="address.country" className="mb-1.5 block text-sm">
                Country
              </label>
              <select
                id="address.country"
                autoComplete="country"
                className={field(!!errors.address?.country)}
                {...register("address.country")}
              >
                {COUNTRIES.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="address.phone" className="mb-1.5 block text-sm">
                Phone for delivery
              </label>
              <input
                id="address.phone"
                type="tel"
                autoComplete="tel"
                className={field(!!errors.address?.phone)}
                {...register("address.phone")}
              />
              {err(errors.address?.phone?.message)}
            </div>
          </div>
        </Section>

        <Section n={3} title="Delivery method">
          <div className="grid gap-3" role="radiogroup" aria-label="Delivery method">
            <RadioCard
              id="delivery-standard"
              checked={deliveryMethod === "standard"}
              title="Standard delivery"
              subtitle={shipping.standardEta}
              price={
                freeStandard
                  ? "Free"
                  : formatMoney(shipping.standardCents, "USD", { withCode: false })
              }
              icon={<Truck className="size-5" strokeWidth={1.5} aria-hidden />}
              input={
                <input
                  type="radio"
                  value="standard"
                  id="delivery-standard"
                  className="sr-only"
                  {...register("deliveryMethod")}
                />
              }
            />
            <RadioCard
              id="delivery-express"
              checked={deliveryMethod === "express"}
              title="Express delivery"
              subtitle={shipping.expressEta}
              price={formatMoney(shipping.expressCents, "USD", { withCode: false })}
              icon={<Truck className="size-5" strokeWidth={1.5} aria-hidden />}
              input={
                <input
                  type="radio"
                  value="express"
                  id="delivery-express"
                  className="sr-only"
                  {...register("deliveryMethod")}
                />
              }
            />
          </div>
        </Section>

        <Section n={4} title="Payment">
          <div className="grid gap-3" role="radiogroup" aria-label="Payment method">
            {payments.cardDemoEnabled ? (
              <RadioCard
                id="pay-card"
                checked={paymentMethod === "card_demo"}
                title="Credit or debit card"
                subtitle="Visa, Mastercard"
                icon={<CreditCard className="size-5" strokeWidth={1.5} aria-hidden />}
                input={
                  <input
                    type="radio"
                    value="card_demo"
                    id="pay-card"
                    className="sr-only"
                    {...register("paymentMethod")}
                  />
                }
              >
                <AnimatePresence initial={false}>
                  {paymentMethod === "card_demo" ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 pt-5">
                        <p className="bg-warning/15 text-warning-ink flex items-start gap-2 rounded-xs px-3 py-2.5 text-xs">
                          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                          <span>
                            <strong className="font-medium">Demo mode — no real charge.</strong> Use
                            4242 4242 4242 4242 with any future expiry and any CVC. 4000 0000 0000
                            0002 simulates a declined card.
                          </span>
                        </p>
                        <div>
                          <label htmlFor="card.number" className="mb-1.5 block text-sm">
                            Card number
                          </label>
                          <input
                            id="card.number"
                            inputMode="numeric"
                            autoComplete="cc-number"
                            placeholder="4242 4242 4242 4242"
                            className={field(!!errors.card?.number)}
                            {...register("card.number")}
                          />
                          {err(errors.card?.number?.message)}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="card.expiry" className="mb-1.5 block text-sm">
                              Expiry (MM / YY)
                            </label>
                            <input
                              id="card.expiry"
                              inputMode="numeric"
                              autoComplete="cc-exp"
                              placeholder="12 / 28"
                              className={field(!!errors.card?.expiry)}
                              {...register("card.expiry")}
                            />
                            {err(errors.card?.expiry?.message)}
                          </div>
                          <div>
                            <label htmlFor="card.cvc" className="mb-1.5 block text-sm">
                              CVC
                            </label>
                            <input
                              id="card.cvc"
                              inputMode="numeric"
                              autoComplete="cc-csc"
                              placeholder="123"
                              className={field(!!errors.card?.cvc)}
                              {...register("card.cvc")}
                            />
                            {err(errors.card?.cvc?.message)}
                          </div>
                        </div>
                        <div>
                          <label htmlFor="card.name" className="mb-1.5 block text-sm">
                            Name on card
                          </label>
                          <input
                            id="card.name"
                            autoComplete="cc-name"
                            className={field(!!errors.card?.name)}
                            {...register("card.name")}
                          />
                          {err(errors.card?.name?.message)}
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </RadioCard>
            ) : null}
            {payments.codEnabled ? (
              <RadioCard
                id="pay-cod"
                checked={paymentMethod === "cod"}
                title="Cash on delivery"
                subtitle={
                  payments.codFeeCents
                    ? `Pay the courier in cash · ${formatMoney(payments.codFeeCents, "USD", { withCode: false })} COD fee`
                    : "Pay the courier in cash when your order arrives"
                }
                icon={<Wallet className="size-5" strokeWidth={1.5} aria-hidden />}
                input={
                  <input
                    type="radio"
                    value="cod"
                    id="pay-cod"
                    className="sr-only"
                    {...register("paymentMethod")}
                  />
                }
              />
            ) : null}
          </div>
        </Section>

        <div>
          <label htmlFor="note" className="mb-1.5 block text-sm">
            Order note <span className="text-ink-muted">(optional)</span>
          </label>
          <textarea
            id="note"
            rows={3}
            className={field()}
            placeholder="Delivery instructions, gift message…"
            {...register("note")}
          />
        </div>

        <AnimatePresence>
          {submitError ? (
            <motion.p
              role="alert"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-danger/10 text-danger rounded-xs px-4 py-3 text-sm"
            >
              {submitError}
            </motion.p>
          ) : null}
        </AnimatePresence>

        <Button type="submit" size="lg" block disabled={isSubmitting}>
          {isSubmitting ? (
            <Spinner label="Placing order" />
          ) : (
            <>
              <Lock className="size-4" aria-hidden /> Place order ·{" "}
              {formatMoney(totals.totalCents, "USD", { withCode: false })}
            </>
          )}
        </Button>
        <p className="text-ink-muted text-center text-xs">
          By placing your order you agree to our terms. Your card details are never stored.
        </p>
      </form>

      <aside className="hidden lg:block">
        <div className="bg-surface border-border sticky top-28 rounded-sm border p-6">
          <h2 className="font-display text-2xl italic">Order summary</h2>
          <div className="mt-3">{summary}</div>
        </div>
      </aside>
    </div>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="font-display mb-5 flex items-baseline gap-3 text-2xl italic">
        <span className="text-ink-muted font-sans text-xs not-italic">0{n}</span>
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function RadioCard({
  id,
  checked,
  title,
  subtitle,
  price,
  icon,
  input,
  children,
}: {
  id: string;
  checked: boolean;
  title: string;
  subtitle: string;
  price?: string;
  icon: ReactNode;
  input: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "bg-surface has-[:focus-visible]:outline-primary-strong rounded-sm border px-5 py-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2",
        checked ? "border-ink" : "border-border",
      )}
    >
      <label htmlFor={id} className="flex cursor-pointer items-center gap-4">
        {input}
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full border",
            checked ? "border-ink" : "border-border",
          )}
          aria-hidden
        >
          {checked ? <span className="bg-ink size-2.5 rounded-full" /> : null}
        </span>
        <span className="text-ink-muted">{icon}</span>
        <span className="flex-1">
          <span className="block text-sm font-medium">{title}</span>
          <span className="text-ink-muted block text-xs">{subtitle}</span>
        </span>
        {price ? <span className="text-sm">{price}</span> : null}
      </label>
      {children}
    </div>
  );
}
