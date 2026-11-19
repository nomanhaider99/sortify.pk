/**
 * Single source of truth for the store brand. Rename the store here only.
 */
export const BRAND = {
  name: "Majestic",
  tagline: "Home decor & kitchen essentials",
  description:
    "Small tables, handmade decor and everyday kitchen essentials — thoughtfully made to be used and loved for years.",
  orderPrefix: "MJ",
  currency: "USD",
  localeLabel: "ENGLISH (USD $)",
  contactEmail: "hello@majestic.example",
  social: {
    instagram: "https://instagram.com/",
    x: "https://x.com/",
    facebook: "https://facebook.com/",
  },
} as const;

export type Brand = typeof BRAND;
