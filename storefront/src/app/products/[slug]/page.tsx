import { getProductBySlug, getSettings, listApprovedReviews, listProducts } from "@repo/db";
import { BRAND, formatMoney } from "@repo/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReviewDTO } from "@/app/api/reviews/route";
import { ProductCarousel } from "@/components/home/product-carousel";
import { ProductView } from "@/components/product/product-view";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { ReviewsSection } from "@/components/product/reviews-section";
import { Accordion } from "@/components/ui/accordion";
import { Container } from "@/components/ui/container";
import { toProductPayload } from "@/lib/product-payload";
import { routes } from "@/lib/routes";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  const image = product.images[0];
  return {
    title: product.seoTitle?.replace(` | ${BRAND.name}`, "") ?? product.title,
    description: product.seoDescription ?? product.summary,
    alternates: { canonical: routes.product(product.slug) },
    openGraph: {
      title: product.title,
      description: product.summary,
      type: "website",
      images: image ? [{ url: image.url, alt: image.alt }] : [],
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const category = product.categories[0];
  const [reviews, related, settings] = await Promise.all([
    listApprovedReviews(product.id, { limit: 6 }),
    category
      ? listProducts({ categorySlug: category.slug, sort: "best_selling", limit: 9 })
      : Promise.resolve({ items: [], total: 0 }),
    getSettings(["shipping"]),
  ]);
  const payload = toProductPayload(product);
  const prices = product.variants.map((v) => v.priceCents);
  const inStock = product.variants.some((v) => v.stockQty > 0);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.summary,
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: product.brand },
    image: product.images.map((i) => new URL(i.url, siteUrl).toString()),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: (Math.min(...prices) / 100).toFixed(2),
      highPrice: (Math.max(...prices) / 100).toFixed(2),
      offerCount: product.variants.length,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(product.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.ratingAvg.toFixed(2),
            reviewCount: product.ratingCount,
          },
        }
      : {}),
  };

  const initialReviews: ReviewDTO[] = reviews.map((r) => ({
    id: r.id,
    customerName: r.customerName,
    rating: r.rating,
    title: r.title,
    body: r.body,
    isVerifiedPurchase: r.isVerifiedPurchase,
    ownerReply: r.ownerReply,
    createdAt: r.createdAt.toISOString(),
  }));

  const ship = settings.shipping;
  const details = (
    <Accordion
      defaultOpen="description"
      items={[
        { id: "description", title: "Description", content: <p>{product.description}</p> },
        {
          id: "dimensions",
          title: "Dimensions & Materials",
          content: (
            <dl className="grid gap-3">
              {product.details.dimensions ? (
                <div>
                  <dt className="text-ink font-medium">Dimensions</dt>
                  <dd>{product.details.dimensions}</dd>
                </div>
              ) : null}
              {product.details.materials ? (
                <div>
                  <dt className="text-ink font-medium">Materials</dt>
                  <dd>{product.details.materials}</dd>
                </div>
              ) : null}
            </dl>
          ),
        },
        {
          id: "shipping",
          title: "Shipping & Returns",
          content: (
            <div className="space-y-2">
              <p>
                Standard delivery ({ship.standardEta}): {formatMoney(ship.standardCents)} — free on
                orders over {formatMoney(ship.freeShippingThresholdCents)}.
              </p>
              <p>
                Express delivery ({ship.expressEta}): {formatMoney(ship.expressCents)}.
              </p>
              <p>Not quite right? Return it unused within 30 days for a full refund.</p>
            </div>
          ),
        },
        { id: "care", title: "Care", content: <p>{product.details.care}</p> },
      ]}
    />
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Container className="pt-8 md:pt-12">
        <nav aria-label="Breadcrumb" className="text-ink-muted mb-6 text-xs">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href={routes.home} className="hover:text-ink">
                Home
              </Link>
            </li>
            {category ? (
              <li className="flex items-center gap-2">
                <span aria-hidden>/</span>
                <Link href={routes.category(category.slug)} className="hover:text-ink">
                  {category.name}
                </Link>
              </li>
            ) : null}
            <li className="flex items-center gap-2">
              <span aria-hidden>/</span>
              <span aria-current="page" className="text-ink">
                {product.title}
              </span>
            </li>
          </ol>
        </nav>
        <ProductView
          product={payload}
          ratingAvg={product.ratingAvg}
          ratingCount={product.ratingCount}
          freeShippingLabel={`Free shipping over ${formatMoney(ship.freeShippingThresholdCents, "USD", { withCode: false })}`}
          details={details}
        />
      </Container>

      <Container className="border-border mt-24 border-t pt-20">
        <ReviewsSection
          productId={product.id}
          productTitle={product.title}
          ratingAvg={product.ratingAvg}
          ratingCount={product.ratingCount}
          breakdown={product.ratingBreakdown}
          initial={initialReviews}
        />
      </Container>

      <ProductCarousel
        eyebrow={category?.name}
        title="You may also like"
        products={related.items.filter((p) => p.id !== product.id).slice(0, 8)}
      />
      <RecentlyViewed
        current={{
          slug: product.slug,
          title: product.title,
          image: product.images[0]?.url ?? null,
          priceCents: Math.min(...prices),
        }}
      />
    </>
  );
}
