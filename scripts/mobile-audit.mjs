// Mobile responsiveness audit for the storefront: every page + overlay at phone widths.
//   node scripts/mobile-audit.mjs [baseUrl] [screenshotDir]
// Reports horizontal page overflow, unclipped elements wider than the viewport, text that
// overflows its own box, and tap targets smaller than 24px. Screenshots are taken at 375px.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3100";
const out = process.argv[3] ?? "screenshots/mobile";
mkdirSync(out, { recursive: true });
const ORDER = {
  number: process.env.AUDIT_ORDER ?? "MJ-20261116-HVYR",
  email: process.env.AUDIT_EMAIL ?? "marcus@example.com",
};
const WIDTHS = [320, 375, 414];

const PAGES = [
  ["home", "/"],
  ["about", "/about"],
  ["contact", "/contact"],
  ["shop", "/products"],
  ["shop-filtered", "/products?color=Sage&sort=price_asc"],
  ["pdp", "/products/halo-ceramic-vase-trio"],
  ["categories", "/categories"],
  ["category", "/categories/side-tables"],
  ["track-form", "/track"],
  ["account", "/account"],
  ["404", "/does-not-exist"],
];

const browser = await chromium
  .launch()
  .catch(() => chromium.launch({ channel: "msedge" }))
  .catch(() => chromium.launch({ channel: "chrome" }));

/** Runs in the page: collects layout problems. */
function inspect() {
  const vw = document.documentElement.clientWidth;
  const problems = [];
  const describe = (el) => {
    const cls =
      typeof el.className === "string" ? el.className.split(/\s+/).slice(0, 4).join(".") : "";
    const text = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
    return `${el.tagName.toLowerCase()}${cls ? "." + cls : ""}${text ? ` "${text}"` : ""}`;
  };
  const clippedByAncestor = (el) => {
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
    if (
      (r.right > vw + 1 || r.left < -1) &&
      !clippedByAncestor(el) &&
      getComputedStyle(el).position !== "fixed"
    ) {
      problems.push(
        `sticks out of screen (${Math.round(r.left)}→${Math.round(r.right)}): ${describe(el)}`,
      );
    }
    // Text overflowing its own box (e.g. long words in a narrow column)
    const s = getComputedStyle(el);
    if (
      el.children.length === 0 &&
      el.textContent?.trim() &&
      s.overflowX === "visible" &&
      el.scrollWidth > el.clientWidth + 2 &&
      el.clientWidth > 0 &&
      !["SVG", "svg", "INPUT"].includes(el.tagName)
    ) {
      problems.push(
        `text overflows its box (${el.scrollWidth}>${el.clientWidth}): ${describe(el)}`,
      );
    }
  }
  for (const el of document.querySelectorAll(
    "a[href], button, input:not([type=hidden]), select, [role=radio], [role=tab]",
  )) {
    if (!visible(el) || el.closest("[aria-hidden=true]")) continue;
    // A control inside a <label> is tapped through the whole label row.
    const r =
      el.tagName === "INPUT" && el.closest("label")
        ? el.closest("label").getBoundingClientRect()
        : el.getBoundingClientRect();
    if (r.width < 24 || r.height < 24) {
      // WCAG 2.2 target size (minimum) allows small inline links inside text
      const inline = el.tagName === "A" && getComputedStyle(el).display === "inline";
      if (!inline)
        problems.push(
          `small tap target ${Math.round(r.width)}×${Math.round(r.height)}: ${describe(el)}`,
        );
    }
  }
  return [...new Set(problems)].slice(0, 25);
}

const report = [];
async function audit(page, name, width) {
  await page.waitForTimeout(1200);
  const problems = await page.evaluate(inspect);
  report.push({ name, width, problems });
  if (width === 375)
    await page.screenshot({ path: `${out}/${name}.png`, fullPage: !name.includes("overlay") });
}

for (const width of WIDTHS) {
  const ctx = await browser.newContext({
    viewport: { width, height: 800 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  for (const [name, path] of PAGES) {
    await page.goto(`${base}${path}`, { waitUntil: "load", timeout: 120_000 });
    await audit(page, name, width);
  }

  // Overlays
  await page.goto(`${base}/`, { waitUntil: "load", timeout: 120_000 });
  await page.getByRole("button", { name: "Open menu" }).click();
  await audit(page, "overlay-menu", width);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Search" }).click();
  await page.keyboard.type("vase");
  await audit(page, "overlay-search", width);
  await page.keyboard.press("Escape");

  await page.goto(`${base}/products`, { waitUntil: "load", timeout: 120_000 });
  await page
    .getByRole("button", { name: /Filters/ })
    .first()
    .click();
  await audit(page, "overlay-filters", width);
  await page.keyboard.press("Escape");

  // Add to cart → drawer, cart page, checkout
  await page.goto(`${base}/products/halo-ceramic-vase-trio`, {
    waitUntil: "load",
    timeout: 120_000,
  });
  await page
    .getByRole("button", { name: /^Add to cart$/ })
    .first()
    .click();
  await page
    .getByRole("dialog", { name: /Your cart/ })
    .waitFor({ timeout: 30_000 })
    .catch(() => {});
  await audit(page, "overlay-cart", width);
  await page.keyboard.press("Escape");
  await page.goto(`${base}/cart`, { waitUntil: "load", timeout: 120_000 });
  await audit(page, "cart", width);
  await page.goto(`${base}/checkout`, { waitUntil: "load", timeout: 120_000 });
  await audit(page, "checkout", width);

  // Tracking page for a real order (lookup sets the access cookie)
  await page.goto(`${base}/track`, { waitUntil: "load", timeout: 120_000 });
  await page.fill("#orderNumber", ORDER.number).catch(() => {});
  await page.fill("#trackEmail", ORDER.email);
  await page.getByRole("button", { name: "Track order" }).click();
  await page.waitForURL(new RegExp(`/track/${ORDER.number}$`), { timeout: 60_000 }).catch(() => {});
  await audit(page, "track-timeline", width);
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
