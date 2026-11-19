import { getSettings, listCategories, listFeaturedReviews, listProducts } from "@repo/db";
import { BRAND, DEFAULT_SETTINGS } from "@repo/shared";
import { CategoryShowcase } from "@/components/home/category-showcase";
import { type CollectionTab, FeaturedCollections } from "@/components/home/featured-collections";
import { Hero } from "@/components/home/hero";
import { KitchenEditorial } from "@/components/home/kitchen-editorial";
import { NewsletterBand } from "@/components/home/newsletter-band";
import { ProductCarousel } from "@/components/home/product-carousel";
import { StoryTeaser } from "@/components/home/story-teaser";
import { Testimonials } from "@/components/home/testimonials";
import { ValuesStrip } from "@/components/home/values-strip";

export const revalidate = 300;

async function loadHome() {
  try {
    const [settings, categories, bestSellers, kitchen, reviews] = await Promise.all([
      getSettings(["hero", "shipping", "store"]),
      listCategories(),
      listProducts({ sort: "best_selling", limit: 10 }),
      listProducts({ categorySlug: "kitchen-tools", sort: "best_selling", limit: 4 }),
      listFeaturedReviews(8),
    ]);
    const tabs: CollectionTab[] = await Promise.all(
      categories.slice(0, 4).map(async (c) => ({
        slug: c.slug,
        name: c.name,
        products: (await listProducts({ categorySlug: c.slug, sort: "featured", limit: 4 })).items,
      })),
    );
    return {
      settings,
      categories,
      tabs,
      bestSellers: bestSellers.items,
      kitchen: kitchen.items,
      reviews,
    };
  } catch (error) {
    console.error("[home] failed to load data", error);
    return {
      settings: {
        hero: DEFAULT_SETTINGS.hero,
        shipping: DEFAULT_SETTINGS.shipping,
        store: DEFAULT_SETTINGS.store,
      },
      categories: [],
      tabs: [],
      bestSellers: [],
      kitchen: [],
      reviews: [],
    };
  }
}

export default async function HomePage() {
  const { settings, categories, tabs, bestSellers, kitchen, reviews } = await loadHome();
  return (
    <>
      <Hero hero={settings.hero} />
      {tabs.length ? <FeaturedCollections tabs={tabs} /> : null}
      {categories.length ? <CategoryShowcase categories={categories} /> : null}
      <ValuesStrip freeShippingThresholdCents={settings.shipping.freeShippingThresholdCents} />
      <StoryTeaser storeName={settings.store.name || BRAND.name} />
      {kitchen.length ? <KitchenEditorial products={kitchen} /> : null}
      <ProductCarousel eyebrow="Most loved" title="Best sellers" products={bestSellers} />
      {reviews.length ? <Testimonials reviews={reviews} /> : null}
      <NewsletterBand />
    </>
  );
}
