import { expect, test } from "@playwright/test";
import { STORE_URL } from "./playwright.config";

test.use({ baseURL: STORE_URL, reducedMotion: "reduce" });

test("reduced motion: headings and content are visible without animation", async ({ page }) => {
  for (const path of ["/", "/about", "/products"]) {
    await page.goto(path);
    const heading = page.getByRole("heading", { level: 1 }).first();
    await expect(heading).toBeVisible();
    // Nothing should be left mid-transform or transparent waiting for an animation.
    const hidden = await page.evaluate(
      () =>
        [...document.querySelectorAll("main h1, main h2")].filter((el) => {
          const s = getComputedStyle(el);
          return (
            Number(s.opacity) < 0.99 ||
            (s.transform !== "none" && !s.transform.startsWith("matrix(1, 0, 0, 1, 0, 0)"))
          );
        }).length,
    );
    expect(hidden, `${path}: headings hidden or transformed under reduced motion`).toBe(0);
  }
});

test("mobile layout has no horizontal scroll", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of [
    "/",
    "/products",
    "/products/halo-ceramic-vase-trio",
    "/checkout",
    "/about",
  ]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${path} overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(0);
  }
});
