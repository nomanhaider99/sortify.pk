# Storefront Layout Notes (ref-1 → ref-4)

Observations from the reference images in the project root, and how each maps to our storefront.
**Colors in the references are ignored** — we always use the tokens from PLAN.md §4.1. Brand names,
logos and copy in the references ("Edward Langford", "Majestic", demo link labels) are placeholders
and are never copied; our wordmark comes from the `BRAND` constant in `@repo/shared`.

---

## ref-1.png — Header (→ `storefront/src/components/layout/header.tsx`, M2)

**Observed (1350px wide capture, header ≈ 68px tall):**

- Header is fully transparent and sits _on top of_ a dark photographic hero; all header content is
  light-colored for contrast.
- Three-zone layout on one row, vertically centred:
  - **Left:** text wordmark in uppercase geometric sans, medium weight, ~15px, slight letter-spacing.
    Left padding ≈ 20px from the viewport edge.
  - **Center:** hamburger — three thin (≈1.5px) horizontal lines, ≈26px wide, ≈6–7px apart. It is
    absolutely centred on the viewport, not centred between the side groups.
  - **Right:** `ENGLISH (USD $)` locale/currency label in uppercase ~14px medium, followed by a thin
    chevron-down; then three outline icons (search, account, cart) at ≈22px, spaced ≈32px apart. The
    cart icon carries a tiny circular count badge (outlined, number inside) at its top-right.
    Right padding ≈ 20px.
- Icons are thin-stroke line icons (≈1.5px stroke), no fills.
- No border or background at rest.

**Mapping / our implementation:**

- 3-column CSS grid (`1fr auto 1fr`) so the hamburger is truly centred; gutters use our container
  padding (`px-5 md:px-8`), max width full-bleed (header spans the viewport like the reference).
- Wordmark = `BRAND.name` uppercase in Poppins 500, tracking `0.04em`.
- Hamburger → animated morph into an X (two lines rotate, middle fades) — it also opens the
  full-page menu (ref-2).
- Right group: locale button (display only, `ENGLISH (USD $)`, hidden < `md`), search, account, cart
  with an animated count badge (bump on add). On mobile only search + cart stay visible; account
  moves into the menu.
