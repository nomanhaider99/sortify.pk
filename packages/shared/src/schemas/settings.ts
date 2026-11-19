import { z } from "zod";
import { BRAND } from "../brand";

const cents = z.number().int().nonnegative();

export const storeSettingsSchema = z.object({
  name: z.string().min(1).max(80),
  logoUrl: z.string().max(500).nullable(),
  email: z.email(),
  phone: z.string().max(40),
  address: z.string().max(300),
  hours: z.string().max(200),
  currency: z.string().length(3),
  orderPrefix: z.string().regex(/^[A-Z]{2,5}$/, "2–5 uppercase letters"),
});

export const heroSettingsSchema = z.object({
  eyebrow: z.string().max(80),
  headline: z.string().min(1).max(80),
  subtext: z.string().max(300),
  ctaLabel: z.string().min(1).max(40),
  ctaHref: z.string().min(1).max(300),
  imageUrl: z.string().min(1).max(500),
  imageAlt: z.string().max(200),
});

export const announcementSettingsSchema = z.object({
  enabled: z.boolean(),
  messages: z.array(z.string().min(1).max(140)).max(8),
  dismissible: z.boolean(),
});

export const shippingSettingsSchema = z.object({
  standardCents: cents,
  expressCents: cents,
  freeShippingThresholdCents: cents,
  standardEta: z.string().max(60),
  expressEta: z.string().max(60),
});

export const paymentSettingsSchema = z.object({
  codEnabled: z.boolean(),
  cardDemoEnabled: z.boolean(),
  codFeeCents: cents,
  autoOpenCartOnAdd: z.boolean(),
});

export const taxSettingsSchema = z.object({
  /** Basis points: 825 = 8.25% */
  rateBps: z.number().int().min(0).max(10_000),
  includedInPrices: z.boolean(),
});

export const settingsSchemas = {
  store: storeSettingsSchema,
  hero: heroSettingsSchema,
  announcement: announcementSettingsSchema,
  shipping: shippingSettingsSchema,
  payments: paymentSettingsSchema,
  tax: taxSettingsSchema,
} as const;

export type StoreSettings = z.infer<typeof storeSettingsSchema>;
export type HeroSettings = z.infer<typeof heroSettingsSchema>;
export type AnnouncementSettings = z.infer<typeof announcementSettingsSchema>;
export type ShippingSettings = z.infer<typeof shippingSettingsSchema>;
export type PaymentSettings = z.infer<typeof paymentSettingsSchema>;
export type TaxSettings = z.infer<typeof taxSettingsSchema>;

export type SettingsMap = {
  [K in keyof typeof settingsSchemas]: z.infer<(typeof settingsSchemas)[K]>;
};

export const DEFAULT_SETTINGS: SettingsMap = {
  store: {
    name: BRAND.name,
    logoUrl: null,
    email: BRAND.contactEmail,
    phone: "+1 (555) 010-2030",
    address: "214 Linden Street, Portland, OR 97205",
    hours: "Mon–Sat, 10:00–18:00",
    currency: BRAND.currency,
    orderPrefix: BRAND.orderPrefix,
  },
  hero: {
    eyebrow: "Make Your House",
    headline: "Feel Like Home",
    subtext:
      "Side tables, handmade decor and kitchen essentials in natural materials — made for slow mornings, long dinners and everyday comfort.",
    ctaLabel: "New Collection",
    ctaHref: "/products?sort=newest",
    imageUrl: "/images/site/hero.webp",
    imageAlt: "A warm living room with a lit fireplace, bookshelves and a wooden coffee table",
  },
  announcement: {
    enabled: true,
    messages: [
      "Free shipping on orders over $150 — Shop now",
      "New handmade ceramics just landed",
      "30-day easy returns on every piece",
    ],
    dismissible: true,
  },
  shipping: {
    standardCents: 2500,
    expressCents: 6500,
    freeShippingThresholdCents: 15000,
    standardEta: "5–8 business days",
    expressEta: "2–3 business days",
  },
  payments: {
    codEnabled: true,
    cardDemoEnabled: true,
    codFeeCents: 0,
    autoOpenCartOnAdd: true,
  },
  tax: {
    rateBps: 0,
    includedInPrices: true,
  },
};
