# PLAN.md — Majestic Store (Storefront + Admin Dashboard)

> A client-showcase ecommerce platform: a modern, minimal, heavily animated storefront and a separate, secure admin dashboard (orders, products, reviews, RBAC) sharing one database.
> **Brand placeholder:** "Majestic" (home decor & kitchen essentials — small tables, vases, candles, cookware, kitchen tools, tableware). Make the brand name a single config constant so it can be renamed in one place.

---

## 0. How Claude Code Must Work (READ FIRST)

1. Work **milestone by milestone** (Section 12). Never start a milestone before the previous one passes its acceptance checks.
2. After every milestone: run `pnpm typecheck`, `pnpm lint`, `pnpm build`, then manually verify in the browser (desktop + mobile width). Fix before moving on.
3. Tick the checkboxes in this file as items are completed. If you change a decision, update this file in the same commit.
4. Commit after each milestone with a clear message (`feat(storefront): quick add drawer`).
5. **Never trust the client**: prices, totals, stock, and discounts are always recalculated on the server at checkout.
6. No placeholder `TODO` left silently. If something is deferred, list it in Section 14 (Deferred).
7. Keep components small, typed, and reusable. No `any`. Validate every input/API boundary with Zod.
8. Accessibility is required: keyboard navigation, focus traps in drawers/modals, `prefers-reduced-motion` respected, proper alt text and labels.
9. Ask me only when blocked by something that cannot be reasonably decided; otherwise decide, document in Section 13 (Decision Log), and continue.

---

## 0.1 Reference Assets (VIEW THESE BEFORE DESIGNING ANYTHING)

These files are in the project root. **Open and study each image** (you can read images directly) before building the related UI. Do not move, rename, or delete them.

| File | What it is | Used for |
|---|---|---|
| `ref-1.png` | Edward Langford header | **Storefront header** layout: logo left, hamburger center, currency selector + search + account + cart right, transparent over a hero image |
| `ref-2.png` | Edward Langford full-page menu | **Full-page menu overlay**: dark background, huge uppercase links on the left with divider lines, multi-column link panel on the right, social icons + copyright bottom-left, square close button top-right |
| `ref-3.png` | Majestic hero | **Home hero**: announcement marquee bar, nav, full-bleed interior image, two-line italic serif headline, subcopy, white "NEW COLLECTION" button |
| `ref-4.png` | Majestic "Featured Collections" | **Product grid**: italic serif heading, pill tabs (Chairs / Living Room / Bedroom / Dining Room), 4-column cards, muted tile backgrounds, brand label + italic serif name + price |
| `admin-dashboard-design.webp` | Admin dashboard design reference | **Admin dashboard layout**: sidebar, top bar, dashboard grid, cards, charts, tables, spacing and hierarchy |

**Rules for using references**
1. Match the **layout, structure, spacing, hierarchy, and interaction feel** of the references. Do **not** copy their brand names, logos, text, or imagery (e.g., "Edward Langford" and "Majestic" content is placeholder only; use our brand constant and our own copy).
2. **Always apply our color tokens (Section 4.1), never the colors in the reference images.** This applies especially to `admin-dashboard-design.webp`: reproduce its layout, but recolor it entirely with our sage/off-white palette and dark-green buttons. If the reference is dark-themed, build that as the admin **dark mode** using tokens derived from our palette (deep green-black surfaces `#141A12`/`#1B2318`, sage accents), and build the light mode from our off-white palette. Provide both with a toggle.
3. Where a reference only shows a partial view (e.g., `ref-2.png` is cropped), complete the rest sensibly following the same style and note the decision in Section 13.
4. For the admin dashboard: first write `docs/admin-layout-notes.md` describing what you observe in `admin-dashboard-design.webp` (sidebar structure, header contents, grid of cards, chart types, table style, spacing, radius, typography feel) and how each part maps to our admin pages in Section 6. Then build to those notes. The same applies to the storefront: write `docs/storefront-layout-notes.md` from `ref-1` to `ref-4` before building M2.
5. After building each referenced area, compare screenshots against the reference at desktop width and fix visible layout differences (spacing, alignment, proportions) before moving on.

---

## 1. Goals & Scope

### Phase 1 deliverables
- **Storefront pages:** Home, About, Categories (listing + category page), Products (listing + product detail), Contact — plus Cart, Checkout, Order Success, Order Tracking, Account-lite (optional login to see orders).
- **Complete purchase flow (A→Z):** browse → quick add / product-page add (with variants) → animated add-to-cart → cart drawer/page → checkout → payment (COD or demo card) → confirmation → parcel tracking.
- **Admin dashboard** (separate Next.js app in `admin-dashboard/`): dashboard analytics, orders workflow (incoming → confirmed → shipped → delivered), tracking updates, products & variants, categories, reviews moderation, customers, contact messages, users & roles (RBAC), settings, audit log.
- **Reviews loop:** customers submit reviews → owner approves in admin → approved reviews appear on the storefront.
- **Security:** authentication, authorization, RBAC with an admin who can create users and assign access levels.

### Out of scope (Phase 1)
Real payment gateway, real courier API integrations, multi-currency conversion, multi-language, wishlists, coupons/discount engine (schema may reserve space), marketplace/multi-vendor.

---

## 2. Tech Stack

| Concern | Choice |
|---|---|
| Monorepo | **pnpm workspaces** (+ optional Turborepo) |
| Framework | **Next.js (App Router, latest stable), React, TypeScript (strict)** — both apps |
| Styling | **Tailwind CSS** (v4 if stable with Next, else v3) + CSS variables for theme tokens |
| UI primitives | **shadcn/ui** (Radix) — heavily restyled to the brand; admin uses it most |
| Animation | **Motion (framer-motion)** for components/page transitions/layout animations, **Lenis** for smooth scroll, optional **GSAP ScrollTrigger** only if a specific effect needs it |
| Database | **PostgreSQL (Neon)** |
| ORM | **Drizzle ORM** + drizzle-kit migrations |
| Validation | **Zod** (shared schemas) |
| Forms | React Hook Form + Zod resolver |
| Client state | **Zustand** (cart UI state, persisted) ; server state via TanStack Query (admin) / RSC + server actions (storefront) |
| Admin auth | **Auth.js (NextAuth v5)** Credentials provider, JWT/database sessions, argon2/bcrypt password hashing |
| Admin tables/charts | TanStack Table, Recharts |
| Uploads | Cloudinary (or Vercel Blob) behind a small `storage` adapter |
| Email (optional in Phase 1) | Resend, behind a `mailer` adapter; log to console if no API key |
| Testing | Vitest (unit: pricing, RBAC), Playwright (E2E: purchase flow, admin order flow) |
| Tooling | ESLint, Prettier, Husky + lint-staged |

> Confirm the latest stable versions at install time; do not pin to old versions from memory.

---

## 3. Repository Structure

