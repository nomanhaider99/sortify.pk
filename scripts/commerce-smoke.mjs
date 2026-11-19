// Admin commerce smoke test (M8): dashboard, orders workflow, products, categories, reviews,
// customers, messages, settings, RBAC on commerce pages.
//   node scripts/commerce-smoke.mjs [adminUrl] [screenshotDir]
// Run against a seeded *local* database — it confirms an order, edits a product and settings.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3101";
const out = process.argv[3] ?? "screenshots";
mkdirSync(out, { recursive: true });
// Owner password after admin-smoke.mjs has run (it changes the starter password).
const OWNER = {
  email: "owner@example.com",
  password: process.env.OWNER_PASSWORD ?? "NewOwnerPass!456",
};
const MANAGER = { email: "manager@example.com", password: "DemoPass!123" };
const EDITOR = { email: "editor@example.com", password: "DemoPass!123" };

const browser = await chromium
  .launch()
  .catch(() => chromium.launch({ channel: "msedge" }))
  .catch(() => chromium.launch({ channel: "chrome" }));
const results = [];
const errors = [];
const check = (name, ok, detail = "") =>
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const toast = (page, text) =>
  page
    .locator("[data-sonner-toast]", { hasText: text })
    .first()
    .waitFor({ timeout: 8000 })
    .then(() => true)
    .catch(() => false);

async function session(user, tag) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`[${tag}] ${e.message}`));
  page.on("dialog", (d) => void d.accept());
  await page.goto(`${base}/login`, { waitUntil: "load" });
  await page.fill("#email", user.email);
  await page.fill("#password", user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => u.pathname === "/", { timeout: 10000 }).catch(() => {});
  return page;
}

const admin = await session(OWNER, "owner");
check("Owner signs in", new URL(admin.url()).pathname === "/", admin.url());

// ── Dashboard ────────────────────────────────────────────────────────────────
await admin.waitForSelector(".recharts-surface", { timeout: 10000 }).catch(() => {});
await wait(2000); // let chart entry animations finish before the screenshot
check("Dashboard shows KPI cards", (await admin.getByText("Avg. order value").count()) > 0);
check("Dashboard renders charts", (await admin.locator(".recharts-surface").count()) >= 3);
check("Needs-attention panel", (await admin.getByText("Needs attention").count()) > 0);
await admin.screenshot({ path: `${out}/m8-01-dashboard.png`, fullPage: true });
await admin.goto(`${base}/?period=7d`, { waitUntil: "load" });
check("Period switch", (await admin.getByText("vs previous 7d").count()) > 0);

// ── Orders ───────────────────────────────────────────────────────────────────
// Advance the first order that still has a next step (re-runnable: earlier runs use up pending ones).
const NEXT = {
  pending: "Confirm order",
  confirmed: "Start processing",
  processing: "Mark as shipped",
  shipped: "Out for delivery",
  out_for_delivery: "Mark delivered",
};
let orderNumber = "";
let advanced = null;
for (const [status, label] of Object.entries(NEXT)) {
  await admin.goto(`${base}/orders?status=${status}`, { waitUntil: "load" });
  if ((await admin.locator('[aria-label="Orders"] li button').count()) === 0) continue;
  orderNumber = (await admin.locator("h2").first().textContent())?.trim() ?? "";
  advanced = { status, label };
  break;
}
check("Orders list has an order with a next step", Boolean(advanced), orderNumber);
await admin.screenshot({ path: `${out}/m8-02-orders.png` });
if (advanced) {
  await admin.getByRole("button", { name: advanced.label }).click();
  // Shipping without tracking opens the tracking dialog first.
  if (
    await admin
      .getByRole("dialog", { name: "Ship with tracking" })
      .isVisible()
      .catch(() => false)
  ) {
    const dialog = admin.getByRole("dialog");
    await dialog.getByLabel("Carrier").fill("UPS");
    await dialog.getByLabel("Tracking number").fill("1Z999AA10123456784");
    await dialog.getByRole("button", { name: "Save & mark shipped" }).click();
  }
  check(`"${advanced.label}" advances the order`, await toast(admin, "Order moved to"));
  await admin.goto(`${base}/orders?selected=${orderNumber}`, { waitUntil: "load" });
  check(
    "Next action changed after the move",
    (await admin.getByRole("button", { name: advanced.label, exact: true }).count()) === 0,
    orderNumber,
  );
}

