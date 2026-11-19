"use client";

import { formatMoney } from "@repo/shared";
import { ShoppingBag, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { useEffect } from "react";
import { useLenis } from "@/components/providers/smooth-scroll";
import { Button } from "@/components/ui/button";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { routes } from "@/lib/routes";
import { useCartSync } from "@/lib/use-cart-sync";
import { useHydrated } from "@/lib/use-hydrated";
import { selectCartCount, selectSubtotal, useCart } from "@/stores/cart";
import { CartLineItem } from "./cart-line-item";
import { FreeShippingBar } from "./free-shipping-bar";

/** Slide-in cart drawer (PLAN §5.1). */
export function CartDrawer({ freeShippingThresholdCents }: { freeShippingThresholdCents: number }) {
  const open = useCart((s) => s.drawerOpen);
  const close = useCart((s) => s.closeDrawer);
  const lines = useCart((s) => s.lines);
  const lastAddedId = useCart((s) => s.lastAddedId);
  const subtotal = useCart(selectSubtotal);
  const count = useCart(selectCartCount);
  const hydrated = useHydrated();
  const reduced = useReducedMotion() ?? false;
  const lenis = useLenis();
  useCartSync(open);

  useEffect(() => {
    const l = lenis();
    if (open) l?.stop();
    else l?.start();
  }, [open, lenis]);

  return (
    <Dialog.Root open={open && hydrated} onOpenChange={(v) => !v && close()}>
      <AnimatePresence>
        {open && hydrated ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay forceMount asChild>
              <motion.div
                className="bg-ink/40 fixed inset-0 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              forceMount
              asChild
              aria-describedby={undefined}
              onCloseAutoFocus={(e) => {
                e.preventDefault();
                document.querySelector<HTMLElement>("[data-cart-target]")?.focus();
              }}
            >
              <motion.aside
                className="bg-bg fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col"
                initial={reduced ? { opacity: 0 } : { x: "100%" }}
                animate={reduced ? { opacity: 1 } : { x: 0 }}
                exit={
                  reduced
                    ? { opacity: 0 }
                    : { x: "100%", transition: { duration: 0.4, ease: EASE_OUT_EXPO } }
                }
                transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
              >
                <header className="border-border flex items-center justify-between border-b px-6 py-5">
                  <Dialog.Title className="font-display text-2xl italic">
                    Your cart{" "}
                    <span className="text-ink-muted font-sans text-sm not-italic">({count})</span>
                  </Dialog.Title>
                  <Dialog.Close
                    className="hover:bg-primary-soft flex size-10 items-center justify-center rounded-full"
                    aria-label="Close cart"
                  >
                    <X className="size-5" strokeWidth={1.5} aria-hidden />
                  </Dialog.Close>
                </header>

                {lines.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                    <ShoppingBag className="text-primary size-10" strokeWidth={1.25} aria-hidden />
                    <p className="font-display mt-4 text-2xl italic">Your cart is empty</p>
                    <p className="text-ink-muted mt-2 text-sm">
                      Handmade decor and kitchen essentials are waiting.
                    </p>
                    <Button asChild className="mt-7">
                      <Link href={routes.shop} onClick={close}>
                        Start shopping
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="border-border border-b px-6 py-4">
                      <FreeShippingBar
                        subtotalCents={subtotal}
                        thresholdCents={freeShippingThresholdCents}
                      />
                    </div>
                    <ul data-lenis-prevent className="flex-1 overflow-y-auto px-6">
                      <AnimatePresence initial={false}>
                        {lines.map((l) => (
                          <CartLineItem
                            key={l.variantId}
                            line={l}
                            highlight={l.variantId === lastAddedId}
                            onNavigate={close}
                          />
                        ))}
                      </AnimatePresence>
                    </ul>
                    <footer className="border-border space-y-4 border-t px-6 py-5">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm">Subtotal</span>
                        <span className="text-lg">{formatMoney(subtotal)}</span>
                      </div>
                      <p className="text-ink-muted text-xs">
                        Shipping and any fees are calculated at checkout.
                      </p>
                      <div className="grid gap-2.5">
                        <Button asChild block>
                          <Link href={routes.checkout} onClick={close}>
                            Checkout
                          </Link>
                        </Button>
                        <Button asChild block variant="secondary">
                          <Link href={routes.cart} onClick={close}>
                            View cart
                          </Link>
                        </Button>
                      </div>
                    </footer>
                  </>
                )}
              </motion.aside>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