```
/
├─ PLAN.md
├─ package.json                 # workspace root
├─ pnpm-workspace.yaml
├─ .env.example
├─ packages/
│  ├─ db/                       # Drizzle schema, migrations, client, seed
│  │  ├─ src/schema/*.ts
│  │  ├─ src/client.ts
│  │  └─ src/seed.ts
│  └─ shared/                   # Zod schemas, types, constants (order statuses, permissions)
├─ storefront/                  # Customer-facing Next.js app (port 3000)
└─ admin-dashboard/             # Owner/staff Next.js app (port 3001)
```

**Connection between apps:** both import `@repo/db` and `@repo/shared` and talk to the **same Postgres database**. Admin writes (publish product, update order status, approve review); storefront reads published/approved data and writes orders, reviews (pending), contact messages. No direct HTTP dependency between the apps. Cache invalidation: storefront uses tagged `revalidateTag` + a secured revalidation webhook endpoint that admin calls after publishing changes (`REVALIDATE_SECRET`).

---

## 4. Design System

### 4.1 Colors (tokens as CSS variables, mapped into Tailwind theme)

| Token | Hex | Use |
|---|---|---|
| `--primary` | `#9CAF88` | Sage brand color: accents, badges, section backgrounds, swatch highlights |
| `--primary-strong` | `#4F6B3F` | **Buttons** (bold dark green), links on light bg |
| `--primary-strong-hover` | `#3F5A34` | Button hover/pressed |
| `--primary-soft` | `#E4EBDC` | Subtle tints, hover backgrounds |
| `--bg` | `#F7F5EF` | Page background (warm off-white) |
| `--surface` | `#FFFFFF` | Cards, drawers, inputs |
| `--surface-muted` | `#F1EEE6` | Product image tiles, alternate sections |
| `--ink` | `#1F2A1A` | Primary text (deep green-black) |
| `--ink-muted` | `#5E6659` | Secondary text |
| `--border` | `#E2DED3` | Hairlines |
| `--menu-bg` | `#141414` | Full-page menu overlay |
| `--danger` / `--warning` / `--success` | `#B3402F` / `#C98A1B` / `#4F6B3F` | Status colors |

**Contrast rule (important):** `#F7F5EF` text on `#9CAF88` fails WCAG contrast (~2:1). Therefore:
- Text on **sage `#9CAF88` backgrounds** → use `--ink` (dark).
- `#F7F5EF` text goes on **`--primary-strong` (`#4F6B3F`)**, dark photos with overlay, or `--menu-bg`.
- Buttons: filled `--primary-strong` with `#F7F5EF` text; secondary = outlined with `--ink`.
Verify all text/background pairs ≥ 4.5:1 (3:1 for large text).

