"use client";

import { ChevronDown, KeyRound, LogOut, Menu, Search, ShieldOff, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog, DropdownMenu } from "radix-ui";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Toaster } from "sonner";
import { signOutAction, signOutEverywhereAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/cn";
import { titleFor, type NavSection } from "@/lib/nav";
import { CommandPalette, type QuickAction } from "./command-palette";
import { Sidebar } from "./sidebar";

const COLLAPSE_KEY = "admin-sidebar-collapsed";
const collapseListeners = new Set<() => void>();
const collapseStore = {
  subscribe: (cb: () => void) => {
    collapseListeners.add(cb);
    return () => collapseListeners.delete(cb);
  },
  get: () => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  },
  set: (v: boolean) => {
    try {
      localStorage.setItem(COLLAPSE_KEY, v ? "1" : "0");
    } catch {
      // ignore — preference just won't persist
    }
    collapseListeners.forEach((l) => l());
  },
};

type Props = {
  user: { name: string; email: string; roleName: string };
  nav: NavSection[];
  counts: { orders: number; reviews: number; messages: number };
  actions: QuickAction[];
  children: ReactNode;
};

export function AppShell({ user, nav, counts, actions, children }: Props) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(collapseStore.subscribe, collapseStore.get, () => false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-svh">
      <a
        href="#admin-main"
        className="bg-primary-strong text-on-strong rounded-control fixed top-2 left-2 z-[60] -translate-y-20 px-3 py-2 text-sm focus:translate-y-0"
      >
        Skip to content
      </a>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "bg-surface border-border sticky top-0 hidden h-svh shrink-0 border-r transition-[width] duration-300 lg:block",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        <Sidebar
          nav={nav}
          counts={counts}
          collapsed={collapsed}
          onToggle={() => collapseStore.set(!collapsed)}
        />
      </aside>

      {/* Mobile sidebar */}
      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="bg-ink/40 fixed inset-0 z-50 lg:hidden" />
          <Dialog.Content
            aria-describedby={undefined}
            className="bg-surface fixed inset-y-0 left-0 z-50 w-72 shadow-xl lg:hidden"
          >
            <Dialog.Title className="sr-only">Navigation</Dialog.Title>
            <Dialog.Close
              className="text-ink-muted rounded-control absolute top-4 right-3 p-1.5"
              aria-label="Close navigation"
            >
              <X className="size-4" aria-hidden />
            </Dialog.Close>
            <Sidebar
              nav={nav}
              counts={counts}
              collapsed={false}
              onNavigate={() => setMobileOpen(false)}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="bg-surface/90 border-border sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur md:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="text-ink-muted hover:bg-surface-muted rounded-control p-2 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <h1 className="truncate text-xl font-semibold">{titleFor(pathname)}</h1>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="bg-surface-muted text-ink-muted hover:text-ink hidden h-9 w-64 items-center gap-2 rounded-full px-3 text-sm md:flex"
            >
              <Search className="size-4" aria-hidden />
              <span className="flex-1 text-left">Search</span>
              <kbd className="border-border bg-surface rounded border px-1.5 text-[0.65rem]">
                Ctrl K
              </kbd>
            </button>
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="text-ink-muted hover:bg-surface-muted rounded-control p-2 md:hidden"
              aria-label="Search"
            >
              <Search className="size-5" aria-hidden />
            </button>
            <ThemeToggle />
            <DropdownMenu.Root>
              <DropdownMenu.Trigger className="hover:bg-surface-muted flex items-center gap-2 rounded-full py-1 pr-2 pl-1">
                <span className="bg-primary-soft text-accent-ink flex size-8 items-center justify-center rounded-full text-xs font-semibold">
                  {initials}
                </span>
                <span className="hidden text-left text-sm leading-tight sm:block">
                  <span className="block font-medium">{user.name}</span>
                  <span className="text-ink-muted block text-xs">{user.roleName}</span>
                </span>
                <ChevronDown className="text-ink-muted size-3.5" aria-hidden />
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={8}
                  className="bg-surface border-border rounded-card z-50 min-w-56 border p-1.5 text-sm shadow-lg"
                >
                  <div className="px-3 py-2">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-ink-muted text-xs">{user.email}</p>
                  </div>
                  <DropdownMenu.Separator className="bg-border my-1 h-px" />
                  <DropdownMenu.Item asChild>
                    <Link
                      href="/account"
                      className="data-[highlighted]:bg-surface-muted rounded-control flex items-center gap-2 px-3 py-2 outline-none"
                    >
                      <UserRound className="size-4" aria-hidden /> Profile
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link
                      href="/account/password"
                      className="data-[highlighted]:bg-surface-muted rounded-control flex items-center gap-2 px-3 py-2 outline-none"
                    >
                      <KeyRound className="size-4" aria-hidden /> Change password
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="bg-border my-1 h-px" />
                  <DropdownMenu.Item
                    onSelect={() => void signOutEverywhereAction()}
                    className="data-[highlighted]:bg-surface-muted rounded-control flex cursor-pointer items-center gap-2 px-3 py-2 outline-none"
                  >
                    <ShieldOff className="size-4" aria-hidden /> Sign out everywhere
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onSelect={() => void signOutAction()}
                    className="text-danger data-[highlighted]:bg-surface-muted rounded-control flex cursor-pointer items-center gap-2 px-3 py-2 outline-none"
                  >
                    <LogOut className="size-4" aria-hidden /> Sign out
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>

        <main id="admin-main" className="flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        nav={nav}
        actions={actions}
      />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--surface)",
            color: "var(--ink)",
            border: "1px solid var(--border)",
          },
        }}
      />
    </div>
  );
}
