"use client";

import { ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog } from "radix-ui";
import { useEffect, useId, useState } from "react";
import { FacebookIcon, InstagramIcon, XIcon } from "@/components/icons";
import { useLenis } from "@/components/providers/smooth-scroll";
import { cn } from "@/lib/cn";
import type { ShellData } from "@/lib/data";
import { EASE_OUT_EXPO, STAGGER, transition } from "@/lib/motion";
import { routes } from "@/lib/routes";
import { BRAND } from "@repo/shared";
import { MENU_TOGGLE_ID } from "./hamburger";
import { MENU_ID } from "./header";

type MenuOverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ShellData;
};

type LinkGroup = { heading: string; links: { label: string; href: Route }[] };

function buildGroups(data: ShellData): LinkGroup[] {
  return [
    {
      heading: "Categories",
      links: [
        ...data.categories.map((c) => ({ label: c.name, href: routes.category(c.slug) })),
        { label: "All categories", href: routes.categories },
      ],
    },
    {
      heading: "Collections",
      links: [
        { label: "New Arrivals", href: routes.newArrivals },
        { label: "Best Sellers", href: routes.bestSellers },
        { label: "Featured", href: routes.featured },
        { label: "Shop All", href: routes.shop },
      ],
    },
    {
      heading: "Products",
      links: data.featuredProducts.map((p) => ({ label: p.title, href: routes.product(p.slug) })),
    },
    {
      heading: "Pages",
      links: [
        { label: "About", href: routes.about },
        { label: "Contact", href: routes.contact },
        { label: "Track Order", href: routes.track },
        { label: "Shipping & Returns", href: routes.shipping },
        { label: "FAQ", href: routes.faq },
      ],
    },
  ].filter((g) => g.links.length > 0);
}

const SOCIALS = [
  { label: "Instagram", href: BRAND.social.instagram, Icon: InstagramIcon },
  { label: "X", href: BRAND.social.x, Icon: XIcon },
  { label: "Facebook", href: BRAND.social.facebook, Icon: FacebookIcon },
] as const;

/**
 * Full-page menu (ref-2): huge uppercase links with dividers on the left, multi-column link
 * panel on the right, socials + copyright bottom-left, white square close button top-right.
 * Radix Dialog provides the focus trap, Esc to close, scroll lock and focus return.
 */
