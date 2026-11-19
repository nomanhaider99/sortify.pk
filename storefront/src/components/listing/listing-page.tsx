import { getListingFacets, listProducts } from "@repo/db";
import type { Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RevealText } from "@/components/motion/reveal-text";
import { ProductCard } from "@/components/product/product-card";
import { Container } from "@/components/ui/container";
import { parseListingParams, toListQuery, type SearchParams } from "@/lib/listing-params";
import { routes } from "@/lib/routes";
import { FilterSidebar } from "./filters";
import { ListingToolbar, LoadMore } from "./listing-toolbar";

type Props = {
  title: string;
  description?: string;
  categorySlug?: string;
  breadcrumb: { label: string; href?: Route }[];
  searchParams: SearchParams;
};

/** Shared listing template for /products and /categories/[slug] (PLAN §5.5). */
export async function ListingPage({
  title,
  description,
  categorySlug,
  breadcrumb,
  searchParams,
}: Props) {
  const parsed = parseListingParams(searchParams);
  const facets = await getListingFacets(categorySlug);
  const { items, total } = await listProducts(
    toListQuery(parsed, Object.keys(facets.options), categorySlug),
  );

  return (
    <Container className="pb-section pt-10 md:pt-14">
      <nav aria-label="Breadcrumb" className="text-ink-muted text-xs">
        <ol className="flex flex-wrap items-center gap-2">
          {breadcrumb.map((b, i) => (
            <li key={b.label} className="flex items-center gap-2">
              {i > 0 ? <span aria-hidden>/</span> : null}
              {b.href ? (
                <Link href={b.href} className="hover:text-ink">
                  {b.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-ink">
                  {b.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <header className="mt-6 max-w-2xl">
        <RevealText
          as="h1"
          immediate
          text={title}
          className="font-display text-display-xl italic"
        />
        {description ? <p className="text-ink-muted mt-4 leading-relaxed">{description}</p> : null}
      </header>

      <div className="mt-12 flex gap-12">
        <Suspense>
          <FilterSidebar facets={facets.options} />
        </Suspense>
        <div className="min-w-0 flex-1">
          <Suspense>
            <ListingToolbar total={total} facets={facets.options} />
          </Suspense>
          {items.length ? (
            <ul className="mt-8 grid grid-cols-2 gap-x-3.5 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
              {items.map((p, i) => (
                <li
                  key={p.id}
                  className="animate-[fade-up_0.7s_var(--ease-out-expo)_both] motion-reduce:animate-none"
                  style={{ animationDelay: `${(i % 12) * 50}ms` }}
                >
                  <ProductCard
                    product={p}
                    sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw"
                    priority={i < 4}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="bg-surface-muted mt-8 rounded-sm px-6 py-20 text-center">
              <p className="font-display text-2xl italic">Nothing matches those filters</p>
              <p className="text-ink-muted mt-2 text-sm">
                Try removing a filter or browse everything we make.
              </p>
              <Link
                href={routes.shop}
                className="text-primary-strong mt-6 inline-block text-sm underline underline-offset-4"
              >
                Shop all products
              </Link>
            </div>
          )}
          <Suspense>
            <LoadMore shown={items.length} total={total} />
          </Suspense>
        </div>
      </div>
    </Container>
  );
}
