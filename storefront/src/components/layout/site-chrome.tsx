"use client";

import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { Toaster } from "sonner";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { QuickAddSheet } from "@/components/cart/quick-add-sheet";
import { SearchOverlay } from "@/components/search/search-overlay";
import type { ShellData } from "@/lib/data";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { HERO_ROUTES } from "@/lib/routes";
import { useOverlay } from "@/stores/ui";
import { ANNOUNCEMENT_HEIGHT, AnnouncementBar } from "./announcement-bar";
import { HEADER_HEIGHT, Header } from "./header";
import { MenuOverlay } from "./menu-overlay";

const DISMISS_KEY = "majestic-announcement-dismissed";
const HIDE_AFTER = 160;

// Session-scoped "announcement dismissed" flag as a tiny external store (hydration-safe).
const dismissListeners = new Set<() => void>();
const dismissedStore = {
  subscribe: (cb: () => void) => {
    dismissListeners.add(cb);
    return () => dismissListeners.delete(cb);
  },
  get: (): boolean => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  },
  dismiss: () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Storage unavailable — the bar still hides for this page view via the listeners below.
    }
    dismissedOverride = true;
    dismissListeners.forEach((l) => l());
  },
};
let dismissedOverride = false;

/**
 * Fixed top chrome: announcement marquee + header. Behaviour (PLAN §5.1):
 * transparent over a dark hero → solid off-white with blur + hairline after scrolling;
 * hides on scroll down and reappears on scroll up; the bar slides away once scrolled.
 */
export function SiteChrome({ data }: { data: ShellData }) {
  const pathname = usePathname();
  const overHero = HERO_ROUTES.includes(pathname);
  const { open, setOpen } = useOverlay();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const dismissed = useSyncExternalStore(
    dismissedStore.subscribe,
    () => dismissedOverride || dismissedStore.get(),
    () => false,
  );

  const showBar = data.announcement.enabled && data.announcement.messages.length > 0 && !dismissed;
  const barHeight = showBar ? ANNOUNCEMENT_HEIGHT : 0;

  // Pages without a hero offset their content by the chrome height.
  useEffect(() => {
    document.documentElement.style.setProperty("--shell-offset", `${barHeight + HEADER_HEIGHT}px`);
  }, [barHeight]);

  // Admin setting: open the cart drawer automatically after adding (read by useAddToCart).
  useEffect(() => {
    document.documentElement.dataset.cartAutoOpen = String(data.payments.autoOpenCartOnAdd);
  }, [data.payments.autoOpenCartOnAdd]);

  // Close overlays on navigation.
  useEffect(() => {
    setOpen(null);
  }, [pathname, setOpen]);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 8);
    if (y < HIDE_AFTER) setHidden(false);
    else if (Math.abs(y - prev) > 4) setHidden(y > prev);
  });

  const menuOpen = open === "menu";
  const transparent = overHero && !scrolled;
  const offset = hidden && !menuOpen ? -(barHeight + HEADER_HEIGHT + 1) : scrolled ? -barHeight : 0;

  return (
    <>
      <motion.div
        className="fixed inset-x-0 top-0 z-40"
        initial={false}
        animate={{ y: offset }}
        transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
      >
        {showBar ? (
          <AnnouncementBar
            messages={data.announcement.messages}
            dismissible={data.announcement.dismissible}
            onDismiss={dismissedStore.dismiss}
          />
        ) : null}
        <Header
          storeName={data.store.name}
          transparent={transparent}
          menuOpen={menuOpen}
          onToggleMenu={() => setOpen(menuOpen ? null : "menu")}
          onOpenSearch={() => setOpen("search")}
        />
      </motion.div>

      <MenuOverlay open={menuOpen} onOpenChange={(v) => setOpen(v ? "menu" : null)} data={data} />
      <SearchOverlay
        open={open === "search"}
        onOpenChange={(v) => setOpen(v ? "search" : null)}
        suggestions={data.categories}
      />
      <QuickAddSheet />
      <CartDrawer freeShippingThresholdCents={data.shipping.freeShippingThresholdCents} />
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#1F2A1A",
            color: "#F7F5EF",
            border: "none",
            borderRadius: 4,
            fontFamily: "var(--font-sans)",
          },
        }}
      />
    </>
  );
}

/** Main content wrapper; adds the chrome offset on pages that don't start with a hero. */
export function MainContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const overHero = HERO_ROUTES.includes(pathname);
  return (
    <main
      id="main"
      tabIndex={-1}
      className="min-h-[60svh] outline-none"
      style={overHero ? undefined : { paddingTop: "var(--shell-offset, 100px)" }}
    >
      {children}
    </main>
  );
}
