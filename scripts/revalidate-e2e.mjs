// Admin → storefront freshness: editing the announcement bar in the admin must show up on the
// (ISR-cached) storefront homepage right away via the revalidation webhook.
//   node scripts/revalidate-e2e.mjs [adminUrl] [storefrontUrl]
// Needs both apps running against the same *local* database, admin with STOREFRONT_URL set.
import { chromium } from "@playwright/test";

const admin = process.argv[2] ?? "http://localhost:3101";
const store = process.argv[3] ?? "http://localhost:3100";
const OWNER = {
  email: "owner@example.com",
  password: process.env.OWNER_PASSWORD ?? "NewOwnerPass!456",
};
const marker = `Weekend sale ${Date.now() % 100000}`;

const browser = await chromium.launch().catch(() => chromium.launch({ channel: "msedge" }));
const page = await browser.newPage();
const home = async () => (await fetch(store, { cache: "no-store" })).text();

await home(); // warm the ISR cache
await page.goto(`${admin}/login`);
await page.fill("#email", OWNER.email);
await page.fill("#password", OWNER.password);
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL((u) => u.pathname === "/", { timeout: 10000 });

await page.goto(`${admin}/settings/homepage`, { waitUntil: "load" });
const box = page.locator("#announcement-messages");
const original = await box.inputValue();
await box.fill(`${marker}\n${original}`);
await page.getByRole("button", { name: "Save changes" }).first().click();
await page.locator("[data-sonner-toast]", { hasText: "Settings saved" }).waitFor({ timeout: 8000 });

let seen = false;
for (let i = 0; i < 10 && !seen; i++) {
  seen = (await home()).includes(marker);
  if (!seen) await new Promise((r) => setTimeout(r, 1000));
}
console.log(`${seen ? "PASS" : "FAIL"}  storefront shows the new announcement after an admin save`);

// Restore
await box.fill(original);
await page.getByRole("button", { name: "Save changes" }).first().click();
await page
  .locator("[data-sonner-toast]", { hasText: "Settings saved" })
  .first()
  .waitFor({ timeout: 8000 });
await browser.close();
process.exit(seen ? 0 : 1);
