"use client";

import { formatMoney } from "@repo/shared";
import { BadgeCheck, Leaf, RotateCcw, Truck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Route } from "next";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { Button } from "@/components/ui/button";
import type { ProductPayload } from "@/lib/product-payload";
import { routes } from "@/lib/routes";
import { useAddToCart } from "@/lib/use-add-to-cart";
import { Price } from "./price";
import { ProductGallery } from "./product-gallery";
import { Stars } from "./stars";
import { VariantPicker, useVariantSelection } from "./variant-picker";

type Props = {
  product: ProductPayload;
  ratingAvg: number;
  ratingCount: number;
  freeShippingLabel: string;
  /** Server-rendered accordions (description, dimensions, shipping, care). */
  details: ReactNode;
};

/** PDP above-the-fold: gallery + purchase panel sharing the variant selection (PLAN §5.6). */
export function ProductView({
  product,
  ratingAvg,
  ratingCount,
  freeShippingLabel,
  details,
}: Props) {
  const { selection, select, variant, isAvailable } = useVariantSelection(product);
  const [qty, setQty] = useState(1);
  const { status, addToCart } = useAddToCart();
  const router = useRouter();
  const galleryRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  const soldOut = !variant || variant.stockQty <= 0;
  const max = Math.max(1, Math.min(variant?.stockQty ?? 1, 20));
  const quantity = Math.min(qty, max);
  const image = product.images.find((i) => i.id === variant?.imageId) ?? product.images[0];

  // Sticky add-to-cart bar once the main button scrolls out of view.
  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) =>
      setShowSticky(entry ? !entry.isIntersecting && entry.boundingClientRect.top < 0 : false),
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const add = () =>
    variant &&
    addToCart({
      variantId: variant.id,
      quantity,
      sourceEl: galleryRef.current,
      imageUrl: image?.url ?? null,
    });

  const buyNow = () => {
    if (!variant) return;
    router.push(`${routes.checkout}?buy=${variant.id}&qty=${quantity}` as Route);
  };

  return (
    <>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
        <div ref={galleryRef}>
          <ProductGallery
            images={product.images}
            activeId={variant?.imageId ?? null}
            title={product.title}
          />
        </div>

        <div className="lg:pt-4">
          <p className="text-ink-muted text-xs tracking-[0.12em] uppercase">{product.brand}</p>
          <h1 className="font-display text-display-lg mt-2 italic">{product.title}</h1>
          {ratingCount > 0 ? (
            <a
              href="#reviews"
              className="mt-3 inline-flex items-center gap-2 text-sm hover:underline"
            >
              <Stars rating={ratingAvg} />
              <span className="text-ink-muted">
                {ratingAvg.toFixed(1)} · {ratingCount} {ratingCount === 1 ? "review" : "reviews"}
              </span>
            </a>
          ) : null}
          <Price
            cents={variant?.priceCents ?? product.variants[0]?.priceCents ?? 0}
            compareAtCents={variant?.compareAtPriceCents}
            size="lg"
            className="mt-5"
          />
          <p className="text-ink-muted mt-5 leading-relaxed">{product.summary}</p>

          <div className="mt-8">
            <VariantPicker
              product={product}
              selection={selection}
              onSelect={select}
              isAvailable={isAvailable}
            />
          </div>

          <div className="mt-6 flex items-center gap-3 text-sm" aria-live="polite">
            <span
              className={`size-2 rounded-full ${soldOut ? "bg-danger" : variant.stockQty <= 3 ? "bg-warning" : "bg-success"}`}
              aria-hidden
            />
            {soldOut ? (
              <span className="text-danger">Sold out</span>
            ) : variant.stockQty <= 3 ? (
              <span className="text-warning-ink">Only {variant.stockQty} left — order soon</span>
            ) : (
              <span>In stock, ready to ship</span>
            )}
            {variant ? (
              <span className="text-ink-muted ml-auto text-xs">SKU {variant.sku}</span>
            ) : null}
          </div>

          <div ref={buttonRef} className="mt-6 flex gap-3">
            <QuantityStepper
              value={quantity}
              max={max}
              onChange={setQty}
              label={`Quantity of ${product.title}`}
            />
            <AddToCartButton
              status={status}
              disabled={soldOut}
              onClick={() => void add()}
              label={soldOut ? "Sold out" : "Add to cart"}
              className="flex-1"
            />
          </div>
          <Button
            variant="secondary"
            size="lg"
            block
            className="mt-3"
            disabled={soldOut}
            onClick={buyNow}
          >
            Buy it now
          </Button>

          <ul className="border-border mt-8 grid gap-3 border-y py-6 text-sm sm:grid-cols-2">
            <li className="flex items-center gap-3">
              <Truck className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />{" "}
              {freeShippingLabel}
            </li>
            <li className="flex items-center gap-3">
              <RotateCcw className="size-4 shrink-0" strokeWidth={1.5} aria-hidden /> 30-day easy
              returns
            </li>
            <li className="flex items-center gap-3">
              <BadgeCheck className="size-4 shrink-0" strokeWidth={1.5} aria-hidden /> Quality
              checked by hand
            </li>
            <li className="flex items-center gap-3">
              <Leaf className="size-4 shrink-0" strokeWidth={1.5} aria-hidden /> Plastic-free
              packaging
            </li>
          </ul>

          <div className="mt-2">{details}</div>
        </div>
      </div>

      <AnimatePresence>
        {showSticky ? (
          <motion.div
            className="bg-bg/95 border-border fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-md"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="container-site flex items-center gap-4 py-3">
              {image ? (
                <div className="bg-surface-muted relative hidden size-12 shrink-0 overflow-hidden rounded-xs sm:block">
                  <Image src={image.url} alt="" fill sizes="48px" className="object-cover" />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="font-display truncate text-lg italic">{product.title}</p>
                <p className="text-ink-muted text-xs">
                  {formatMoney((variant?.priceCents ?? 0) * quantity)}
                </p>
              </div>
              <AddToCartButton
                status={status}
                disabled={soldOut}
                onClick={() => void add()}
                label={soldOut ? "Sold out" : "Add to cart"}
                size="md"
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
