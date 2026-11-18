"use client";

import { BRAND } from "@repo/shared";
import { ChevronDown, Search, UserRound } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { CartButton } from "./cart-button";
import { Hamburger } from "./hamburger";

export const HEADER_HEIGHT = 68;
export const MENU_ID = "site-menu";
export const SEARCH_TOGGLE_ID = "search-toggle";

type HeaderProps = {
  storeName: string;
  /** Transparent with light text (over a dark hero) vs. solid off-white. */
  transparent: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onOpenSearch: () => void;
};

/**
 * Storefront header — layout from ref-1: wordmark left, hamburger truly centred, locale +
 * search + account + cart right.
 */
export function Header({
  storeName,
  transparent,
  menuOpen,
  onToggleMenu,
  onOpenSearch,
}: HeaderProps) {
  return (
    <header
      className={cn(
        "ease-out-expo grid grid-cols-[1fr_auto_1fr] items-center border-b px-5 transition-[background-color,color,border-color,backdrop-filter] duration-500 md:px-8",
        transparent
          ? "text-on-strong border-transparent bg-transparent"
          : "text-ink border-border bg-bg/85 backdrop-blur-md",
      )}
      style={{ height: HEADER_HEIGHT }}
    >
      <div className="flex items-center">
        <Link
          href={routes.home}
          className="text-[0.9375rem] font-medium tracking-[0.04em] whitespace-nowrap uppercase"
        >
          {storeName}
          <span className="sr-only"> — home</span>
        </Link>
      </div>

      <Hamburger open={menuOpen} onClick={onToggleMenu} controls={MENU_ID} />

      <div className="flex items-center justify-end gap-1 sm:gap-3 lg:gap-5">
        <span className="mr-2 hidden items-center gap-2 text-sm font-medium tracking-[0.02em] whitespace-nowrap uppercase md:inline-flex">
          <span className="sr-only">Language and currency: </span>
          {BRAND.localeLabel}
          <ChevronDown className="size-4" strokeWidth={1.5} aria-hidden />
        </span>
        <button
          id={SEARCH_TOGGLE_ID}
          type="button"
          onClick={onOpenSearch}
          aria-label="Search"
          className="inline-flex size-10 items-center justify-center transition-opacity duration-300 hover:opacity-70"
        >
          <Search className="size-[22px]" strokeWidth={1.5} aria-hidden />
        </button>
        <Link
          href={routes.account}
          aria-label="Account"
          className="hidden size-10 items-center justify-center transition-opacity duration-300 hover:opacity-70 sm:inline-flex"
        >
          <UserRound className="size-[22px]" strokeWidth={1.5} aria-hidden />
        </Link>
        <CartButton />
      </div>
    </header>
  );
}
