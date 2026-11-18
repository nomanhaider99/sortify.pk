import "server-only";
import { getSettings, listCategories, listProducts } from "@repo/db";
import { DEFAULT_SETTINGS } from "@repo/shared";
import { unstable_cache } from "next/cache";

/** Cache tags revalidated by the admin webhook (M9). */
export const TAGS = { catalog: "catalog", settings: "settings" } as const;

export type ShellData = {
  announcement: typeof DEFAULT_SETTINGS.announcement;
  store: typeof DEFAULT_SETTINGS.store;
  categories: { slug: string; name: string }[];
  featuredProducts: { slug: string; title: string }[];
};

async function loadShell(): Promise<ShellData> {
  try {
    const [settings, categories, featured] = await Promise.all([
      getSettings(["announcement", "store"]),
      listCategories({ menuOnly: true }),
      listProducts({ featuredOnly: true, sort: "best_selling", limit: 6 }),
    ]);
    return {
      announcement: settings.announcement,
      store: settings.store,
      categories: categories.map((c) => ({ slug: c.slug, name: c.name })),
      featuredProducts: featured.items.map((p) => ({ slug: p.slug, title: p.title })),
    };
  } catch (error) {
    // Never let the chrome (header/menu/footer) take a page down: fall back to defaults.
    console.error("[storefront] failed to load shell data", error);
    return {
      announcement: DEFAULT_SETTINGS.announcement,
      store: DEFAULT_SETTINGS.store,
      categories: [],
      featuredProducts: [],
    };
  }
}

/** Header, menu and footer data — cached and tagged for on-demand revalidation. */
export const getShellData = unstable_cache(loadShell, ["shell-data"], {
  tags: [TAGS.catalog, TAGS.settings],
  revalidate: 300,
});