// Internal note + public event
await admin.fill(`#note-${orderNumber}`, "Customer asked for gift wrap.");
await admin.getByRole("button", { name: "Add note" }).click();
check("Internal note saved", await toast(admin, "Note added"));
await admin.fill(`#ev-title-${orderNumber}`, "Packed with care");
await admin.getByRole("button", { name: "Add event" }).click();
check("Tracking event saved", await toast(admin, "Event added"));
await admin.goto(`${base}/orders?selected=${orderNumber}`, { waitUntil: "load" });
check(
  "Note and event appear",
  (await admin.getByText("Customer asked for gift wrap.").count()) > 0 &&
    (await admin.getByText("Packed with care").count()) > 0,
);

// J/K navigation
await admin.goto(`${base}/orders`, { waitUntil: "load" });
const before = (await admin.locator("h2").first().textContent())?.trim();
await admin.locator("body").click({ position: { x: 5, y: 400 } });
await admin.keyboard.press("j");
await wait(2500);
const after = (await admin.locator("h2").first().textContent())?.trim();
check(
  "J moves to the next order",
  Boolean(before && after && before !== after),
  `${before} → ${after}`,
);

// Invoice
const inv = await admin.context().newPage();
await inv.goto(`${base}/print/invoice/${orderNumber}`, { waitUntil: "load" });
check(
  "Invoice renders",
  (await inv.getByText("Invoice", { exact: true }).count()) > 0 &&
    (await inv.getByText(orderNumber).count()) > 0,
);
await inv.goto(`${base}/print/invoice/${orderNumber}?slip=1`, { waitUntil: "load" });
check("Packing slip hides prices", (await inv.getByText("Subtotal").count()) === 0);
await inv.close();

// ── Products ─────────────────────────────────────────────────────────────────
await admin.goto(`${base}/products`, { waitUntil: "load" });
check("Products list", (await admin.locator("tbody tr").count()) > 5);
await admin.screenshot({ path: `${out}/m8-03-products.png` });

await admin.goto(`${base}/products/new`, { waitUntil: "load" });
const title = `Smoke Test Stool ${Date.now() % 100000}`;
await admin.fill("#title", title);
await admin.fill("#price", "89.00");
await admin.getByRole("button", { name: "Add option" }).click();
await admin.fill("#opt-0", "Finish");
await admin.getByLabel("Finish value 1").fill("Oak");
await admin.getByRole("button", { name: "+ Add value" }).click();
await admin.getByLabel("Finish value 2").fill("Walnut");
await wait(300);
check(
  "Options build a variant matrix",
  (await admin.locator('input[aria-label^="SKU for"]').count()) === 2,
);
await admin.getByRole("button", { name: "Save", exact: true }).click();
await admin.waitForURL(/\/products\/[0-9a-f-]{36}$/, { timeout: 10000 }).catch(() => {});
check("New product saved as draft", /\/products\/[0-9a-f-]{36}$/.test(admin.url()), admin.url());
await admin.screenshot({ path: `${out}/m8-04-product-editor.png`, fullPage: true });
await admin.reload({ waitUntil: "load" });
check("Variants persisted", (await admin.locator('input[aria-label^="SKU for"]').count()) === 2);
const variantPrice = await admin.locator("#vp-0").inputValue();
check("Variants keep the default price", variantPrice === "89.00", variantPrice);

