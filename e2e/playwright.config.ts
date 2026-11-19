import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end suites for both apps (PLAN §8 / M9).
 *
 *   pnpm build && pnpm test:e2e
 *
 * Runs against a *local* PGlite database that global-setup wipes and reseeds — never against Neon
 * (global-setup refuses non-local hosts). Servers are started automatically unless already running.
 * Set PW_CHANNEL=msedge (or chrome) to use an installed browser instead of Playwright's Chromium.
 */
export const E2E_DB =
  process.env.E2E_DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:5433/postgres";
export const STORE_URL = "http://localhost:3100";
export const ADMIN_URL = "http://localhost:3101";

const env = { DATABASE_URL: E2E_DB, NODE_ENV: "production" };
const channel = process.env.PW_CHANNEL;

export default defineConfig({
  testDir: ".",
  outputDir: "../test-results",
  globalSetup: "./global-setup.ts",
  fullyParallel: false,
  workers: 1, // one shared database; specs mutate it
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { outputFolder: "../playwright-report", open: "never" }]],
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...(channel ? { channel } : {}),
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        ...(channel ? { channel } : {}),
      },
    },
  ],
  webServer: [
    {
      command: "pnpm --filter @repo/db local",
      port: 5433,
      reuseExistingServer: true,
      env,
    },
    {
      command: "pnpm --filter storefront exec next start --port 3100",
      url: STORE_URL,
      reuseExistingServer: !process.env.CI,
      env,
      timeout: 60_000,
    },
    {
      command: "pnpm --filter admin-dashboard exec next start --port 3101",
      url: `${ADMIN_URL}/login`,
      reuseExistingServer: !process.env.CI,
      env: {
        ...env,
        AUTH_URL: ADMIN_URL,
        STOREFRONT_URL: STORE_URL,
        STOREFRONT_PUBLIC_URL: STORE_URL,
      },
      timeout: 60_000,
    },
  ],
});
