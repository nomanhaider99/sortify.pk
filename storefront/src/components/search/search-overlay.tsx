"use client";

import { formatMoney } from "@repo/shared";
import { ArrowRight, Search, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { useEffect, useState } from "react";
import type { SearchResponse } from "@/app/api/search/route";
import { useLenis } from "@/components/providers/smooth-scroll";
import { Spinner } from "@/components/ui/spinner";
import { EASE_OUT_EXPO, transition } from "@/lib/motion";
import { routes } from "@/lib/routes";
import { SEARCH_TOGGLE_ID } from "@/components/layout/header";

type SearchOverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: { slug: string; name: string }[];
};

const EMPTY: SearchResponse = { products: [], categories: [] };

/** Full-width search overlay with debounced, server-side instant results. */
export function SearchOverlay({ open, onOpenChange, suggestions }: SearchOverlayProps) {
  const reduced = useReducedMotion() ?? false;
  const router = useRouter();
  const lenis = useLenis();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse>(EMPTY);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const q = query.trim();

  useEffect(() => {
    const l = lenis();
    if (open) l?.stop();
    else l?.start();
  }, [open, lenis]);

  useEffect(() => {
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setStatus("loading");
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((r) =>
          r.ok
            ? (r.json() as Promise<SearchResponse>)
            : Promise.reject(new Error(String(r.status))),
        )
        .then((data) => {
          setResults(data);
          setStatus("done");
        })
        .catch((e: unknown) => {
          if (!(e instanceof DOMException && e.name === "AbortError")) setStatus("error");
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  const close = () => onOpenChange(false);
  const submit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (q.length < 2) return;
    close();
    router.push(routes.search(q));
  };
  const showResults = q.length >= 2;
  const hasResults = results.products.length > 0 || results.categories.length > 0;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setQuery("");
          setResults(EMPTY);
          setStatus("idle");
        }
      }}
    >
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay forceMount asChild>
              <motion.div
                className="bg-ink/40 fixed inset-0 z-50 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={transition(0.4)}
              />
            </Dialog.Overlay>
            <Dialog.Content
              forceMount
              asChild
              aria-describedby={undefined}
              onCloseAutoFocus={(e) => {
                e.preventDefault();
                document.getElementById(SEARCH_TOGGLE_ID)?.focus();
              }}
            >
              <motion.div
                className="bg-bg text-ink fixed inset-x-0 top-0 z-50 max-h-[90svh] overflow-y-auto shadow-[0_24px_60px_-30px_rgb(31_42_26/0.35)]"
                data-lenis-prevent
                initial={reduced ? { opacity: 0 } : { y: "-100%" }}
                animate={reduced ? { opacity: 1 } : { y: 0 }}
                exit={
                  reduced
                    ? { opacity: 0 }
                    : { y: "-100%", transition: { duration: 0.4, ease: EASE_OUT_EXPO } }
                }
                transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
              >
                <Dialog.Title className="sr-only">Search the store</Dialog.Title>
                <div className="container-site py-6 md:py-10">
                  <form
                    onSubmit={submit}
                    role="search"
                    className="border-ink flex items-center gap-3 border-b pb-3"
                  >
                    <Search className="size-6 shrink-0" strokeWidth={1.5} aria-hidden />
                    <label htmlFor="site-search" className="sr-only">
                      Search products and categories
                    </label>
                    <input
                      id="site-search"
                      type="search"
                      autoFocus
                      autoComplete="off"
                      placeholder="Search sofas, oak, lounge chairs…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      maxLength={60}
                      className="font-display placeholder:text-ink-muted min-w-0 flex-1 appearance-none bg-transparent text-[clamp(1.5rem,1rem+2vw,2.5rem)] italic outline-none [&::-webkit-search-cancel-button]:hidden"
                    />
                    {status === "loading" ? <Spinner label="Searching" /> : null}
                    <Dialog.Close
                      className="hover:bg-primary-soft flex size-10 shrink-0 items-center justify-center rounded-xs"
                      aria-label="Close search"
                    >
                      <X className="size-5" strokeWidth={1.5} aria-hidden />
                    </Dialog.Close>
                  </form>

                  <div aria-live="polite" className="sr-only">
                    {showResults && status === "done"
                      ? `${results.products.length} products and ${results.categories.length} categories found`
                      : ""}
                  </div>

                  <div className="pt-8">
                    {!showResults ? (
                      <SuggestionList suggestions={suggestions} onNavigate={close} />
                    ) : status === "error" ? (
                      <p className="text-ink-muted">
                        Search is unavailable right now. Please try again.
                      </p>
                    ) : !hasResults && status !== "done" ? (
                      <p className="text-ink-muted">Searching…</p>
                    ) : !hasResults ? (
                      <div>
                        <p className="text-ink-muted">No results for “{q}”.</p>
                        <div className="mt-6">
                          <SuggestionList suggestions={suggestions} onNavigate={close} />
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-10 lg:grid-cols-[1fr_220px]">
                        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                          {results.products.map((p, i) => (
                            <motion.li
                              key={p.slug}
                              initial={{ opacity: 0, y: reduced ? 0 : 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={transition(0.5, i * 0.05)}
                            >
                              <Link
                                href={routes.product(p.slug)}
                                onClick={close}
                                className="group block"
                              >
                                <div className="bg-surface-muted relative aspect-[4/5] overflow-hidden rounded-xs">
                                  {p.image ? (
                                    <Image
                                      src={p.image.url}
                                      alt={p.image.alt}
                                      fill
                                      sizes="(min-width: 1024px) 14vw, (min-width: 640px) 30vw, 45vw"
                                      className="ease-out-expo object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                  ) : null}
                                </div>
                                <p className="font-display mt-2 text-base italic">{p.title}</p>
                                <p className="text-ink-muted text-xs">
                                  {formatMoney(p.priceCents)}
                                </p>
                              </Link>
                            </motion.li>
                          ))}
                        </ul>
                        <div>
                          {results.categories.length ? (
                            <>
                              <h3 className="text-ink-muted text-xs tracking-[0.12em] uppercase">
                                Categories
                              </h3>
                              <ul className="mt-3 space-y-2">
                                {results.categories.map((c) => (
                                  <li key={c.slug}>
                                    <Link
                                      href={routes.category(c.slug)}
                                      onClick={close}
                                      className="hover:text-primary-strong font-display text-xl italic"
                                    >
                                      {c.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </>
                          ) : null}
                          <button
                            type="button"
                            onClick={submit}
                            className="text-primary-strong mt-6 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
                          >
                            View all results <ArrowRight className="size-4" aria-hidden />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function SuggestionList({
  suggestions,
  onNavigate,
}: {
  suggestions: { slug: string; name: string }[];
  onNavigate: () => void;
}) {
  if (!suggestions.length) return null;
  return (
    <div>
      <h3 className="text-ink-muted text-xs tracking-[0.12em] uppercase">Popular categories</h3>
      <ul className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <li key={s.slug}>
            <Link
              href={routes.category(s.slug)}
              onClick={onNavigate}
              className="border-border hover:border-ink inline-flex h-9 items-center rounded-full border px-4 text-sm transition-colors"
            >
              {s.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