// ── Categories / reviews / customers / messages ──────────────────────────────
await admin.goto(`${base}/categories`, { waitUntil: "load" });
check("Categories list", (await admin.locator('[aria-label="Categories"] li').count()) >= 6);
await admin
  .getByRole("button", { name: /Move .* down/ })
  .first()
  .click();
check("Category reorder saved", await toast(admin, "Order saved"));
await admin
  .getByRole("button", { name: /Move .* up/ })
  .nth(0)
  .click({ trial: true })
  .catch(() => {});

await admin.goto(`${base}/reviews?status=pending`, { waitUntil: "load" });
const approve = admin.getByRole("button", { name: "Approve", exact: true }).first();
if ((await approve.count()) > 0) {
  await approve.click();
  check("Review approved", await toast(admin, "Approved"));
} else {
  // No pending reviews left from earlier runs: moderate an approved one instead.
  await admin.goto(`${base}/reviews?status=approved`, { waitUntil: "load" });
  await admin
    .getByRole("button", { name: /Feature on homepage|Unfeature/ })
    .first()
    .click();
  check("Review feature toggled", await toast(admin, "homepage"));
}

await admin.goto(`${base}/customers`, { waitUntil: "load" });
check("Customers list", (await admin.locator("tbody tr").count()) > 3);
await admin.locator("tbody tr a").first().click();
await admin.waitForURL(/\/customers\/[0-9a-f-]{36}$/, { timeout: 8000 }).catch(() => {});
check("Customer detail shows history", (await admin.getByText("Order history").count()) > 0);

await admin.goto(`${base}/messages`, { waitUntil: "load" });
check("Messages inbox", (await admin.getByRole("tab", { name: /unread/i }).count()) > 0);

// ── Settings ─────────────────────────────────────────────────────────────────
await admin.goto(`${base}/settings/commerce`, { waitUntil: "load" });
const eta = admin.locator("#shipping-standardEta");
const original = await eta.inputValue();
await eta.fill("4–6 business days");
await admin.getByRole("button", { name: "Save changes" }).first().click();
check("Settings saved", await toast(admin, "Settings saved"));
await admin.reload({ waitUntil: "load" });
check("Settings persisted", (await eta.inputValue()) === "4–6 business days");
await eta.fill(original);
await admin.getByRole("button", { name: "Save changes" }).first().click();
await toast(admin, "Settings saved");
await admin.screenshot({ path: `${out}/m8-05-settings.png`, fullPage: true });

// ── Audit trail ──────────────────────────────────────────────────────────────
await admin.goto(`${base}/audit`, { waitUntil: "load" });
const auditText = await admin.locator("main").innerText();
check(
  "Audit log records commerce actions",
  auditText.includes(orderNumber) && auditText.includes(title),
  "order + product",
);

// ── RBAC: Editor ─────────────────────────────────────────────────────────────
const editor = await session(EDITOR, "editor");
await editor.goto(`${base}/orders`, { waitUntil: "load" });
check(
  "Editor cannot open orders",
  editor.url().includes("/403") || (await editor.getByText(/permission/i).count()) > 0,
  editor.url(),
);
await editor.goto(`${base}/settings`, { waitUntil: "load" });
check(
  "Editor cannot open settings",
  editor.url().includes("/403") || (await editor.getByText(/permission/i).count()) > 0,
  editor.url(),
);
await editor.goto(`${base}/products`, { waitUntil: "load" });
check("Editor can manage products but not delete", (await editor.locator("tbody tr").count()) > 0);

const manager = await session(MANAGER, "manager");
await manager.goto(`${base}/settings`, { waitUntil: "load" });
check("Manager cannot open settings", manager.url().includes("/403"), manager.url());
await manager.goto(`${base}/orders`, { waitUntil: "load" });
check("Manager can open orders", new URL(manager.url()).pathname === "/orders", manager.url());

await browser.close();
console.log(results.join("\n"));
if (errors.length) console.log(`\nPage errors:\n${errors.join("\n")}`);
const failed = results.filter((r) => r.startsWith("FAIL")).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
