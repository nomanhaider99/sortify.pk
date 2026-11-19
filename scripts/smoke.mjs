// End-to-end smoke test of the storefront purchase flow against a running server.
//   node scripts/smoke.mjs [baseUrl] [screenshotDir]
// (Full Playwright test suites arrive in M9; this script exercises the real flow in a browser.)
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3100";
const out = process.argv[3] ?? "screenshots";
mkdirSync(out, { recursive: true });

const browser = await chromium
  .launch()
  .catch(() => chromium.launch({ channel: "msedge" }))
  .catch(() => chromium.launch({ channel: "chrome" }));
const results = [];
const errors = [];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const check = (name, ok, detail = "") =>
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);

function watch(page, tag) {
  page.on("pageerror", (e) => errors.push(`[${tag}] ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/404|Failed to load resource/.test(m.text()))
      errors.push(`[${tag}] console: ${m.text()}`);
  });
}

async function fillCheckout(page, { email, payment, card }) {
  await page.fill("#email", email);
  await page.fill("#phone", "+1 555 010 2030");
  await page.fill('[id="address.name"]', "Jane Tester");
  await page.fill('[id="address.line1"]', "12 Market Street");
  await page.fill('[id="address.city"]', "Portland");
  await page.fill('[id="address.state"]', "OR");
  await page.fill('[id="address.postalCode"]', "97205");
  await page.fill('[id="address.phone"]', "+1 555 010 2030");
  if (payment === "cod") await page.locator('label[for="pay-cod"]').click();
  else {
    await page.locator('label[for="pay-card"]').click();
    await page.fill('[id="card.number"]', card);
    await page.fill('[id="card.expiry"]', "12 / 30");
    await page.fill('[id="card.cvc"]', "123");
    await page.fill('[id="card.name"]', "Jane Tester");
  }
}

// ── Desktop purchase flow (COD) ────────────────────────────────────────────
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
watch(page, "desktop");

await page.goto(base, { waitUntil: "load" });
await wait(1500);
await page
  .locator("#main")
  .getByRole("heading", { name: "Featured Collections" })
  .scrollIntoViewIfNeeded();
await wait(1200);
const firstCard = page.locator('[role="tabpanel"] article').first();
await firstCard.hover();
await wait(600);
await firstCard
  .getByRole("button", { name: /Quick add|Choose options/ })
  .first()
  .click();
const drawer = page.getByRole("dialog", { name: /Your cart/ });
const quick = page.getByRole("dialog").filter({ has: page.getByText("View full details") });
await Promise.race([drawer.waitFor({ timeout: 8000 }), quick.waitFor({ timeout: 8000 })]).catch(
  () => {},
);
if (await quick.isVisible().catch(() => false)) {
  await page.screenshot({ path: `${out}/flow-01-quick-add.png` });
  await quick.getByRole("button", { name: /Add to cart/ }).click();
  await drawer.waitFor({ timeout: 8000 }).catch(() => {});
}
await wait(1200);
check("Quick Add → cart drawer opens", await drawer.isVisible().catch(() => false));
await page.screenshot({ path: `${out}/flow-02-drawer.png` });
await page.keyboard.press("Escape");
await wait(600);

await page.goto(`${base}/products/halo-ceramic-vase-trio`, { waitUntil: "load" });
await wait(1200);
await page.screenshot({ path: `${out}/flow-03-pdp.png` });
await page.getByRole("radio", { name: /^Sage/ }).click();
await page.getByRole("button", { name: "Increase quantity" }).first().click();
await page
  .getByRole("button", { name: /^Add to cart$/ })
  .first()
  .click();
await drawer.waitFor({ timeout: 8000 }).catch(() => {});
await wait(1500);
const drawerText = (await drawer.textContent().catch(() => "")) ?? "";
check("PDP variant add (Color: Sage ×2)", /Color: Sage/.test(drawerText));
await page.screenshot({ path: `${out}/flow-04-drawer-2.png` });
await page.keyboard.press("Escape");

await page.goto(`${base}/cart`, { waitUntil: "load" });
await wait(1500);
await page.screenshot({ path: `${out}/flow-05-cart.png`, fullPage: true });

await page.goto(`${base}/checkout`, { waitUntil: "load" });
await wait(1500);
await fillCheckout(page, { email: "jane.tester@example.com", payment: "cod" });
await page.screenshot({ path: `${out}/flow-06-checkout.png`, fullPage: true });
await page.getByRole("button", { name: /Place order/ }).click();
await page.waitForURL(/\/order\/.+\/success/, { timeout: 15000 }).catch(() => {});
await wait(2000);
const successUrl = page.url();
const orderNumber = /\/order\/([^/]+)\/success/.exec(successUrl)?.[1];
check("COD order placed → success page", Boolean(orderNumber), orderNumber ?? successUrl);
await page.screenshot({ path: `${out}/flow-07-success.png`, fullPage: true });
const badge = await page.locator("[data-cart-target]").getAttribute("aria-label");
check("Cart cleared after order", /0 items/.test(badge ?? ""), badge ?? "");

if (orderNumber) {
  await page.goto(`${base}/track/${orderNumber}`, { waitUntil: "load" });
  await wait(2500);
  check("Tracking page shows 'Order placed'", (await page.getByText("Order placed").count()) > 0);
  await page.screenshot({ path: `${out}/flow-08-track.png`, fullPage: true });

  // Fresh browser: no access cookie → lookup required; wrong email refused.
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p2 = await ctx2.newPage();
  watch(p2, "fresh");
  await p2.goto(`${base}/track/${orderNumber}`, { waitUntil: "load" });
  await p2
    .waitForURL((url) => url.pathname === "/track" && url.searchParams.has("order"), {
      timeout: 8000,
    })
    .catch(() => {});
  check("Tracking without lookup redirects to /track", p2.url().includes("/track?order="));
  await p2.fill("#trackEmail", "someone.else@example.com");
  await p2.getByRole("button", { name: "Track order" }).click();
  await wait(1500);
  check("Wrong email is refused", (await p2.getByText(/couldn’t find an order/).count()) > 0);
  await p2.fill("#trackEmail", "jane.tester@example.com");
  await p2.getByRole("button", { name: "Track order" }).click();
  await p2.waitForURL(new RegExp(`/track/${orderNumber}$`), { timeout: 10000 }).catch(() => {});
  check("Correct email opens the timeline", p2.url().endsWith(`/track/${orderNumber}`));
  await ctx2.close();
}

// ── Buy now with demo card: decline then success ───────────────────────────
await page.goto(`${base}/products/fern-amber-glass-candle`, { waitUntil: "load" });
await wait(1200);
await page.getByRole("button", { name: "Buy it now" }).click();
await page.waitForURL(/\/checkout\?buy=/, { timeout: 10000 });
await wait(2000);
await fillCheckout(page, {
  email: "card.tester@example.com",
  payment: "card",
  card: "4000 0000 0000 0002",
});
await page.getByRole("button", { name: /Place order/ }).click();
await wait(2500);
check("Declined card shows an error", (await page.getByText(/declined/i).count()) > 0);
await page.screenshot({ path: `${out}/flow-09-declined.png` });
await page.fill('[id="card.number"]', "4242 4242 4242 4242");
await page.getByRole("button", { name: /Place order/ }).click();
await page.waitForURL(/\/order\/.+\/success/, { timeout: 15000 }).catch(() => {});
check("Card 4242 order succeeds", /\/success$/.test(page.url()), page.url());

// ── Listing filters ─────────────────────────────────────────────────────────
await page.goto(`${base}/products?color=Sage&sort=price_asc`, { waitUntil: "load" });
await wait(1500);
const countText =
  (await page
    .getByText(/\d+ products?$/)
    .first()
    .textContent()) ?? "";
check("Listing filter by Color=Sage", /\d+ product/.test(countText), countText);
await page.screenshot({ path: `${out}/flow-10-listing.png` });

// ── Contact form ────────────────────────────────────────────────────────────
await page.goto(`${base}/contact`, { waitUntil: "load" });
await wait(1000);
await page.getByLabel("Name", { exact: true }).fill("Smoke Tester");
await page.getByLabel("Email", { exact: true }).fill("smoke@example.com");
await page.getByLabel("Subject").fill("Hello from the smoke test");
await page
  .getByLabel("Message")
  .fill("Just checking that the contact form saves messages correctly.");
await page.getByRole("button", { name: "Send message" }).click();
await wait(2000);
check("Contact form success state", (await page.getByText("Message sent").count()) > 0);

// ── Review submission ───────────────────────────────────────────────────────
await page.goto(`${base}/products/olive-wood-spoon-set`, { waitUntil: "load" });
await wait(1000);
await page.getByRole("button", { name: "Write a review" }).click();
await wait(600);
await page.getByRole("radio", { name: "5 stars" }).click();
await page.getByLabel("Name").fill("Smoke Reviewer");
await page.getByLabel("Email (never shown)").fill("reviewer@example.com");
await page.getByLabel("Review title").fill("Lovely spoons");
await page.getByLabel("Your review").fill("Beautiful grain and they feel great in the hand.");
await page.getByRole("button", { name: "Submit review" }).click();
await wait(2000);
check(
  "Review submitted as pending",
  (await page.getByText(/will appear once approved/).count()) > 0,
);

// ── Mobile home ─────────────────────────────────────────────────────────────
const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
watch(m, "mobile");
await m.goto(base, { waitUntil: "load" });
await wait(2000);
await m.screenshot({ path: `${out}/flow-11-mobile-home.png` });
await m.goto(`${base}/products/halo-ceramic-vase-trio`, { waitUntil: "load" });
await wait(1500);
await m.screenshot({ path: `${out}/flow-12-mobile-pdp.png` });

await browser.close();
console.log(results.join("\n"));
console.log(errors.length ? `\nPage errors:\n${errors.join("\n")}` : "\nNo page errors");
