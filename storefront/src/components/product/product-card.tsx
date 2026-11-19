"use client";

import type { ProductCard as ProductCardData } from "@repo/db";
import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { useAddToCart } from "@/lib/use-add-to-cart";
import { useQuickAdd } from "@/stores/quick-add";
import { Spinner } from "@/components/ui/spinner";
import { Price } from "./price";

type Props = {
  product: ProductCardData;
  /** `sizes` for the image (defaults to a 4-col grid). */
  sizes?: string;
  priority?: boolean;
};

/**
 * Product card (ref-4): muted tile with the product image, brand label, italic serif name and
 * price. Hover: second image crossfades in and Quick Add slides up. Mobile: persistent "+" button.
 */
export function ProductCard({
  product,
  sizes = "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw",
  priority,
}: Props) {
  const imageRef = useRef<HTMLDivElement>(null);
  const openQuickAdd = useQuickAdd((s) => s.open);
  const { status, addToCart } = useAddToCart();
  const [primary, secondary] = product.images;
  const onSale =
    product.compareAtPriceCents != null && product.compareAtPriceCents > product.priceCents;

  const quickAdd = () => {
    if (!product.inStock) return;
    if (product.singleVariantId) {
      void addToCart({
        variantId: product.singleVariantId,
        quantity: 1,
        sourceEl: imageRef.current,
        imageUrl: primary?.url ?? null,
      });
    } else {
      openQuickAdd(product.slug, imageRef.current);
    }
  };

  const quickLabel = !product.inStock
    ? "Sold out"
    : product.singleVariantId
      ? "Quick add"
      : "Choose options";

  return (
    <article className="group/card relative">
      <div
        ref={imageRef}
        className="bg-surface-muted relative aspect-[4/5] overflow-hidden rounded-sm"
      >
        <div className="absolute inset-0">
          {primary ? (
            <Image
              src={primary.url}
              alt=""
              fill
              sizes={sizes}
              priority={priority}
              className="ease-out-expo object-cover transition-[transform,opacity] duration-700 group-hover/card:scale-[1.03]"
            />
          ) : null}
          {secondary ? (
            <Image
              src={secondary.url}
              alt=""
              fill
              sizes={sizes}
              className="ease-out-expo object-cover opacity-0 transition-opacity duration-700 group-hover/card:opacity-100"
            />
          ) : null}
        </div>

        <div className="pointer-events-none absolute top-3 left-3 flex flex-col gap-1.5">
          {!product.inStock ? (
            <span className="bg-ink text-bg rounded-xs px-2 py-1 text-[0.65rem] font-medium tracking-[0.1em] uppercase">
              Sold out
            </span>
          ) : onSale ? (
            <span className="bg-danger text-on-strong rounded-xs px-2 py-1 text-[0.65rem] font-medium tracking-[0.1em] uppercase">
              Sale
            </span>
          ) : product.isNew ? (
            <span className="bg-primary text-ink rounded-xs px-2 py-1 text-[0.65rem] font-medium tracking-[0.1em] uppercase">
              New
            </span>
          ) : null}
        </div>

        {/* Desktop Quick Add — slides up on hover/focus */}
        <div className="ease-out-expo absolute inset-x-3 bottom-3 z-10 hidden translate-y-[calc(100%+0.75rem)] transition-transform duration-500 group-focus-within/card:translate-y-0 group-hover/card:translate-y-0 md:block">
          <button
            type="button"
            onClick={quickAdd}
            disabled={!product.inStock || status === "loading"}
            className="bg-surface/95 text-ink hover:bg-primary-strong hover:text-on-strong flex h-11 w-full items-center justify-center gap-2 rounded-xs text-xs font-medium tracking-[0.1em] uppercase backdrop-blur transition-colors disabled:opacity-70"
          >
            {status === "loading" ? (
              <Spinner label="Adding" />
            ) : status === "added" ? (
              "Added ✓"
            ) : (
              quickLabel
            )}
            <span className="sr-only"> — {product.title}</span>
          </button>
        </div>

        {/* Mobile "+" */}
        {product.inStock ? (
          <button
            type="button"
            onClick={quickAdd}
            aria-label={`${quickLabel}: ${product.title}`}
            className="bg-surface text-ink absolute right-2.5 bottom-2.5 z-10 flex size-9 items-center justify-center rounded-full shadow-sm md:hidden"
          >
            {status === "loading" ? (
              <Spinner label="Adding" />
            ) : (
              <Plus className="size-4" aria-hidden />
            )}
          </button>
        ) : null}
      </div>

      <div className="px-1 pt-3">
        <p className="text-ink-muted text-[0.6875rem]">{product.brand}</p>
        <h3 className="font-display mt-0.5 text-lg leading-snug italic">
          <Link
            href={routes.product(product.slug)}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {product.title}
          </Link>
        </h3>
        <Price
          cents={product.priceCents}
          compareAtCents={product.compareAtPriceCents}
          className="text-ink-muted mt-1"
        />
        {product.swatches.length > 1 ? (
          <ul className="relative z-10 mt-2.5 flex gap-1.5" aria-label="Available colours">
            {product.swatches.map((s) => (
              <li key={s.value}>
                <span
                  title={s.value}
                  className={cn("border-border block size-3.5 rounded-full border")}
                  style={{ backgroundColor: s.hex }}
                >
                  <span className="sr-only">{s.value}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}

/** Skeleton matching the card's dimensions. */
export function ProductCardSkeleton() {
  return (
    <div aria-hidden>
      <div className="bg-surface-muted aspect-[4/5] animate-pulse rounded-sm" />
      <div className="bg-surface-muted mt-3 h-3 w-16 animate-pulse rounded-xs" />
      <div className="bg-surface-muted mt-2 h-4 w-40 animate-pulse rounded-xs" />
      <div className="bg-surface-muted mt-2 h-3 w-20 animate-pulse rounded-xs" />
    </div>
  );
}
