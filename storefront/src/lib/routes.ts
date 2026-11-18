import type { Route } from "next";

/**
 * Central route map. Several pages ship in later milestones (catalog M4, cart M5, checkout and
 * tracking M6), so their hrefs are cast to `Route` here once instead of at every call site.
 * Until a page exists the link resolves to the storefront 404 page.
 */
export const routes = {
  home: "/" as Route,
  shop: "/products" as Route,
  newArrivals: "/products?sort=newest" as Route,
  bestSellers: "/products?sort=best_selling" as Route,
  featured: "/products?featured=1" as Route,
  categories: "/categories" as Route,
  category: (slug: string) => `/categories/${slug}` as Route,
  product: (slug: string) => `/products/${slug}` as Route,
  search: (q: string) => `/products?q=${encodeURIComponent(q)}` as Route,
  contact: "/contact" as Route,
  faq: "/contact#faq" as Route,
  shipping: "/contact#shipping" as Route,
  track: "/track" as Route,
  cart: "/cart" as Route,
  account: "/account" as Route,
};

/** Routes whose first section is a dark full-bleed hero (header starts transparent/light). */
export const HERO_ROUTES: readonly string[] = ["/"];
