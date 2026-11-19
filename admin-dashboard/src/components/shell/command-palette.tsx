"use client";

import type { AdminSearchResult } from "@repo/db/admin";
import { formatMoney } from "@repo/shared";
import { Command } from "cmdk";
import { CornerDownLeft, FileText, Package, Search, ShoppingCart, UserRound } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { useEffect, useState, useTransition } from "react";
import { searchAdmin } from "@/app/actions/search";
import type { NavSection } from "@/lib/nav";

export type QuickAction = { label: string; href: Route };

/** ⌘K / Ctrl+K palette: jump to pages, orders, products, customers; quick actions. */
export function CommandPalette({
  open,
  onOpenChange,
  nav,
  actions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nav: NavSection[];
  actions: QuickAction[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminSearchResult>({
    orders: [],
    products: [],
    customers: [],
  });
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const t = setTimeout(() => startTransition(async () => setResults(await searchAdmin(q))), 200);
    return () => clearTimeout(t);
  }, [query]);

  const go = (href: string) => {
    onOpenChange(false);
    setQuery("");
    router.push(href as Route);
  };
  const pages = nav.flatMap((s) =>
    s.items.flatMap((i) =>
      i.children?.length
        ? i.children.map((c) => ({ label: c.label, href: c.href }))
        : [{ label: i.label, href: i.href }],
    ),
  );
  const showResults = query.trim().length >= 2;
  const item =
    "flex cursor-pointer items-center gap-3 rounded-control px-3 py-2 text-sm aria-selected:bg-primary-soft aria-selected:text-accent-ink";
  const group =
    "[&_[cmdk-group-heading]]:text-ink-muted [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-[0.6875rem] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-[0.12em] [&_[cmdk-group-heading]]:uppercase";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-ink/40 fixed inset-0 z-50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="bg-surface border-border rounded-card fixed top-[12svh] left-1/2 z-50 w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden border shadow-2xl"
        >
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Command shouldFilter={!showResults} loop>
            <div className="border-border flex items-center gap-3 border-b px-4">
              <Search className="text-ink-muted size-4" aria-hidden />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search orders, products, customers or jump to a page…"
                className="h-12 flex-1 bg-transparent text-sm outline-none"
              />
              {pending ? <span className="text-ink-muted text-xs">Searching…</span> : null}
            </div>
            <Command.List className="max-h-[60svh] overflow-y-auto p-2">
              <Command.Empty className="text-ink-muted px-3 py-6 text-center text-sm">
                No results.
              </Command.Empty>
              {showResults && results.orders.length ? (
                <Command.Group heading="Orders" className={group}>
                  {results.orders.map((o) => (
                    <Command.Item
                      key={o.orderNumber}
                      value={`order ${o.orderNumber} ${o.email}`}
                      onSelect={() => go(`/orders/${o.orderNumber}`)}
                      className={item}
                    >
                      <ShoppingCart className="size-4" aria-hidden />
                      <span className="font-medium">{o.orderNumber}</span>
                      <span className="text-ink-muted truncate">{o.email}</span>
                      <span className="text-ink-muted ml-auto text-xs capitalize">
                        {o.status.replace(/_/g, " ")} ·{" "}
                        {formatMoney(o.totalCents, "USD", { withCode: false })}
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              ) : null}
              {showResults && results.products.length ? (
                <Command.Group heading="Products" className={group}>
                  {results.products.map((p) => (
                    <Command.Item
                      key={p.id}
                      value={`product ${p.title}`}
                      onSelect={() => go(`/products/${p.id}`)}
                      className={item}
                    >
                      <Package className="size-4" aria-hidden />
                      {p.title}
                      <span className="text-ink-muted ml-auto text-xs capitalize">{p.status}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              ) : null}
              {showResults && results.customers.length ? (
                <Command.Group heading="Customers" className={group}>
                  {results.customers.map((c) => (
                    <Command.Item
                      key={c.id}
                      value={`customer ${c.name} ${c.email}`}
                      onSelect={() => go(`/customers/${c.id}`)}
                      className={item}
                    >
                      <UserRound className="size-4" aria-hidden />
                      {c.name || c.email}
                      <span className="text-ink-muted ml-auto text-xs">{c.email}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              ) : null}
              {actions.length ? (
                <Command.Group heading="Quick actions" className={group}>
                  {actions.map((a) => (
                    <Command.Item
                      key={a.href}
                      value={`action ${a.label}`}
                      onSelect={() => go(a.href)}
                      className={item}
                    >
                      <CornerDownLeft className="size-4" aria-hidden />
                      {a.label}
                    </Command.Item>
                  ))}
                </Command.Group>
              ) : null}
              <Command.Group heading="Pages" className={group}>
                {pages.map((p) => (
                  <Command.Item
                    key={p.href + p.label}
                    value={`page ${p.label}`}
                    onSelect={() => go(p.href)}
                    className={item}
                  >
                    <FileText className="size-4" aria-hidden />
                    {p.label}
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
