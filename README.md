# Majestic Store

A client-showcase ecommerce platform for **home decor & kitchen essentials**: a minimal, heavily animated **storefront** and a separate,
secure **admin dashboard** (orders, products, reviews, RBAC) sharing one Postgres database.
See [`PLAN.md`](./PLAN.md) for the full specification and milestone checklist.

| App / package              | Path               | Port |
| -------------------------- | ------------------ | ---- |
| Storefront                 | `storefront/`      | 3000 |
| Admin dashboard            | `admin-dashboard/` | 3001 |
| Database (Drizzle)         | `packages/db`      | —    |
| Shared (Zod, RBAC, tokens) | `packages/shared`  | —    |

## Requirements

- Node.js ≥ 22 (developed on 24)
- pnpm ≥ 10 (developed on 12)
- A Postgres database — [Neon](https://neon.tech) in production. **No local Postgres needed**:
  `pnpm db:local` runs an embedded PGlite server.

## Setup

```bash
pnpm install
cp .env.example .env          # fill in AUTH_SECRET / REVALIDATE_SECRET (any long random strings)

# Terminal 1 — local database (skip if DATABASE_URL points at Neon)
pnpm db:local

# Terminal 2
pnpm db:migrate
pnpm db:seed
pnpm dev                      # storefront :3000 + admin :3001
```

## Scripts

| Script                                       | What it does                                                                                    |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `pnpm dev` / `dev:store` / `dev:admin`       | Run both apps / one app                                                                         |
| `pnpm db:local`                              | Local PGlite Postgres server on `127.0.0.1:5433` (data in `.pglite/`)                           |
| `pnpm db:generate`                           | Generate a SQL migration from schema changes                                                    |
| `pnpm db:migrate`                            | Apply migrations                                                                                |
| `pnpm db:seed`                               | Reset + load demo data (dev). In production only ensures roles, settings and Owner              |
| `pnpm --filter @repo/db images`              | Download the Pexels photos in the manifest into `storefront/public/images/` (already committed) |
| `node scripts/smoke.mjs [url]`               | Browser smoke test of the full purchase flow against a running storefront                       |
| `node scripts/screenshot.mjs [url]`          | Capture desktop/mobile screenshots for design review                                            |
| `pnpm typecheck` / `lint` / `build` / `test` | Quality gates                                                                                   |

## Seed credentials (development only)

| Role    | Email                                       | Password                                          |
| ------- | ------------------------------------------- | ------------------------------------------------- |
| Owner   | `ADMIN_EMAIL` (default `owner@example.com`) | `ADMIN_PASSWORD` (must be changed on first login) |
| Manager | manager@example.com                         | DemoPass!123                                      |
| Editor  | editor@example.com                          | DemoPass!123                                      |
| Support | support@example.com                         | DemoPass!123                                      |
| Viewer  | viewer@example.com                          | DemoPass!123                                      |

## Images

All photography is from [Pexels](https://www.pexels.com) (free for commercial use under the
[Pexels License](https://www.pexels.com/license/)). Photos are downloaded once and served locally
from `storefront/public/images/` — never hotlinked. The list lives in
`packages/db/scripts/image-manifest.ts`; credits are in [`docs/image-credits.md`](./docs/image-credits.md).
To swap a photo, change its Pexels id in the manifest and run `pnpm --filter @repo/db images --force`.

## Storefront pages

Home · About · Shop (`/products`, filters + sort + load more) · Categories · Product detail
(gallery, variants, reviews) · Cart drawer + `/cart` · Checkout (COD or demo card) · Order success ·
Track order · Contact (+ FAQ) · Account (order lookup).

**Demo cards:** `4242 4242 4242 4242` (any future expiry, any CVC) succeeds;
`4000 0000 0000 0002` is declined. No real charges are made.

## Admin dashboard

Dashboard (KPIs, revenue chart, needs-attention, recent orders) · Orders inbox (saved views, filters,
`J`/`K`, bulk actions, CSV) with action-first detail (status stepper, ship-with-tracking, events,
internal notes, invoice/packing slip, cancel/refund, mark COD paid) · Products (options → variant
matrix, image library / Cloudinary upload, bulk publish/archive/delete, inline price & stock edit) ·
Categories (drag to reorder) · Reviews moderation · Customers · Messages · Settings (store, shipping &
payments, homepage hero & announcement) · Users & Roles (invite, permission matrix) · Audit log.
New orders pop up as toasts while the dashboard is open. Every change is permission-checked on the
server, audited, and pushed to the storefront instantly through the revalidation webhook.

## Client demo script

Run both apps (`pnpm dev`) with seeded data, then:

1. **Browse** the storefront → open the full-page menu → pick a category → filter by colour and sort.
2. **Quick Add** a product with options from a card → choose a variant → watch it fly into the cart
   drawer.
3. **Checkout** with card `4242 4242 4242 4242` → success page → **Track order** timeline.
4. Switch to the **admin** (`owner@example.com`): the new-order toast appears within ~15 s →
   open it → **Confirm order** → **Start processing** → **Mark as shipped** (enter carrier + tracking
   number) → reload the customer's tracking page: the timeline updated.
5. As a customer, **write a review** on a product → in the admin **Reviews → Approve** (optionally
   _Feature on homepage_) → it appears on the product page and its rating updates.
6. **Users & Roles → Invite user** with the _Viewer_ role → open the one-time link in a private window →
   set a password → the sidebar shows only what a Viewer may see, and other pages return 403.
   Back as Owner, open the **Audit log** to see every action above.
7. **Settings → Homepage**: change the hero headline or announcement → refresh the storefront.

## Testing

| Command                                               | What it covers                                                                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `pnpm test`                                           | Unit tests (pricing, payments, order workflow, permissions, security rules, colour contrast of every token pair)         |
| `pnpm build && pnpm test:e2e`                         | Playwright: purchase flows, admin workflow + RBAC, axe accessibility scan of every page, reduced motion, mobile overflow |
| `node scripts/admin-smoke.mjs` / `commerce-smoke.mjs` | Scripted admin checks against a running admin on `:3101` (security flows / commerce modules)                             |
| `node scripts/revalidate-e2e.mjs`                     | Admin edit → storefront updates immediately                                                                              |

`pnpm test:e2e` **wipes and reseeds a local database** (it refuses non-local hosts) and starts the
PGlite server and both production builds on `:3100`/`:3101` itself. If Playwright's Chromium isn't
installed, use an installed browser: `PW_CHANNEL=msedge pnpm test:e2e` (or `chrome`).

## Deployment (Vercel × 2 + Neon)

**1. Database (Neon)**

1. Create a Neon project and copy the **pooled** connection string (`…-pooler…/neondb?sslmode=require`).
2. From your machine, with `DATABASE_URL` set to it in `.env`:
   ```bash
   pnpm db:migrate
   NODE_ENV=production pnpm db:seed   # roles, default settings and the Owner — never wipes data
   ```
   (Run plain `pnpm db:seed` instead only if you want the demo catalogue, orders and demo users —
   it **wipes** the database first.)
3. Re-run `pnpm db:migrate` whenever a release adds a migration (before deploying the apps).

**2. Storefront project** — import the GitHub repo in Vercel, **Root Directory `storefront`**
(framework: Next.js; Vercel detects the pnpm workspace). Environment variables:

| Variable               | Value                                                |
| ---------------------- | ---------------------------------------------------- |
| `DATABASE_URL`         | Neon pooled URL                                      |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-store-domain>`                        |
| `REVALIDATE_SECRET`    | long random string (same value in the admin project) |
| `AUTH_SECRET`          | long random string (signs the order-access cookie)   |

**3. Admin project** — import the same repo again, **Root Directory `admin-dashboard`**:

| Variable                    | Value                                                              |
| --------------------------- | ------------------------------------------------------------------ |
| `DATABASE_URL`              | Neon pooled URL                                                    |
| `AUTH_SECRET`               | long random string (`openssl rand -base64 32`)                     |
| `AUTH_URL`                  | `https://<your-admin-domain>`                                      |
| `STOREFRONT_URL`            | `https://<your-store-domain>` (revalidation webhook target)        |
| `STOREFRONT_PUBLIC_URL`     | optional — public store origin if it differs from `STOREFRONT_URL` |
| `REVALIDATE_SECRET`         | same value as the storefront                                       |
| `CLOUDINARY_URL` (optional) | `cloudinary://<key>:<secret>@<cloud>` to enable image uploads      |

**4. First login** — open the admin, sign in as `owner@example.com` with the `ADMIN_PASSWORD` used
when seeding, and set a new password (forced). Then invite your staff from **Users & Roles**.

**Checklist:** generate fresh secrets for production (never reuse the examples) · keep `.env` out of
git (it is ignored) · rotate the Neon password if it was ever shared · put the admin on its own
domain or subdomain (e.g. `admin.example.com`).