- States: **transparent** over hero with `--bg` (#F7F5EF) text/icons → **solid** `--bg` with
  `backdrop-blur` + 1px `--border` hairline and `--ink` text after scroll; hides on scroll down,
  reappears on scroll up. Pages without a dark hero start in the solid state.

## ref-2.png — Full-page menu overlay (→ `storefront/src/components/layout/menu-overlay.tsx`, M2)

**Observed (cropped at ≈1365×567):**

- Full-viewport near-black background (we use `--menu-bg` #141414).
- **Left column** (≈33% width, ≈450px at this size), separated from the right panel by a full-height
  1px vertical divider in mid-grey.
  - Huge uppercase heavy grotesk links (≈64px cap height, weight ~800, tight tracking −0.02em),
    stacked with ≈1px grey horizontal divider lines between them. The dividers stop short of the
    column divider (≈380px wide, left-aligned with the text).
  - Inactive links are dimmed grey (~60% white); the active/hovered link (`FEATURES ›`) is pure
    white and carries a thin `›` chevron to its right which indicates it opens the right panel.
  - Below the links: three white circular social buttons (≈42px, dark glyphs: Instagram, X,
    Facebook) with ≈12px gaps, then a small copyright line (`© 2026 … · Powered by …`).
- **Right panel:** multi-column link grid (3 columns visible, ≈290px column pitch), starting ≈80px
  right of the divider and ≈110px from the top.
  - Column headings in uppercase regular-weight sans (~28px, white).
  - Links below in ~18px regular sans, light grey (~70% white), ≈37px line pitch.
  - A second row of headings starts lower (`PAGES`, `OTHER FEATURES`) — the grid wraps.
- **Close button:** top-right, a white square (≈48px) with a thin dark X, flush with the viewport
  top/right edge (≈2px inset).

**Mapping / our implementation:**

- Left links: `HOME`, `SHOP`, `CATEGORIES ›`, `CONTACT` (Archivo 800, fluid `clamp(2.75rem, 6vw, 4.75rem)`).
  `CATEGORIES ›` toggles/reveals the right panel (it is the panel's "owner" link, like `FEATURES ›`).
- Right panel columns: `CATEGORIES` (from DB, visible + show-in-menu), `COLLECTIONS` (New Arrivals,
  Best Sellers, Featured, All Products), `PRODUCTS` (featured products from DB), `PAGES` (Contact,
  Track Order, Shipping & Returns, FAQ). 3 columns on desktop, wrap to a second row like the ref.
- Bottom-left: social circles + `© {year} {BRAND.name}` line.
- Animation: clip-path reveal from the top, staggered link reveals (60–100ms), right columns
  fade/slide in staggered; body scroll locked; focus trapped; `Esc` closes; focus returns to the
  hamburger.
- **Completed beyond the crop** (logged in PLAN §13): the reference is cut off at the bottom, so
  the left column is a full-height flex column (links top, socials + copyright pinned to the
  bottom), and the right panel scrolls independently if it overflows.
- Mobile (< `lg`): single column; the big links shrink; `CATEGORIES ›` expands an accordion holding
  the right-panel groups; socials + copyright at the bottom.

## ref-3.png — Home hero (→ `storefront/src/components/home/hero.tsx`, M3; marquee in M2)

**Observed:**

- **Announcement bar** at the very top: thin (≈24px) near-black strip with a continuously scrolling
  marquee of short messages in ~13px sans, separated by wide gaps (≈100px).
- Navigation row below it sits over the hero image (dark translucent), wordmark left in a light
  serif, inline nav links centre, region/currency + icons right, with a hairline bottom border.
  _We keep the ref-1 header layout (hamburger centre) per the plan; only the transparent-over-image
  feel and hairline are taken from this ref._
- **Hero:** full-bleed photographic interior, darkened with an overlay so white text reads well.
  Content centred both ways:
  - Line 1: italic serif, ~56px, "Make Your House"-style lead-in (smaller).
  - Line 2: italic serif, ~84px, the main headline (larger), tight leading.
  - Subcopy: 2 lines, ~16px light sans, centred, max width ≈ 480px, ≈40px below the headline.
  - CTA: white rectangular button (≈185×44, 2px radius), uppercase ~14px dark text, ≈24px below.

**Mapping:** hero copy, CTA and image come from `settings.hero` (seeded, editable in admin).
Overlay is a dark gradient; text uses `--bg` (#F7F5EF) — allowed by the contrast rule (light text
on dark photo with overlay). Button: surface-white with `--ink` text, hover fills `--primary-strong`
with `--bg` text. Display font: Cormorant Garamond italic. Headline lines use `<RevealText>`; image
has a slow zoom + `<Parallax>`.

## ref-4.png — Featured Collections grid (→ `storefront/src/components/home/featured-collections.tsx`, M3; card in M4)

**Observed:**

- Section heading centred, italic serif ~30px, dark grey.
- Pill tabs centred below (≈40px gap): `Chairs / Living Room / Bedroom / Dining Room`, ~13px light sans.
  The active tab has a 1px dark outline in a full pill shape (≈60×26); inactive tabs have no border.
- **4-column grid** spanning nearly the full width with tiny gutters (≈14px) and ≈28px side margins.
- Cards: product image centred on a very light, flat muted tile (portrait, ≈4:5 — 315×372), very
  small radius (~4px), no shadow. Below the tile, ≈12px padding-left:
  - Brand label ~11px sans, muted grey.
  - Product name in italic serif ~15px, dark grey.
  - Price ~11px sans `$1,099.00 USD`, muted.

**Mapping:** tabs = the first four categories (Side & Accent Tables, Vases & Decor, Candles & Lighting, Cookware); active outline animated with a shared `layoutId`.
Tiles use `--surface-muted` (#F1EEE6). Brand label = product `brand` (defaults to `BRAND.name`),
name in Cormorant Garamond italic, price formatted by `formatMoney()` (`$1,099.00 USD`). Grid:
2 cols mobile / 3 tablet / 4 desktop, gap 14–16px. Hover: second image crossfade + Quick Add slides
up (M4/M5).

---

## Global spacing & feel taken from all refs

- Full-bleed sections with narrow side gutters (20–28px) for header and grids; text content uses a
  max container of 1440px.
- Typography pairs: italic high-contrast serif for display, light geometric sans (Poppins) for UI,
  heavy grotesk for the menu.
- Hairlines only, almost no shadows, radii 2–4px (pills fully rounded).
