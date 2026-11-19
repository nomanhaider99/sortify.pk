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

## Client demo script

See PLAN.md §11 (expanded here in M9).

## Deployment

Two Vercel projects (`storefront/`, `admin-dashboard/`) + one Neon database (expanded in M9).
