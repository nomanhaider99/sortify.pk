// Mobile responsiveness audit for the admin dashboard: every page + key overlays at phone widths.
//   OWNER_PASSWORD=... node scripts/admin-mobile-audit.mjs [adminUrl] [screenshotDir]
// Use a *local* database (it signs in as the Owner). Reports sideways page scrolling, elements
// off-screen, overflowing text, small tap targets, and regions that need horizontal scrolling.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3101";
const out = process.argv[3] ?? "screenshots/admin-mobile";
mkdirSync(out, { recursive: true });
const OWNER = {
  email: "owner@example.com",
  password: process.env.OWNER_PASSWORD ?? "LocalOwner!2026",
};
const WIDTHS = (process.env.WIDTHS ?? "320,375,414").split(",").map(Number);

const PAGES = [
  ["dashboard", "/"],
  ["orders", "/orders"],
  ["products", "/products"],
  ["product-new", "/products/new"],
  ["categories", "/categories"],
  ["reviews", "/reviews?status=approved"],
  ["customers", "/customers"],
  ["messages", "/messages?status=read"],
  ["settings", "/settings"],
  ["settings-commerce", "/settings/commerce"],
  ["settings-homepage", "/settings/homepage"],
  ["users", "/users"],
  ["roles", "/roles"],
  ["audit", "/audit"],
  ["account", "/account"],
];

const browser = await chromium
  .launch()
  .catch(() => chromium.launch({ channel: "msedge" }))
  .catch(() => chromium.launch({ channel: "chrome" }));

function inspect() {
  const vw = document.documentElement.clientWidth;
  const problems = [];
  const describe = (el) => {
    const cls =
      typeof el.className === "string" ? el.className.split(/\s+/).slice(0, 4).join(".") : "";
    const text = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
    return `${el.tagName.toLowerCase()}${cls ? "." + cls : ""}${text ? ` "${text}"` : ""}`;
  };
  const clipped = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      if (/(hidden|clip|auto|scroll)/.test(getComputedStyle(p).overflowX)) return true;
    }
    return false;
  };
  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || s.display === "none" || Number(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const pageOverflow = document.documentElement.scrollWidth - vw;
  if (pageOverflow > 0) problems.push(`page scrolls sideways by ${pageOverflow}px`);
  for (const el of document.querySelectorAll("body *")) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    if ((r.right > vw + 1 || r.left < -1) && !clipped(el) && s.position !== "fixed") {
      problems.push(
        `sticks out of screen (${Math.round(r.left)}→${Math.round(r.right)}): ${describe(el)}`,
      );
    }
    if (
      el.children.length === 0 &&
      el.textContent?.trim() &&
      s.overflowX === "visible" &&
      el.scrollWidth > el.clientWidth + 2 &&
      el.clientWidth > 0
    ) {
      problems.push(
        `text overflows its box (${el.scrollWidth}>${el.clientWidth}): ${describe(el)}`,
      );
    }
    if (
      /(auto|scroll)/.test(s.overflowX) &&
      el.scrollWidth > el.clientWidth + 8 &&
      el.querySelector("table, input, select, textarea")
    ) {
      problems.push(
        `needs horizontal scrolling (${el.scrollWidth}px in ${el.clientWidth}px): ${describe(el)}`,
      );
    }
  }
  for (const el of document.querySelectorAll(
    "a[href], button, input:not([type=hidden]), select, textarea, [role=tab]",
  )) {
    if (!visible(el) || el.closest("[aria-hidden=true]")) continue;
    const r =
      el.tagName === "INPUT" && el.closest("label")
        ? el.closest("label").getBoundingClientRect()
        : el.getBoundingClientRect();
    const inline = el.tagName === "A" && getComputedStyle(el).display === "inline";
    if ((r.width < 24 || r.height < 24) && !inline)
      problems.push(
        `small tap target ${Math.round(r.width)}×${Math.round(r.height)}: ${describe(el)}`,
      );
  }
  return [...new Set(problems)].slice(0, 30);
}

const report = [];
async function audit(page, name, width, fullPage = true) {
  await page.waitForTimeout(1500);
  const problems = await page.evaluate(inspect);
  report.push({ name, width, problems });
  if (width === 375) await page.screenshot({ path: `${out}/${name}.png`, fullPage });
}

for (const width of WIDTHS) {
  const ctx = await browser.newContext({
    viewport: { width, height: 800 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(`${base}/login`, { waitUntil: "load", timeout: 180_000 });
  await audit(page, "login", width);
  await page.fill("#email", OWNER.email);
  await page.fill("#password", OWNER.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => u.pathname === "/", { timeout: 180_000, waitUntil: "commit" });

  for (const [name, path] of PAGES) {
    await page.goto(`${base}${path}`, { waitUntil: "load", timeout: 180_000 });
    await audit(page, name, width);
  }

  // Order detail selected (inbox on mobile)
  await page.goto(`${base}/orders`, { waitUntil: "load", timeout: 180_000 });
  const firstOrder = page.locator('[aria-label="Orders"] li button').nth(1);
  if (await firstOrder.count()) {
    await firstOrder.click();
    await page.waitForTimeout(2500);
    await audit(page, "order-selected", width, false);
  }
  // Existing product editor
  await page.goto(`${base}/products`, { waitUntil: "load", timeout: 180_000 });
  const link = page
    .locator('main a[href^="/products/"]:not([href="/products/new"])')
    .filter({ visible: true })
    .first();
  if (await link.count()) {
    await link.click();
    await page.waitForURL(/\/products\/[0-9a-f-]{36}$/, { timeout: 180_000 });
    await audit(page, "product-edit", width);
  }
  // Customer detail
  await page.goto(`${base}/customers`, { waitUntil: "load", timeout: 180_000 });
  const cust = page.locator('main a[href^="/customers/"]').filter({ visible: true }).first();
  if (await cust.count()) {
    await cust.click();
    await page.waitForURL(/\/customers\/[0-9a-f-]{36}$/, { timeout: 180_000 });
    await audit(page, "customer-detail", width);
  }
  // Role editor (permission matrix)
  await page.goto(`${base}/roles`, { waitUntil: "load", timeout: 180_000 });
  const role = page.locator('a[href^="/roles/"]').first();
  if (await role.count()) {
    await role.click();
    await page.waitForURL(/\/roles\/.+/, { timeout: 180_000 });
    await audit(page, "role-edit", width);
  }

  // Overlays
  await page.goto(`${base}/`, { waitUntil: "load", timeout: 180_000 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await audit(page, "overlay-nav", width, false);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Search" }).first().click();
  await page.keyboard.type("oak");
  await audit(page, "overlay-search", width, false);
  await page.keyboard.press("Escape");
  await page.goto(`${base}/users`, { waitUntil: "load", timeout: 180_000 });
  const invite = page.getByRole("button", { name: "Invite user" });
  if (await invite.count()) {
    await invite.click();
    await audit(page, "overlay-invite", width, false);
    await page.keyboard.press("Escape");
  }
  await ctx.close();
}

await browser.close();
let total = 0;
for (const r of report) {
  if (!r.problems.length) continue;
  total += r.problems.length;
  console.log(`\n${r.name} @${r.width}px`);
  for (const p of r.problems) console.log(`  - ${p}`);
}
console.log(
  `\n${total ? `${total} issue(s)` : "No responsive issues found"} across ${report.length} page/width combinations`,
);
