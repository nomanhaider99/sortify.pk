/**
 * Single source of truth for the store brand. Rename the store here only.
 */
export const BRAND = {
  name: "Majestic",
  tagline: "Furniture & home, made to last",
  description:
    "Thoughtfully designed furniture made with premium materials — crafted for comfort and built to last.",
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
