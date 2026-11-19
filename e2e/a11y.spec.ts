import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { ownerLogin } from "./helpers";
import { ADMIN_URL, STORE_URL } from "./playwright.config";

/** WCAG 2.2 A/AA scan; fails on serious or critical violations. */
async function scan(page: Page) {
  // Let entrance animations settle so contrast is measured on final colours.
  await page.waitForTimeout(1500);
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const blocking = result.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  const report = blocking.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes
        .map((n) => n.target.join(" "))
        .slice(0, 5)
        .join("\n  ")}`,
  );
  expect(report, report.join("\n")).toEqual([]);
}

const STORE_PAGES = [
  "/",
  "/products",
  "/products/halo-ceramic-vase-trio",
  "/categories",
  "/cart",
  "/checkout",
  "/about",
  "/contact",
  "/track",
];

for (const path of STORE_PAGES) {
  test(`storefront ${path} has no serious a11y violations`, async ({ page }) => {
    await page.goto(`${STORE_URL}${path}`);
    await scan(page);
  });
}

test("admin login has no serious a11y violations", async ({ page }) => {
  await page.goto(`${ADMIN_URL}/login`);
  await scan(page);
});

const ADMIN_PAGES = [
  "/",
  "/orders",
  "/products",
  "/products/new",
  "/categories",
  "/reviews",
  "/customers",
  "/messages",
  "/settings",
  "/users",
  "/audit",
];

for (const path of ADMIN_PAGES) {
  test(`admin ${path} has no serious a11y violations`, async ({ page }) => {
    await ownerLogin(page);
    await page.goto(`${ADMIN_URL}${path}`);
    await scan(page);
  });
}
