"use client";

import { BRAND } from "@repo/shared";
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { NavSection } from "@/lib/nav";
import { NavIcon } from "./nav-icon";

type Counts = { orders: number; reviews: number; messages: number };

/**
 * Sidebar per admin-dashboard-design.webp: logo + collapse button, small-caps section labels,
 * icon + label rows with a soft active pill, expandable groups with dotted children.
 */
export function Sidebar({
  nav,
  counts,
  collapsed,
  onToggle,
  onNavigate,
}: {
  nav: NavSection[];
  counts: Counts;
  collapsed: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  // A child is active on its exact path, or on sub-paths unless it shares the parent's href.
  const childActive = (parentHref: string, href: string) =>
    pathname === href || (href !== parentHref && pathname.startsWith(`${href}/`));

  return (
    <nav aria-label="Admin" className="flex h-full flex-col">
      <div className={cn("flex h-16 items-center gap-2 px-5", collapsed && "justify-center px-0")}>
        <span className="bg-primary-strong text-on-strong rounded-control flex size-8 shrink-0 items-center justify-center text-sm font-semibold">
          {BRAND.name.charAt(0)}
        </span>
        {!collapsed ? (
          <span className="flex-1 truncate font-semibold">{BRAND.name} Admin</span>
        ) : null}
        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "text-ink-muted hover:bg-surface-muted hover:text-ink rounded-control p-1.5",
              collapsed && "hidden",
            )}
          >
            <PanelLeftClose className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {nav.map((section) => (
          <div key={section.title}>
            {!collapsed ? (
              <p className="text-ink-muted mb-2 px-3 text-[0.6875rem] font-medium tracking-[0.12em] uppercase">
                {section.title}
              </p>
            ) : (
              <div className="border-border mx-3 mb-2 border-t" />
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href) || item.children?.some((c) => isActive(c.href));
                const badge = item.badge ? counts[item.badge] : 0;
                const expandable = !collapsed && item.children && item.children.length > 1;
                const expanded = open[item.label] ?? Boolean(active);
                return (
                  <li key={item.label}>
                    <div className="relative flex items-center">
                      <Link
                        href={item.children?.[0]?.href ?? item.href}
                        onClick={onNavigate}
                        title={collapsed ? item.label : undefined}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "rounded-control flex h-9 flex-1 items-center gap-3 px-3 text-sm transition-colors",
                          collapsed && "justify-center px-0",
                          active
                            ? "bg-primary-soft text-accent-ink font-medium"
                            : "text-ink-muted hover:bg-surface-muted hover:text-ink",
                        )}
                      >
                        <NavIcon name={item.icon} className="size-[18px] shrink-0" />
                        {!collapsed ? <span className="flex-1 truncate">{item.label}</span> : null}
                        {badge > 0 ? (
                          <span
                            className={cn(
                              "bg-primary-strong text-on-strong min-w-5 rounded-full px-1.5 text-center text-[0.6875rem] leading-5",
                              collapsed &&
                                "absolute top-0.5 right-1 min-w-4 px-1 text-[0.6rem] leading-4",
                            )}
                            aria-label={`${badge} need attention`}
                          >
                            {badge > 99 ? "99+" : badge}
                          </span>
                        ) : null}
                      </Link>
                      {expandable ? (
                        <button
                          type="button"
                          onClick={() => setOpen((o) => ({ ...o, [item.label]: !expanded }))}
                          aria-expanded={expanded}
                          aria-label={`${expanded ? "Collapse" : "Expand"} ${item.label}`}
                          className="text-ink-muted hover:text-ink rounded-control absolute right-1 p-1.5"
                        >
                          <ChevronDown
                            className={cn(
                              "size-3.5 transition-transform",
                              expanded && "rotate-180",
                            )}
                            aria-hidden
                          />
                        </button>
                      ) : null}
                    </div>
                    {expandable && expanded ? (
                      <ul className="mt-0.5 mb-1 space-y-0.5 pl-9">
                        {item.children?.map((c) => (
                          <li key={c.href}>
                            <Link
                              href={c.href}
                              onClick={onNavigate}
                              aria-current={childActive(item.href, c.href) ? "page" : undefined}
                              className={cn(
                                "rounded-control flex h-8 items-center gap-2.5 px-2 text-[0.8125rem] transition-colors",
                                childActive(item.href, c.href)
                                  ? "text-accent-ink font-medium"
                                  : "text-ink-muted hover:text-ink",
                              )}
                            >
                              <span
                                className={cn(
                                  "size-1.5 rounded-full",
                                  childActive(item.href, c.href) ? "bg-accent-ink" : "bg-border",
                                )}
                                aria-hidden
                              />
                              {c.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {collapsed && onToggle ? (
        <button
          type="button"
          onClick={onToggle}
          aria-label="Expand sidebar"
          className="text-ink-muted hover:text-ink border-border rounded-control mx-3 mb-4 flex h-9 items-center justify-center border"
        >
          <PanelLeftOpen className="size-4" aria-hidden />
        </button>
      ) : null}
    </nav>
  );
}