### 4.2 Typography
- **Display (headings, hero, product names):** elegant serif with italic — *Cormorant Garamond*, *Playfair Display*, or *Instrument Serif* (italic used heavily like the Majestic reference). Load via `next/font`.
- **Body/UI:** *Poppins* or *Inter* (reference uses a geometric sans), 300/400/500.
- **Full-page menu big links:** heavy grotesk uppercase (e.g., *Archivo*/*Inter Tight* 800) like the reference.
- Fluid type scale with `clamp()`.

### 4.3 Layout & feel
Generous whitespace, 12-col grid, max container ~1440px with wide gutters, thin 1px borders, sharp or very slightly rounded corners (2–4px), no heavy shadows. Minimal, editorial, Shopify-premium-theme feel.

### 4.4 Motion principles
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-expo-like); durations 300–800ms; stagger 60–100ms.
- Respect `prefers-reduced-motion` (disable parallax/transforms, keep opacity fades).
- Create shared helpers: `<Reveal>`, `<RevealText>` (split-line mask reveal), `<Parallax>`, `<Marquee>`, `<Magnetic>` (optional), and variants in `lib/motion.ts`.

---

## 5. Storefront Specification (`storefront/`)

### 5.1 Global layout

**Announcement bar** — thin dark bar, infinite marquee (e.g., "Free shipping on orders over $150 — Shop now"), content editable from admin Settings. Dismissible optional.

**Header** (reference: Edward Langford)
- Transparent overlay on top of hero; turns solid `--bg` with blur + hairline border after scroll (animated). Hides on scroll down, shows on scroll up.
- **Left:** logo wordmark. **Center:** hamburger icon (three lines) that morphs into an X. **Right:** currency/locale selector (display only: `ENGLISH (USD $)`), search icon, account icon, cart icon with animated count badge (bumps when item added).
- Text color auto-switches (light over dark hero, dark over light bg).

**Full-page menu** (reference: dark overlay)
- Opens from center hamburger; full viewport `--menu-bg`, entrance via clip-path/slide-down with staggered link reveals; body scroll locked; focus trapped; `Esc` closes; close button top-right (white square with X).
- **Left column:** huge uppercase links — `HOME`, `SHOP`, `CATEGORIES ›`, `CONTACT` — separated by thin lines; inactive links dimmed grey, hovered/active white; link with `›` reveals the right panel.
- **Right panel (multi-column):** headings `CATEGORIES` (Side & Accent Tables, Vases & Decor, Candles & Lighting, Cookware, Kitchen Tools, Tableware), `COLLECTIONS` (New Arrivals, Best Sellers, …), `PRODUCTS` (featured product links), `PAGES` (Contact, Track Order, FAQ/Shipping). Columns fade/slide in staggered. Data driven from DB categories.
- **Bottom-left:** social icon circles (Instagram, X, Facebook) + copyright line.
- Mobile: single column, accordion for right panel.

**Footer** — newsletter signup (stores email), link columns, payment icons (COD, Visa/Mastercard), social, copyright. Subtle reveal animation.

**Cart drawer** — slides from right; line items with image, name, variant summary, qty stepper, remove; subtotal; free-shipping progress bar (threshold from settings, animated); "Checkout" and "View cart" buttons; empty state with CTA.

**Search overlay** — full-width overlay, debounced instant results (products + categories). Server-side search (ILIKE / trigram).

**Page transitions** — smooth fade/slide between routes (template.tsx + Motion); Lenis smooth scroll site-wide; scroll progress bar optional.

### 5.2 Home page (`/`)
1. **Hero** (reference: Majestic) — full-bleed (min 100svh) interior image with dark gradient overlay, slow zoom/parallax on scroll; centered headline in two lines: small italic serif *"Make Your House"* above huge italic serif *"Feel Like Home"* (words masked-reveal on load); subcopy; white "NEW COLLECTION" button (hover: fills green). Header overlays it. Hero content editable from admin Settings (headline, subtext, CTA, image).
2. **Featured Collections** (reference: product grid) — centered italic serif heading; **tab pills** (first four categories: Side & Accent Tables / Vases & Decor / Candles & Lighting / Cookware) with animated active outline (shared `layoutId`); **4-column** grid of product cards; tab switch crossfades grid.
3. **Category showcase** — large editorial tiles (image + italic title + "Shop now" arrow), staggered scroll reveal, image zoom on hover.
4. **Brand story / values strip** — sage `--primary` background section (dark ink text) with 3–4 value props (Premium materials, Free shipping, Easy returns, Secure checkout) with icons counting/fading in.
5. **Best sellers** — horizontal scroll-snap carousel with drag + arrows.
6. **Testimonials / Customer reviews** — pulls **approved reviews** from DB (featured flag), animated carousel.
7. **Newsletter CTA** + footer.

### 5.3 Product card (reference: Featured Collections grid)
- Image on `--surface-muted` tile (aspect ~ 4/5), brand label small ("Majestic"), product name in italic serif, price `$1,099.00 USD` small sans.
- Hover: second image crossfades in; **Quick Add** button slides up from the bottom of the tile.
- Color swatches below (if product has color variants); sale/new badge.
- **Quick Add behaviour:**
  - Single-variant product → adds instantly.
  - Multi-variant → opens a **Quick Add modal/sheet** (image, options as swatches/pills, qty, price updates live, disabled/strikethrough for out-of-stock combinations, "Add to cart" button).
  - Mobile: persistent small "+" button on card.
- Skeleton loaders match card dimensions.

### 5.4 Add-to-cart animation (core requirement)
Both Quick Add and product-page Add:
1. Button transitions: label → spinner → checkmark ("Added") → resets (Motion `AnimatePresence`).
2. **Fly-to-cart:** a clone of the product image shrinks and follows a curved path to the header cart icon (compute from bounding rects), then the cart icon **bumps** and the count badge animates.
3. Cart drawer auto-opens (setting: auto-open on add = true) with the new line item highlighted (brief background pulse).
4. Optimistic UI; on server validation failure (out of stock) roll back with an inline toast.
5. Reduced motion: skip fly path, keep button state + badge change.

### 5.5 Categories pages
- `/categories` — all categories as editorial grid.
- `/categories/[slug]` and `/products` (all) share a listing template:
  - Header with category title (italic serif), description, product count, breadcrumb.
  - **Filters:** price range, availability, color, material, (dynamic from product options); desktop sidebar or horizontal bar; mobile bottom-sheet drawer. Active filter chips.
  - **Sort:** featured, newest, price low→high, high→low, best selling.
  - Pagination via "Load more" (infinite option) with URL-synced query params (`?sort=&price=&color=`).
  - Grid 2 cols mobile / 3 tablet / 4 desktop; staggered reveal.

### 5.6 Product detail page (`/products/[slug]`)
- **Gallery:** large images with thumbnail rail, swipe on mobile, hover/zoom, lightbox; image switches when color variant chosen.
- **Info:** brand, name, price (sale/compare-at), star rating summary linking to reviews, short description.
- **Variants:** option groups (e.g., Color swatches, Material pills, Size/Dimensions); selecting updates price, SKU, stock label ("Only 3 left"), gallery. Unavailable combos greyed out.
- **Quantity stepper**, **Add to cart** (animated per 5.4), **Buy now** (skips to checkout with only this item).
- **Accordions:** Description, Dimensions & Materials, Shipping & Returns, Care.
- **Sticky add-to-cart bar** on mobile/after scroll.
- **Reviews section:** rating breakdown bars, list of **approved** reviews (paginated, sort), "Write a review" form (name, email, rating, title, body, optional photos). Submission → status `pending`, success message "Thanks — your review will appear once approved." Mark "Verified purchase" if email matches a delivered order.
- **Related products** carousel; recently viewed (localStorage).
- SEO: metadata, OpenGraph, JSON-LD `Product` + `AggregateRating`.

### 5.7 Contact page (`/contact`)
- Editorial layout: left info (address, email, phone, hours, socials), right form (name, email, phone, subject, message) with validation, honeypot + rate limiting, animated success state. Submissions stored in `contact_messages` (visible in admin) and emailed to owner if mailer configured.
- FAQ accordion block.

### 5.8 Cart page (`/cart`)
Full-page cart for detail view: line items, qty, remove, order note, shipping estimate hint, totals, checkout CTA.

### 5.9 Checkout (`/checkout`)
Single-page, two-column (form left, sticky order summary right; summary collapses on mobile), progress indicator, guest checkout (optional login).
1. **Contact:** email, phone, newsletter opt-in.
2. **Shipping address:** name, address, city, state/province, postal code, country, phone.
3. **Delivery method:** Standard / Express (rates from settings; free over threshold).
4. **Payment method** (radio cards):
   - **Cash on Delivery** — shows note about COD fee (setting, default 0).
   - **Card payment (Demo)** — card number, expiry, CVC, name. **Demo rules:** `4242 4242 4242 4242` (any future expiry, any 3-digit CVC) → success; `4000 0000 0000 0002` → declined (show error); any other number → "Use test card 4242…". Show a visible "Demo mode — no real charge" banner. Never store card numbers/CVC; store only `last4`, brand, payment status. Implement behind a `PaymentProvider` interface (`createPayment`, `confirm`) with `DemoCardProvider` + `CodProvider`, so Stripe can be swapped in later.
5. **Review & place order:** server action validates cart (stock, prices, shipping) → creates order in a DB transaction (decrement stock, create order + items + initial tracking event) → payment result → redirect to success.
- Order statuses at creation: COD → `pending` (payment `pending`); Card success → `pending` (payment `paid`) awaiting owner confirmation.
- Order number format: `MJ-YYYYMMDD-XXXX` (human friendly, unique).
- Idempotency: guard against double submit.

### 5.10 Order success & tracking
- **Success (`/order/[orderNumber]/success`):** animated checkmark draw, order summary, what happens next, "Track your order" CTA, confetti-light subtle animation.
- **Tracking (`/track`)**: form with order number + email → `/track/[orderNumber]` shows **animated timeline/stepper**: Order placed → Confirmed → Processing → Shipped → Out for delivery → Delivered (cancelled/refunded variants), event history with timestamps and notes, carrier + tracking number (link out if URL provided), ETA, order items and address. Lookup requires matching email (no enumeration of orders).
- Logged-in customers: `/account` lists orders (Phase 1 can be lightweight: email magic-link or simple credentials; mark as optional if time-constrained — see Deferred).

### 5.11 Storefront non-functional
- Server Components by default; client components only where interactive.
- `next/image` with correct `sizes`, blur placeholders, priority for hero.
- Lighthouse targets: Performance ≥ 90 (desktop), Accessibility ≥ 95.
- Cart: Zustand persisted (localStorage) for UX; **server re-validates** at checkout; optional server cart sync for logged-in users.
- Error boundaries, `not-found`, loading skeletons for every route segment.
- Security headers, CSRF-safe server actions, rate limiting on contact/review/track/checkout endpoints.

---

## 6. Admin Dashboard Specification (`admin-dashboard/`)

**Goal:** feel faster, cleaner, and more purposeful than Shopify/WooCommerce — one-glance clarity, minimal clicks, keyboard-first, no clutter, zero plugin sprawl.

**Layout reference:** the overall admin layout (sidebar, top bar, dashboard grid, cards, charts, tables) must follow `admin-dashboard-design.webp` (see Section 0.1). Use the layout and structure from that design, but apply **our color tokens** (sage `#9CAF88`, off-white `#F7F5EF`, dark-green `#4F6B3F` buttons), not the reference's colors. Where the reference lacks a page (e.g., Roles matrix, Audit log), extend it in the same visual language.

### 6.1 UX principles / "better than Shopify" features
- **Command palette (`⌘K`/`Ctrl+K`):** jump to any order (by #, email, name), product, customer, or page; quick actions ("Create product", "Mark shipped").
- **Live updates:** new orders appear with a toast + sound (optional) + sidebar badge via polling/SSE (every ~15s fallback).
- **Inbox-style Orders:** split view — list left, order detail right (no page reload); keyboard navigation (J/K), bulk actions.
- **Action-first order detail:** the *next logical action* is a prominent primary button ("Confirm order" → "Mark as shipped" → "Mark delivered").
- **Saved filters/views** (e.g., "Needs confirmation", "Ready to ship", "COD pending").
- **Inline editing** on tables (price, stock, status) with undo toast.
- **Bulk operations** (publish/unpublish, delete, change category, export CSV).
- **Dark/light mode**, dense/comfortable table toggle, responsive (usable on phone for the owner on the go).
- Clean, calm UI using the same brand palette (sage + off-white), with data-viz that is readable not noisy.
- Empty states with guided next steps; skeleton loaders; optimistic updates.

### 6.2 Authentication & Authorization
- **Auth.js Credentials** (email + password). Password hashing: **argon2id** (or bcrypt cost ≥ 12). Min password policy; breach-safe error messages (no user enumeration).
- Sessions: secure, httpOnly, sameSite cookies; short-lived with rotation; sign-out everywhere; idle timeout.
- **Brute-force protection:** rate limiting + temporary lockout per IP/email; login attempts logged.
- **Route protection:** middleware for authentication + **server-side permission checks in every server action/route handler/data loader** (never rely on hidden UI alone).
- **Invitations:** admin creates a user (email, name, role) → generates one-time invite/set-password link (expires 48h). If mailer not configured, show the link in UI for copying.
- Forced password change on first login; optional 2FA (TOTP) → Deferred.
- First-run: `pnpm db:seed` creates an **Owner** account from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env (must be changed on first login).
- Security headers, CSRF protection for mutations, input validation with Zod, output encoding.

### 6.3 RBAC model
Tables: `users`, `roles`, `role_permissions` (or permissions JSON), optional `user_permission_overrides`.

**Permission format:** `resource:action` — resources: `dashboard`, `orders`, `products`, `categories`, `customers`, `reviews`, `messages`, `users`, `roles`, `settings`, `audit`. Actions: `view`, `create`, `update`, `delete`, plus specials: `orders:confirm`, `orders:ship`, `orders:refund`, `orders:cancel`, `reviews:moderate`, `products:publish`, `users:invite`, `data:export`.

**Default system roles (seeded, editable permissions except Owner):**

| Role | Access |
|---|---|
| **Owner/Admin** | Everything, incl. users, roles, settings, audit log. Cannot be locked out (at least one Owner must always exist). |
| **Manager** | All store operations (orders, products, categories, customers, reviews, messages); no user/role/settings management. |
| **Editor** | Products & categories create/update, reviews view; no orders/customers financial data. |
| **Support** | Orders view/update status (confirm, ship, notes), customers view, reviews moderate, messages manage; no product pricing edits. |
| **Viewer** | Read-only on dashboard, orders, products, reviews; no mutations. |

- Admin can **create custom roles** with a checkbox permission matrix, and assign/change a user's role; disable/enable users; force logout; reset password.
- UI hides/disables unauthorized actions; server enforces via a single helper `requirePermission(session, "orders:ship")`.
- Unit-test the permission matrix.
- **Audit log:** every mutation (who, what, entity, before/after diff summary, IP, timestamp) viewable at `/audit` (permission `audit:view`).

### 6.4 Admin pages / tabs (sidebar)
1. **Dashboard** — KPI cards (Today/7d/30d: revenue, orders, AOV, new customers) with trend deltas; revenue/orders line chart; orders by status; top products; **needs attention** panel (unconfirmed orders, low stock, pending reviews, unread messages); recent orders.
2. **Orders**
   - List: search, filters (status, payment method, payment status, date range), saved views, bulk actions, CSV export.
   - Detail: customer & address, items with variants, totals, payment info (method, status, last4), **status stepper** + primary next-action button, **tracking panel** (carrier, tracking number, tracking URL, ETA, add custom event with note + timestamp — these show on the customer's tracking page), internal notes, activity timeline, print invoice/packing slip, cancel/refund (marks status; no real money movement in demo), mark COD as paid on delivery.
   - Workflow: `pending → confirmed → processing → shipped → out_for_delivery → delivered`; branches `cancelled`, `refunded`. Enforce valid transitions server-side. Stock restored on cancel.
   - Notifications: status change triggers customer email (if mailer configured) and adds tracking event.
3. **Products**
   - List with thumbnails, status (draft/active/archived), stock, price; search/filter/bulk.
   - Create/edit: title, slug (auto), description (rich text), media (multi-upload, drag-reorder, set per-variant image), category(ies), brand, tags, **options & variants builder** (define option names/values e.g. Color × Material → auto-generate variant matrix, per-variant SKU/price/compare-at/stock/image), SEO fields, status, featured flag; duplicate product.
4. **Categories** — CRUD, image, description, order (drag & drop), visibility, shows in menu.
5. **Reviews** — queue with tabs (Pending / Approved / Rejected); preview with product link & verified-purchase badge; approve / reject / delete / feature on homepage / optional owner reply; bulk moderate. **Only `approved` reviews appear on storefront**; approval triggers storefront revalidation and recalculates product rating aggregates.
6. **Customers** — list, detail (orders, total spent, contact info), search, export.
7. **Messages** — contact form inbox (unread/read/archived), reply via mailto/email, mark handled.
8. **Users & Roles** (Owner only by default) — user list, invite/create, edit role, disable, reset password, last login; roles list with permission matrix editor.
9. **Settings** — store info (name, logo, contact details), shipping rates & free-shipping threshold, payment methods toggles (COD on/off, demo card on/off, COD fee), announcement bar text, homepage hero content (headline/subtext/CTA/image), tax (simple %), currency display, order number prefix.
10. **Audit Log** — filterable list.
11. **Profile** — own profile, change password, sessions.

### 6.5 Admin tech notes
- shadcn/ui + TanStack Table (server-side pagination/sorting/filtering) + React Hook Form + Zod.
- Data access in server components/actions; mutations via server actions with permission checks and audit logging.
- Charts: Recharts, with accessible colors in brand palette.
- Image upload: signed uploads to storage adapter; validate type/size.

---

## 7. Data Model (Drizzle, in `packages/db`)

Use UUID PKs (or cuid), `created_at`/`updated_at` on all tables, soft delete where noted, indexes on all FKs and search fields, money stored as **integer cents** (never floats).

**Store / content**
- `categories` (id, slug, name, description, image_url, parent_id?, sort_order, is_visible)
- `products` (id, slug, title, description, brand, status[draft|active|archived], is_featured, base_price_cents, compare_at_price_cents?, seo_title, seo_description, rating_avg, rating_count, deleted_at)
- `product_categories` (product_id, category_id)
- `product_images` (id, product_id, url, alt, sort_order, variant_id?)
- `product_options` (id, product_id, name, sort_order) — e.g., Color
- `product_option_values` (id, option_id, value, swatch_hex?, sort_order)
- `product_variants` (id, product_id, sku, price_cents, compare_at_price_cents?, stock_qty, image_id?, is_active)
- `variant_option_values` (variant_id, option_value_id)
- `reviews` (id, product_id, order_id?, customer_name, customer_email, rating 1–5, title, body, images?, status[pending|approved|rejected], is_featured, is_verified_purchase, owner_reply?, moderated_by?, moderated_at?)
- `contact_messages` (id, name, email, phone?, subject, message, status[unread|read|archived], handled_by?)
- `newsletter_subscribers` (id, email unique)
- `settings` (key, value JSON) — hero, announcement, shipping, payments, store info

**Commerce**
- `customers` (id, email unique, name, phone, password_hash? (optional), created_at)
- `addresses` (id, customer_id?, order_id?, name, line1, line2, city, state, postal_code, country, phone)
- `carts` / `cart_items` (optional server-side cart for logged-in users)
- `orders` (id, order_number unique, customer_id?, email, phone, status, payment_method[cod|card_demo], payment_status[pending|paid|failed|refunded], subtotal_cents, shipping_cents, tax_cents, discount_cents, total_cents, currency, shipping_address JSON, delivery_method, note, carrier?, tracking_number?, tracking_url?, estimated_delivery?, placed_at, confirmed_at?, shipped_at?, delivered_at?, cancelled_at?)
- `order_items` (id, order_id, product_id, variant_id, title_snapshot, variant_snapshot, image_snapshot, sku, unit_price_cents, quantity, total_cents) — **snapshots** so history survives product edits
- `order_events` (id, order_id, status, title, description, location?, is_public, created_by?, created_at) — drives the tracking timeline
- `payments` (id, order_id, provider, status, amount_cents, card_brand?, card_last4?, provider_ref?, error?)

**Admin / security**
- `admin_users` (id, email unique, name, password_hash, role_id, is_active, must_change_password, last_login_at, invited_by?)
- `roles` (id, name, description, is_system)
- `role_permissions` (role_id, permission)
- `invites` / `password_reset_tokens` (hashed token, expires_at, used_at)
- `audit_logs` (id, actor_id, action, entity_type, entity_id, summary/diff JSON, ip, user_agent, created_at)
- `login_attempts` (for lockout/rate limiting) or use an Upstash-style limiter

**Seed data (`pnpm db:seed`):** Owner + one user per default role (dev only), roles & permissions, 6 categories (Side & Accent Tables, Vases & Decor, Candles & Lighting, Cookware, Kitchen Tools, Tableware), ~35 home decor & kitchen products with 2 images each, variants (Color / Finish / Size / Scent where relevant), approved + pending reviews, a few sample orders in different statuses with tracking events, default settings (hero copy, announcement, shipping rates). Use local placeholder images in `/public/seed/` (generate neutral placeholders or ask user to drop real images; do not hotlink or scrape copyrighted images).

---

## 8. Key Flows (acceptance-level)

**Purchase flow:** Home → hover card → Quick Add → pick variant → fly-to-cart + drawer → Checkout → choose COD or card 4242 → order placed → success page → track page shows "Order placed".

**Fulfilment flow:** Admin gets new order notification → opens order → **Confirm** (customer timeline updates) → **Processing** → **Ship** with carrier + tracking number → **Out for delivery** → **Delivered** (COD auto-marks payment paid on delivery). Storefront tracking page reflects each step in near real time.

**Review flow:** Customer submits review on product page → appears in admin "Pending" → owner approves → appears on product page, rating average updates, can be featured on Home.

**RBAC flow:** Owner invites "Sara" as Editor → Sara logs in, sets password → sees only Products/Categories/Reviews(view); direct URL to `/orders` shows 403 page; API/server action rejects too → action recorded in audit log.

---

## 9. Environment Variables (`.env.example`)

```
DATABASE_URL=
# Storefront
NEXT_PUBLIC_SITE_URL=http://localhost:3000
REVALIDATE_SECRET=
# Admin
AUTH_SECRET=
AUTH_URL=http://localhost:3001
ADMIN_EMAIL=owner@example.com
ADMIN_PASSWORD=ChangeMe!123
STOREFRONT_URL=http://localhost:3000
# Uploads
CLOUDINARY_URL=
# Email (optional)
RESEND_API_KEY=
MAIL_FROM=
```

Scripts at root: `pnpm dev` (both apps), `pnpm dev:store`, `pnpm dev:admin`, `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm test`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm lint`, `pnpm build`.

---

## 10. Quality Bar / Definition of Done

- [ ] TypeScript strict, zero type errors, zero lint errors, build passes for both apps.
- [ ] Every page responsive (360px → 1920px) and visually matches the reference direction (header, full-page menu, Majestic hero, product grid).
- [ ] Scroll/reveal animations on all pages; smooth, no layout shift, 60fps feel; reduced-motion respected.
- [ ] Full purchase flow works with COD and demo card (4242 success, decline card fails gracefully).
- [ ] Tracking page matches the order's real status/events.
- [ ] Admin can run an order from `pending` → `delivered`; changes show on storefront.
- [ ] Reviews only public after approval.
- [ ] RBAC verified: UI + server both enforce; Viewer cannot mutate; non-admin cannot manage users.
- [ ] Unit tests: pricing/totals, order state machine, permission checks. E2E (Playwright): purchase flow; admin confirm/ship flow; review approval; RBAC denial.
- [ ] README with setup, env, seed credentials, demo script for client walkthrough.

---

## 11. Suggested Client Demo Script (include in README)
1. Browse storefront → menu overlay → category filtering.
2. Quick Add a variant product → animated add → cart drawer.
3. Checkout with card `4242 4242 4242 4242` → success → tracking page.
4. Switch to admin: new order toast → Confirm → Ship with tracking → show customer tracking updating.
5. Submit a review as customer → approve in admin → appears on site.
6. Create a user with Viewer role → show restricted access → show audit log.

---

## 12. Milestones & Checklist

### M0 — Foundation
- [x] pnpm workspace, TS config, ESLint/Prettier, Husky
- [x] `storefront/` and `admin-dashboard/` Next.js apps (App Router, Tailwind, TS strict)
- [x] `packages/db` (Drizzle + Neon client + migrations) and `packages/shared` (Zod, constants, permissions)
- [x] Design tokens (colors, fonts, spacing), Tailwind theme, base UI components, motion helpers, Lenis setup
- [x] `.env.example`, root scripts, README skeleton
- [x] Study all reference assets (Section 0.1); write `docs/storefront-layout-notes.md` (ref-1 to ref-4) and `docs/admin-layout-notes.md` (admin-dashboard-design.webp)

### M1 — Database & Seed
- [x] Full schema from Section 7 + migrations
- [x] Seed script (roles/permissions, owner, categories, products w/ variants, reviews, sample orders)
- [x] Shared query helpers (product listing, product by slug, order by number)

### M2 — Storefront Shell
- [x] Announcement marquee, transparent→solid hiding header, hamburger morph (layout matches `ref-1.png`)
- [x] **Full-page menu overlay** per `ref-2.png` (data-driven, animated, accessible); compare against reference
- [x] Footer, page transitions, smooth scroll, 404/error/loading states
- [x] Search overlay (basic)

### M3 — Home Page
- [x] Majestic-style hero per `ref-3.png` (parallax, text mask reveal, settings-driven)
- [x] Featured Collections with animated tabs + product grid per `ref-4.png`
- [x] Category showcase, values strip, best sellers carousel, testimonials (approved reviews), newsletter

### M4 — Catalog (Categories & Products)
- [x] Product card with hover swap, swatches, badges
- [x] `/categories`, `/categories/[slug]`, `/products` with filters/sort/URL state/load more
- [x] Product detail: gallery, variants, accordions, related, JSON-LD, sticky mobile bar
- [x] Reviews display + submission form (pending state)

### M5 — Cart & Quick Add
- [x] Zustand cart store (persist), server validation endpoints
- [x] Quick Add modal with variants; instant add for single-variant
- [x] **Fly-to-cart animation**, animated button states, cart badge bump
- [x] Cart drawer + `/cart` page + free-shipping progress bar

### M6 — Checkout, Payment, Orders, Tracking
- [x] Checkout form (contact, shipping, delivery method, payment method) with Zod validation
- [x] `PaymentProvider` interface, `CodProvider`, `DemoCardProvider` (4242 success / 0002 decline)
- [x] Order creation transaction (stock decrement, snapshots, events, order number)
- [x] Success page animation; `/track` lookup + animated timeline page
- [x] Contact page + form → DB (rate limited, honeypot)

### M7 — Admin Foundation & Security
- [x] Auth.js credentials login, argon2, lockout/rate limit, session hardening
- [x] Middleware + `requirePermission` helper, RBAC tables, default roles
- [x] Admin layout per `admin-dashboard-design.webp` (sidebar, topbar, grid, cards, tables) recolored with our tokens; command palette, light/dark toggle, 403 page
- [x] Users & Roles: invite/create user, role assignment, permission matrix editor, disable/reset
- [x] Audit logging utility wired into all mutations

### M8 — Admin Commerce Modules
- [x] Dashboard analytics & needs-attention panel
- [x] Orders list (filters, saved views, bulk) + detail with status workflow, tracking panel, notes, invoice print
- [x] Products CRUD with options/variants builder, image uploads, bulk actions
- [x] Categories CRUD with drag-sort
- [x] Reviews moderation (approve/reject/feature) + revalidation + rating aggregates
- [x] Customers, Messages, Settings (hero, announcement, shipping, payments), Audit log, Profile
- [x] Live new-order notification

### M9 — Integration, Polish, QA
- [x] Storefront reads settings/hero/announcement from admin-managed data; revalidation webhook
- [ ] Animation polish pass on every page; reduced-motion pass
- [ ] Accessibility + Lighthouse pass; image optimization
- [ ] Unit + Playwright E2E tests; fix bugs
- [ ] README, demo script, seed credentials table, deployment notes (Vercel x2 projects + Neon)

---

## 13. Decision Log
_(Claude Code: record any decision that deviates from or extends this plan.)_

| Date | Decision | Reason |
|---|---|---|
| 2026-11-18 | **TypeScript 6.0.3** (not 7.0.x) | TS 7 (native) is the latest, but `typescript-eslint` 8.73 only supports TS `<6.1`. Upgrade once typescript-eslint supports TS 7. |
| 2026-11-18 | **ESLint 9.39.5** (not 10.x) | `eslint-config-next` 16 bundles plugins (react, import, jsx-a11y) whose peer ranges stop at ESLint 9. |
| 2026-11-18 | **pnpm 12** with `allowBuilds: { esbuild: true }` in `pnpm-workspace.yaml`; **no Turborepo** | pnpm blocks dependency build scripts by default; only esbuild (drizzle-kit) needs one. `pnpm -r` is enough for 2 apps + 2 packages. |
| 2026-11-18 | DB driver: **`postgres` (postgres-js)** for every environment (Neon included, `ssl: require`, `prepare: false` for the pooler) instead of the Neon serverless driver | One driver locally and in prod; supports interactive transactions (needed for the checkout order transaction), which neon-http does not. |
| 2026-11-18 | Local DB without Postgres/Docker: **`pnpm db:local`** runs **PGlite** (embedded Postgres) behind `@electric-sql/pglite-socket` on `127.0.0.1:5433`, data in `.pglite/` | Machine has no Postgres/Docker. Apps/migrations/seed use the same `DATABASE_URL` + driver as prod. For localhost the client uses `max: 1` and `fetch_types: false` (the type-fetch connection interleaves with extended-protocol messages on PGlite's single multiplexed session and breaks prepared statements). |
| 2026-11-18 | Env file lives at the **repo root**; both `next.config.ts` files and db scripts load it (`process.loadEnvFile` / `node --env-file-if-exists`) | One `.env` shared by both apps and `packages/db`. |
| 2026-11-18 | Fonts: **Cormorant Garamond** (display, italic), **Poppins** 300–600 (body/UI), **Archivo 800** (menu links), **DM Sans** (admin, matches the reference's geometric sans) | Plan options; Poppins matches ref-3/ref-4, DM Sans matches the admin reference. |
| 2026-11-18 | Extra tokens: `--warning-ink #8A5D0E` (warning **text**), `--menu-ink-muted #A3A3A3` (dimmed menu links), `--on-strong #F7F5EF` (text on green/dark); admin dark-mode hover `#3F5A34`. Every allowed text/bg pair is listed in `@repo/shared/tokens` and tested (≥ 4.5:1) | `--warning #C98A1B` is only 2.9:1 as text on white, so it is used for fills/dots only. `#5C7A4A` as a dark-mode hover failed the test with off-white text. |
| 2026-11-18 | Schema extensions beyond §7: `products.summary/tags/details(jsonb)/sales_count/published_at`; `categories.show_in_menu`; `product_images.width/height`; `product_variants.sort_order`; `orders.fee_cents/idempotency_key/refunded_at`; `order_events.occurred_at`; new `order_notes` table (internal notes); `admin_users.session_version` (force logout / sign-out everywhere); `contact_messages.handled_at`; `customers.accepts_marketing`; `settings.updated_by`; `newsletter_subscribers.source`; `tax` settings key (basis points) | Needed by §5/§6 features (accordions, best-selling sort, "shows in menu", COD fee, double-submit guard, internal notes, session revocation). Emails are unique case-insensitively via `lower(email)` indexes. |
| 2026-11-18 | Permissions: CRUD actions are only generated where meaningful (`dashboard`/`audit`: view; `settings`: view+update; `messages`: no create) | Keeps the permission matrix free of meaningless checkboxes. |
| 2026-11-18 | Search uses `lower()` btree indexes + `ILIKE`; trigram (`pg_trgm`) index deferred | The PGlite socket server does not load extensions; see §14. |
| 2026-11-18 | ~~Seed images are generated placeholders~~ (superseded 2026-11-19 by Pexels photography, below). Seed images were **generated placeholders** (flat furniture silhouettes / interior, SVG → WebP via sharp) committed in `storefront/public/seed/`; admin loads them via `STOREFRONT_URL` | Plan forbids hotlinking/scraping; real photos can replace files 1:1 by name. |
| 2026-11-18 | `pnpm db:seed` wipes and reloads in development; with `NODE_ENV=production` it never wipes and only ensures system roles, default settings and the Owner. Demo users (dev only) use password `DemoPass!123` | Safe first-run in prod; repeatable demo data in dev. |
| 2026-11-18 | Storefront header follows **ref-1** (centered hamburger + full-page menu); only the marquee bar and the transparent-over-image feel come from ref-3 (its inline nav is not used) | §5.1 specifies the ref-1 header. |
| 2026-11-18 | Menu overlay (ref-2 is cropped) completed as: left column is full height with links at the top and socials + copyright pinned to the bottom; right panel scrolls independently; the panel is open by default with `CATEGORIES ›` as its owner link (like `FEATURES ›` in the ref), and toggles it. Left column widened from the ref's ~33% to ~40% (min 480px) so `CATEGORIES ›` fits at the menu font size | Our longest link ("CATEGORIES") is longer than the ref's ("FEATURES"); without widening it was clipped. |
| 2026-11-18 | Menu/search overlays use **Radix Dialog** (focus trap, Esc, scroll lock, aria) + Motion; focus is returned to the header toggle explicitly (`onCloseAutoFocus`), and Lenis is stopped while an overlay is open | Toggles live outside the dialog, so Radix's default focus return does not apply. |
| 2026-11-18 | Header chrome = one fixed container (announcement bar + header): bar slides away once scrolled, whole chrome hides on scroll down past 160px and returns on scroll up; transparent/light only on hero routes (`HERO_ROUTES`), other pages get a `--shell-offset` top padding. Announcement dismissal is per browser session | Matches §5.1 behaviour without layout shift. |
| 2026-11-18 | Links to pages from later milestones go through `lib/routes.ts` (cast to `Route` for typed routes) and show the storefront 404 until built. Known: Next 16 segment-prefetch responses for not-yet-existing routes stay open in the browser (pages work; only "network idle" never fires) — resolves as M4–M6 add the routes | Avoids scattering casts; documents the temporary prefetch quirk. |
| 2026-11-18 | Rate limiting (search API, newsletter, later contact/review/track/checkout) uses an **in-memory fixed-window limiter** per server instance | Fine for the demo/single instance; a shared store (Upstash/Postgres) is listed in §14. |
| 2026-11-18 | Shell data (announcement, store info, menu categories, featured products) is loaded once in the root layout via `unstable_cache` tagged `catalog`/`settings` (5-min revalidate) and falls back to defaults if the DB is unreachable | Keeps header/footer resilient; tags are what the M9 revalidation webhook will invalidate. |
| 2026-11-18 | Added a minimal persisted Zustand cart store (lines + count + add tick) in M2 so the header badge is live; add/validation flows land in M5 | Header badge needs real state now. |
| 2026-11-18 | `scripts/screenshot.mjs` (Playwright, falls back to installed Edge/Chrome) captures desktop + mobile states for reference comparison | Section 0.1 rule 5. |
| 2026-11-19 | **Catalog pivot (owner request): home decor & kitchen essentials.** Categories are now Side & Accent Tables, Vases & Decor, Candles & Lighting, Cookware, Kitchen Tools, Tableware (35 demo products). Featured Collections tabs use the first four categories. Brand constant unchanged ("Majestic") | The store sells small tables, decor and kitchen essentials, not large furniture. |
| 2026-11-19 | **Real photography from Pexels** (owner request) replaces the generated placeholders. `pnpm --filter @repo/db images` downloads each photo once from the manifest (`packages/db/scripts/image-manifest.ts`), converts to WebP and stores it in `storefront/public/images/`; credits in `docs/image-credits.md` | Pexels License allows free commercial use; downloading (not hotlinking) keeps the "no hotlinking" rule. |
| 2026-11-19 | Added an **About** page (hero, story, stats, values, process, mosaic, CTA) and a home "Our story" teaser + kitchen editorial section (beyond §5.2) | Owner asked for About/testimonials sections and image-backed sections. |
| 2026-11-19 | Pricing, payment providers (`CodProvider`, `DemoCardProvider`), checkout schema and sort constants live in `@repo/shared` (pure, unit-tested); `createOrder` lives in `@repo/db` (one transaction: conditional stock decrement, customer upsert, snapshots, address, first public event, payment) | One source of truth for totals in UI and server; reusable by the admin. |
| 2026-11-19 | Order pages are gated by a **signed httpOnly cookie** (HMAC with `AUTH_SECRET`) set after placing an order or after a successful order-number + email lookup; the lookup returns the same error for unknown number and wrong email | Prevents order enumeration while keeping guest checkout. |
| 2026-11-19 | "Buy it now" goes to `/checkout?buy=<variantId>&qty=n` (cart untouched); the sticky add-to-cart bar shows on all breakpoints once the main button scrolls away | Simple, URL-driven, no extra state. |
| 2026-11-19 | `/account` is an order lookup (number + email) — guest checkout only in Phase 1 | PLAN §5.10 allows account-lite; full accounts deferred. |
| 2026-11-19 | Reduced-motion variants explicitly reset transforms (`y: 0`) | Found in QA: SSR renders the full-motion hidden state before `useReducedMotion` resolves, which left mask-revealed headings invisible. |
| 2026-11-19 | `scripts/smoke.mjs`: browser end-to-end smoke test (quick add, PDP variant add, COD + card checkout incl. decline, tracking access control, filters, contact, review) | Verifies the purchase flow until the Playwright suites in M9. |
| 2026-11-19 | Admin auth: **Auth.js v5 (`next-auth@5.0.0-beta.32`)** Credentials + JWT (12 h max, 2 h idle timeout). Every request re-validates the user against the DB (`getAdminSession`): disabled users, role changes, password changes and "sign out everywhere" bump `admin_users.session_version`, which invalidates existing JWTs immediately | Stateless JWTs alone can't be revoked; a DB check per request is cheap and gives instant revocation. |
| 2026-11-19 | Next 16 renamed middleware → **`src/proxy.ts`**. It only gates authentication and the forced password change; authorization is enforced server-side in every page (`requirePagePermission`) and action (`runAction` → `requirePermission`). The forced change is also enforced in the app layout and in `requirePermission` | Defense in depth — never rely on the proxy/UI alone (PLAN §6.2). |
| 2026-11-19 | Brute-force protection is **DB-backed** (`login_attempts`): 5 failures per email or 30 per IP in 15 min lock sign-in; unknown emails are verified against a real argon2 hash so timing doesn't reveal accounts; one generic error message | Works across serverless instances; no user enumeration. |
| 2026-11-19 | Invites (48 h) and admin-initiated password resets (2 h) are one-time tokens stored as SHA-256 hashes; with no mailer, the link is shown in a copyable dialog | PLAN §6.2 fallback when email isn't configured. |
| 2026-11-19 | System roles keep their names; Owner's permissions are immutable; custom roles can be created/edited/deleted (only when unassigned). Guards prevent removing the last active Owner and acting on yourself (role change, disable, delete) | PLAN §6.3 "cannot be locked out". |
| 2026-11-19 | `scripts/admin-smoke.mjs`: browser test of the admin security flows (redirects, generic errors, forced password change, invite → accept → RBAC sidebar + 403, audit entries, instant revocation, lockout) | Covers the PLAN §8 RBAC flow until the Playwright suites in M9. |
| 2026-11-19 | Order workflow rules live in `@repo/shared/order-workflow` (`planTransition`: allowed moves, timestamps, payment-status changes, restock on cancel, public tracking event; `permissionForTransition`; `nextAction`) and are applied in one `SELECT … FOR UPDATE` transaction (`transitionOrder`). COD orders become paid on delivery; cancelling a paid order marks it refunded | Pure, unit-tested rules; no race between two staff moving the same order. |
| 2026-11-19 | Orders UI is an **inbox split view** (list + action-first detail, `J`/`K` navigation, `?selected=` deep links — `/orders/[n]` redirects there). Saved views are fixed presets (Needs confirmation, Ready to ship, In transit, COD to collect) rather than user-defined | Matches §6.4 "action-first"; user-defined views deferred (§14). |
| 2026-11-19 | Shipping without tracking opens a "Ship with tracking" dialog first. Refunds are status-only (`refunded`, no money movement in demo mode) | Customers always get tracking details; no real payment provider yet. |
| 2026-11-19 | Images: **Cloudinary** signed upload when `CLOUDINARY_URL` is set; otherwise uploads are hidden and the editor offers the **image library** (every image URL already used by products/categories, read from the DB — the admin is a separate deployment and can't read the storefront's files) or a pasted `https://` URL. Admin thumbnails use `NEXT_PUBLIC_STOREFRONT_URL` for `/images/…` paths | Works with zero config; no file system coupling between the two apps. |
| 2026-11-19 | Product saves are one transaction; variants are matched by option combination (`key` = values joined by `|`) so their ids survive edits (carts and order history reference them). Products are **soft-deleted**. New variants take the "Default price"; generated SKUs get a 3-char random token to stay unique | Order history must never break; found duplicate-SKU and $0-price bugs in QA. |
| 2026-11-19 | Every admin mutation calls `revalidateStorefront()` → `POST /api/revalidate` on the storefront (shared `REVALIDATE_SECRET`, constant-time compare, allow-listed tags `catalog`/`settings`, relative paths only). The call never throws — the 5-min ISR timer is the fallback | Admin edits show on the storefront immediately (verified by `scripts/revalidate-e2e.mjs`). |
| 2026-11-19 | Dashboard charts: **Recharts 3**, single-series in the brand green (`--chart-line`: `#4F6B3F` light / sage on dark), area chart with crosshair tooltip + screen-reader table, direct-labelled status bars. Daily buckets are UTC; deltas show "New" when the previous period is empty | One hue per chart (no categorical palette needed); avoids misleading "+100%". |
| 2026-11-19 | Admin timestamps render through `<LocalTime>` (viewer's timezone after hydration) | Server time (UTC on Vercel) caused hydration mismatches and wrong local times. |
| 2026-11-19 | Live new-order notifications: the shell polls a server action every 15 s while the tab is visible and shows a toast with an "Open" action | No websocket infra needed on Vercel; cheap query on an indexed column. |
| 2026-11-19 | CSV exports (orders, customers) require `data:export`, are audited, and neutralise spreadsheet formula injection | Exports are a common data-leak/injection vector. |
| 2026-11-19 | Local PGlite server pins each client to the session until its extended-protocol cycle ends (Sync / simple Query) | With storefront + admin both connected, interleaved Parse/Bind messages corrupted queries ("bind message supplies 1 parameters…"). Local-only; Neon is unaffected. |
| 2026-11-19 | `scripts/commerce-smoke.mjs` (33 checks: dashboard, order workflow incl. ship dialog, notes/events, invoice/slip, product builder, categories, reviews, customers, messages, settings, audit, Editor/Manager RBAC) and `scripts/revalidate-e2e.mjs` | Covers M8 until the Playwright suites in M9; both are re-runnable on the same DB. |

## 14. Deferred / Future
- Real payments (Stripe), real courier APIs, shipping labels
- Customer accounts with full order history (if only lightweight in Phase 1)
- Coupons & discounts, gift cards, wishlist
- 2FA (TOTP) for admin, SSO
- Multi-currency / multi-language
- Abandoned cart emails, inventory alerts via email/WhatsApp
- Advanced analytics, CSV import
- Trigram (`pg_trgm`) search index — enable on Neon (`CREATE EXTENSION pg_trgm`) when catalog size warrants fuzzy search
- Shared-store rate limiter (Upstash/Postgres) for multi-instance deployments (current limiter is in-memory per instance)
- Transactional emails (order confirmation, status updates, contact notification) — needs the `mailer` adapter + `RESEND_API_KEY`; storefront copy does not promise emails until then
- Server-side cart sync for logged-in customers (tables exist; depends on customer accounts)
- User-defined saved order views (fixed presets ship in M8)
- Real refunds through a payment provider (refunds are status-only in demo mode)
