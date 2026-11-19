import type { Permission } from "@repo/shared";
import type { Route } from "next";

export type NavIcon =
  | "dashboard"
  | "orders"
  | "products"
  | "categories"
  | "reviews"
  | "customers"
  | "messages"
  | "users"
  | "settings"
  | "audit";

export type NavItem = {
  label: string;
  href: Route;
  icon: NavIcon;
  permission: Permission;
  /** Optional key into the sidebar badge counts. */
  badge?: "orders" | "reviews" | "messages";
  children?: { label: string; href: Route; permission: Permission }[];
};

export type NavSection = { title: string; items: NavItem[] };

/** Sidebar structure (admin-layout-notes.md); filtered by permission before rendering. */
export const NAV: NavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/", icon: "dashboard", permission: "dashboard:view" }],
  },
  {
    title: "Store",
    items: [
      {
        label: "Orders",
        href: "/orders" as Route,
        icon: "orders",
        permission: "orders:view",
        badge: "orders",
      },
      {
        label: "Products",
        href: "/products" as Route,
        icon: "products",
        permission: "products:view",
      },
      {
        label: "Categories",
        href: "/categories" as Route,
        icon: "categories",
        permission: "categories:view",
      },
      {
        label: "Reviews",
        href: "/reviews" as Route,
        icon: "reviews",
        permission: "reviews:view",
        badge: "reviews",
      },
      {
        label: "Customers",
        href: "/customers" as Route,
        icon: "customers",
        permission: "customers:view",
      },
      {
        label: "Messages",
        href: "/messages" as Route,
        icon: "messages",
        permission: "messages:view",
        badge: "messages",
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        label: "Users & Roles",
        href: "/users",
        icon: "users",
        permission: "users:view",
        children: [
          { label: "Users", href: "/users", permission: "users:view" },
          { label: "Roles & permissions", href: "/roles", permission: "roles:view" },
        ],
      },
      {
        label: "Settings",
        href: "/settings" as Route,
        icon: "settings",
        permission: "settings:view",
        children: [
          { label: "Store details", href: "/settings" as Route, permission: "settings:view" },
          {
            label: "Shipping & payments",
            href: "/settings/commerce" as Route,
            permission: "settings:view",
          },
          {
            label: "Homepage & announcement",
            href: "/settings/homepage" as Route,
            permission: "settings:view",
          },
        ],
      },
      { label: "Audit log", href: "/audit", icon: "audit", permission: "audit:view" },
    ],
  },
];

export function filterNav(can: (p: Permission) => boolean): NavSection[] {
  return NAV.map((section) => ({
    ...section,
    items: section.items
      .filter((item) => can(item.permission) || item.children?.some((c) => can(c.permission)))
      .map((item) => ({ ...item, children: item.children?.filter((c) => can(c.permission)) })),
  })).filter((s) => s.items.length > 0);
}

/** Title for the top bar, from the current path. */
export function titleFor(pathname: string): string {
  const exact: Record<string, string> = {
    "/": "Dashboard",
    "/roles": "Roles & permissions",
    "/account": "Profile",
    "/account/password": "Change password",
  };
  if (exact[pathname]) return exact[pathname];
  for (const section of NAV) {
    for (const item of section.items) {
      for (const c of item.children ?? []) if (pathname === c.href) return c.label;
      if (item.href !== "/" && pathname.startsWith(item.href)) return item.label;
    }
  }
  if (pathname.startsWith("/roles")) return "Roles & permissions";
  return "Admin";
}