export function MenuOverlay({ open, onOpenChange, data }: MenuOverlayProps) {
  const reduced = useReducedMotion() ?? false;
  const pathname = usePathname();
  const lenis = useLenis();
  const panelId = useId();
  // Desktop: the right panel is shown by default (CATEGORIES is the "owner" link, as FEATURES in
  // ref-2). Mobile: it is an accordion, collapsed by default.
  const [panelOpen, setPanelOpen] = useState(true);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const groups = buildGroups(data);

  useEffect(() => {
    const l = lenis();
    if (open) l?.stop();
    else l?.start();
  }, [open, lenis]);

  const close = () => onOpenChange(false);
  const isActive = (href: string) =>
    href === pathname || (href !== "/" && pathname.startsWith(href));

  const primary: { label: string; href: Route }[] = [
    { label: "Home", href: routes.home },
    { label: "Shop", href: routes.shop },
  ];
  const trailing: { label: string; href: Route }[] = [
    { label: "About", href: routes.about },
    { label: "Contact", href: routes.contact },
  ];

  const linkReveal = {
    hidden: reduced ? { opacity: 0 } : { y: "105%" },
    visible: (i: number) => ({
      ...(reduced ? { opacity: 1 } : { y: "0%" }),
      transition: transition(0.8, 0.25 + i * STAGGER.loose),
    }),
  };
  const columnReveal = {
    hidden: { opacity: 0, y: reduced ? 0 : 18 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: transition(0.7, 0.45 + i * STAGGER.base),
    }),
  };

  const bigLink =
    "font-menu text-menu block py-[0.2em] uppercase transition-colors duration-300 hover:text-on-strong focus-visible:text-on-strong";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Content
              forceMount
              asChild
              aria-describedby={undefined}
              onCloseAutoFocus={(e) => {
                // The toggle lives outside the dialog, so restore focus to it explicitly.
                e.preventDefault();
                document.getElementById(MENU_TOGGLE_ID)?.focus();
              }}
            >
              <motion.div
                id={MENU_ID}
                className="bg-menu-bg text-on-strong fixed inset-0 z-50 flex overflow-hidden"
                initial={reduced ? { opacity: 0 } : { clipPath: "inset(0% 0% 100% 0%)" }}
                animate={reduced ? { opacity: 1 } : { clipPath: "inset(0% 0% 0% 0%)" }}
                exit={
                  reduced
                    ? { opacity: 0 }
                    : {
                        clipPath: "inset(0% 0% 100% 0%)",
                        transition: { duration: 0.55, ease: EASE_OUT_EXPO },
                      }
                }
                transition={{ duration: 0.75, ease: EASE_OUT_EXPO }}
              >
                <Dialog.Title className="sr-only">Site menu</Dialog.Title>

                <Dialog.Close
                  className="bg-surface text-ink hover:bg-primary-soft absolute top-0.5 right-0.5 z-10 flex size-12 items-center justify-center transition-colors"
                  aria-label="Close menu"
                >
                  <X className="size-6" strokeWidth={1.5} aria-hidden />
                </Dialog.Close>

                {/* Left column */}
                <nav
                  aria-label="Main"
                  data-lenis-prevent
                  className="flex w-full flex-col overflow-y-auto px-5 pt-16 pb-6 md:px-8 lg:w-[40%] lg:max-w-[720px] lg:min-w-[480px] lg:border-r lg:border-white/25 lg:pt-[4.5rem]"
                >
                  <ul className="w-full max-w-[34rem]">
                    {primary.map((item, i) => (
                      <li key={item.label} className="overflow-hidden border-b border-white/25">
                        <motion.div
                          custom={i}
                          variants={linkReveal}
                          initial="hidden"
                          animate="visible"
                        >
                          <Link
                            href={item.href}
                            onClick={close}
                            aria-current={isActive(item.href) ? "page" : undefined}
                            className={cn(
                              bigLink,
                              isActive(item.href) ? "text-on-strong" : "text-menu-ink-muted",
                            )}
                          >
                            {item.label}
                          </Link>
                        </motion.div>
                      </li>
                    ))}

                    <li className="border-b border-white/25">
                      <div className="overflow-hidden">
                        <motion.div
                          custom={2}
                          variants={linkReveal}
                          initial="hidden"
                          animate="visible"
                        >
                          {/* Desktop: toggles the right panel */}
                          <button
                            type="button"
                            aria-expanded={panelOpen}
                            aria-controls={panelId}
                            onClick={() => setPanelOpen((v) => !v)}
                            className={cn(
                              bigLink,
                              "hidden w-full items-center gap-4 text-left lg:flex",
                              panelOpen ? "text-on-strong" : "text-menu-ink-muted",
                            )}
                          >
                            Categories
                            <ChevronRight
                              className={cn(
                                "size-8 transition-transform duration-500",
                                panelOpen && "translate-x-1",
                              )}
                              strokeWidth={1.25}
                              aria-hidden
                            />
                          </button>
                          {/* Mobile: accordion */}
                          <button
                            type="button"
                            aria-expanded={mobileExpanded}
                            aria-controls={`${panelId}-mobile`}
                            onClick={() => setMobileExpanded((v) => !v)}
                            className={cn(
                              bigLink,
                              "flex w-full items-center justify-between gap-4 text-left lg:hidden",
                              mobileExpanded ? "text-on-strong" : "text-menu-ink-muted",
                            )}
                          >
                            Categories
                            <ChevronRight
                              className={cn(
                                "size-7 transition-transform duration-500",
                                mobileExpanded && "rotate-90",
                              )}
                              strokeWidth={1.25}
                              aria-hidden
                            />
                          </button>
                        </motion.div>
                      </div>
                      <AnimatePresence initial={false}>
                        {mobileExpanded ? (
                          <motion.div
                            id={`${panelId}-mobile`}
                            className="overflow-hidden lg:hidden"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={transition(0.5)}
                          >
                            <div className="grid grid-cols-2 gap-x-6 gap-y-8 pt-4 pb-8">
                              {groups.map((g) => (
                                <LinkColumn key={g.heading} group={g} onNavigate={close} compact />
                              ))}
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </li>

                    {trailing.map((item, i) => (
                      <li
                        key={item.label}
                        className={cn(
                          "overflow-hidden",
                          i < trailing.length - 1 && "border-b border-white/25",
                        )}
                      >
                        <motion.div
                          custom={3 + i}
                          variants={linkReveal}
                          initial="hidden"
                          animate="visible"
                        >
                          <Link
                            href={item.href}
                            onClick={close}
                            aria-current={isActive(item.href) ? "page" : undefined}
                            className={cn(
                              bigLink,
                              isActive(item.href) ? "text-on-strong" : "text-menu-ink-muted",
                            )}
                          >
                            {item.label}
                          </Link>
                        </motion.div>
                      </li>
                    ))}
                  </ul>

                  <motion.div
                    className="mt-auto pt-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: transition(0.6, 0.7) }}
                  >
                    <ul className="flex gap-3">
                      {SOCIALS.map(({ label, href, Icon }) => (
                        <li key={label}>
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${data.store.name} on ${label}`}
                            className="bg-surface text-ink flex size-[42px] items-center justify-center rounded-full transition-transform duration-300 hover:scale-105"
                          >
                            <Icon className="size-[18px]" />
                          </a>
                        </li>
                      ))}
                    </ul>
                    <p className="text-menu-ink-muted mt-4 text-sm">
                      © {new Date().getFullYear()} {data.store.name}. All rights reserved.
                    </p>
                  </motion.div>
                </nav>

                {/* Right panel (desktop) */}
                <AnimatePresence>
                  {panelOpen ? (
                    <motion.div
                      id={panelId}
                      key="panel"
                      data-lenis-prevent
                      className="hidden flex-1 overflow-y-auto px-16 pt-[6.75rem] pb-16 lg:block xl:px-20"
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, transition: { duration: 0.25 } }}
                    >
                      <div className="grid max-w-[900px] grid-cols-3 gap-x-12 gap-y-20">
                        {groups.map((g, i) => (
                          <motion.div key={g.heading} custom={i} variants={columnReveal}>
                            <LinkColumn group={g} onNavigate={close} />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function LinkColumn({
  group,
  onNavigate,
  compact = false,
}: {
  group: LinkGroup;
  onNavigate: () => void;
  compact?: boolean;
}) {
  return (
    <div>
      <h2
        className={cn(
          "text-on-strong font-sans leading-none font-normal tracking-[-0.01em] uppercase",
          compact ? "text-base" : "text-[1.75rem]",
        )}
      >
        {group.heading}
      </h2>
      <ul className={cn(compact ? "mt-3 space-y-2" : "mt-6 space-y-[0.9rem]")}>
        {group.links.map((l) => (
          <li key={`${l.label}-${l.href}`}>
            <Link
              href={l.href}
              onClick={onNavigate}
              className={cn(
                "text-menu-ink-muted hover:text-on-strong focus-visible:text-on-strong transition-colors duration-300",
                compact ? "text-sm" : "text-[1.0625rem]",
              )}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
