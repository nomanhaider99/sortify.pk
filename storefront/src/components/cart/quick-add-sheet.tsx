"use client";

import { formatMoney } from "@repo/shared";
import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { useEffect, useRef, useState } from "react";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { Price } from "@/components/product/price";
import { VariantPicker, useVariantSelection } from "@/components/product/variant-picker";
import { useLenis } from "@/components/providers/smooth-scroll";
import { Spinner } from "@/components/ui/spinner";
import { EASE_OUT_EXPO } from "@/lib/motion";
import type { ProductPayload } from "@/lib/product-payload";
import { routes } from "@/lib/routes";
import { useAddToCart } from "@/lib/use-add-to-cart";
import { useQuickAdd } from "@/stores/quick-add";

/** Quick Add modal (desktop) / bottom sheet (mobile) for multi-variant products (PLAN §5.3). */
export function QuickAddSheet() {
  const { slug, sourceEl, close } = useQuickAdd();
  const reduced = useReducedMotion() ?? false;
  const lenis = useLenis();
  const [product, setProduct] = useState<ProductPayload | null>(null);
  const [error, setError] = useState(false);
  const open = slug !== null;

  useEffect(() => {
    const l = lenis();
    if (open) l?.stop();
    else l?.start();
  }, [open, lenis]);

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    fetch(`/api/products/${slug}`, { signal: controller.signal })
      .then((r) =>
        r.ok ? (r.json() as Promise<ProductPayload>) : Promise.reject(new Error(String(r.status))),
      )
      .then(setProduct)
      .catch((e: unknown) => {
        if (!(e instanceof DOMException && e.name === "AbortError")) setError(true);
      });
    return () => controller.abort();
  }, [slug]);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          close();
          setProduct(null);
          setError(false);
        }
      }}
    >
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay forceMount asChild>
              <motion.div
                className="bg-ink/45 fixed inset-0 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content forceMount asChild aria-describedby={undefined}>
              <motion.div
                data-lenis-prevent
                className="bg-bg fixed inset-x-0 bottom-0 z-50 max-h-[92svh] overflow-y-auto rounded-t-lg md:inset-auto md:top-1/2 md:left-1/2 md:w-[min(880px,92vw)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-sm"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={
                  reduced ? { opacity: 0 } : { opacity: 0, y: 40, transition: { duration: 0.25 } }
                }
                transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
              >
                <Dialog.Close
                  className="bg-surface hover:bg-primary-soft absolute top-3 right-3 z-10 flex size-10 items-center justify-center rounded-full"
                  aria-label="Close"
                >
                  <X className="size-5" strokeWidth={1.5} aria-hidden />
                </Dialog.Close>
                {product ? (
                  <QuickAddBody product={product} sourceEl={sourceEl} onDone={close} />
                ) : (
                  <div className="flex min-h-72 items-center justify-center p-10">
                    <Dialog.Title className="sr-only">Quick add</Dialog.Title>
                    {error ? (
                      <p className="text-ink-muted">Sorry, this product couldn’t be loaded.</p>
                    ) : (
                      <Spinner label="Loading product" />
                    )}
                  </div>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function QuickAddBody({
  product,
  sourceEl,
  onDone,
}: {
  product: ProductPayload;
  sourceEl: HTMLElement | null;
  onDone: () => void;
}) {
  const { selection, select, variant, isAvailable } = useVariantSelection(product);
  const [qty, setQty] = useState(1);
  const { status, addToCart } = useAddToCart();
  const imgRef = useRef<HTMLDivElement>(null);
  const image = product.images.find((i) => i.id === variant?.imageId) ?? product.images[0];
  const max = Math.max(1, Math.min(variant?.stockQty ?? 1, 20));
  const soldOut = !variant || variant.stockQty <= 0;

  const add = async () => {
    if (!variant) return;
    const ok = await addToCart({
      variantId: variant.id,
      quantity: qty,
      // Fly from the card the user clicked if it's still on screen, else from the sheet image.
      sourceEl: sourceEl?.isConnected ? sourceEl : imgRef.current,
      imageUrl: image?.url ?? null,
    });
    if (ok) onDone();
  };

  return (
    <div className="grid md:grid-cols-2">
      <div
        ref={imgRef}
        className="bg-surface-muted relative aspect-[4/5] md:aspect-auto md:min-h-[520px]"
      >
        {image ? (
          <Image
            src={image.url}
            alt={image.alt}
            fill
            sizes="(min-width: 768px) 440px, 100vw"
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="flex flex-col p-6 md:p-9">
        <p className="text-ink-muted text-xs">{product.brand}</p>
        <Dialog.Title className="font-display mt-1 text-3xl leading-tight italic">
          {product.title}
        </Dialog.Title>
        <Price
          cents={variant?.priceCents ?? product.variants[0]?.priceCents ?? 0}
          compareAtCents={variant?.compareAtPriceCents}
          size="lg"
          className="mt-2"
        />
        <p className="text-ink-muted mt-4 text-sm">{product.summary}</p>
        <div className="mt-7">
          <VariantPicker
            product={product}
            selection={selection}
            onSelect={select}
            isAvailable={isAvailable}
            compact
          />
        </div>
        <p className="mt-4 text-sm" aria-live="polite">
          {soldOut ? (
            <span className="text-danger">This combination is sold out</span>
          ) : variant.stockQty <= 3 ? (
            <span className="text-warning-ink">Only {variant.stockQty} left</span>
          ) : (
            <span className="text-ink-muted">In stock — ready to ship</span>
          )}
        </p>
        <div className="mt-auto flex gap-3 pt-7">
          <QuantityStepper
            value={qty}
            min={1}
            max={max}
            onChange={setQty}
            label={`Quantity of ${product.title}`}
          />
          <AddToCartButton
            status={status}
            disabled={soldOut}
            onClick={() => void add()}
            label={
              soldOut
                ? "Sold out"
                : `Add to cart · ${formatMoney(variant.priceCents * qty, "USD", { withCode: false })}`
            }
            className="flex-1"
          />
        </div>
        <Link
          href={routes.product(product.slug)}
          onClick={onDone}
          className="text-primary-strong mt-4 text-center text-sm underline-offset-4 hover:underline"
        >
          View full details
        </Link>
      </div>
    </div>
  );
}
