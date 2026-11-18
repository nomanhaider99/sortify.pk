# Majestic Store

A client-showcase ecommerce platform: a minimal, heavily animated **storefront** and a separate,
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

| Script                                       | What it does                                                                       |
| -------------------------------------------- | ---------------------------------------------------------------------------------- |
| `pnpm dev` / `dev:store` / `dev:admin`       | Run both apps / one app                                                            |
| `pnpm db:local`                              | Local PGlite Postgres server on `127.0.0.1:5433` (data in `.pglite/`)              |
| `pnpm db:generate`                           | Generate a SQL migration from schema changes                                       |
| `pnpm db:migrate`                            | Apply migrations                                                                   |
| `pnpm db:seed`                               | Reset + load demo data (dev). In production only ensures roles, settings and Owner |
| `pnpm --filter @repo/db placeholders`        | Re-render placeholder product images into `storefront/public/seed/`                |
| `pnpm typecheck` / `lint` / `build` / `test` | Quality gates                                                                      |

## Seed credentials (development only)

| Role    | Email                                       | Password                                          |
| ------- | ------------------------------------------- | ------------------------------------------------- |
| Owner   | `ADMIN_EMAIL` (default `owner@example.com`) | `ADMIN_PASSWORD` (must be changed on first login) |
| Manager | manager@example.com                         | DemoPass!123                                      |
| Editor  | editor@example.com                          | DemoPass!123                                      |
| Support | support@example.com                         | DemoPass!123                                      |
| Viewer  | viewer@example.com                          | DemoPass!123                                      |

## Images

Seed product, category and hero images are original, neutral placeholders generated locally
(`packages/db/scripts/generate-placeholders.ts`). Replace any file in `storefront/public/seed/`
with a real photo of the same name to upgrade the demo.

## Client demo script

See PLAN.md §11 (expanded here in M9).

## Deployment

Two Vercel projects (`storefront/`, `admin-dashboard/`) + one Neon database (expanded in M9).
