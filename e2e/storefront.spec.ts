import { expect, test } from "@playwright/test";
import { fillCheckout } from "./helpers";
import { STORE_URL } from "./playwright.config";

test.use({ baseURL: STORE_URL });

test.describe("storefront purchase flows", () => {
  test("home → PDP variant → cart → COD checkout → tracking", async ({ page, browser }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.goto("/products/halo-ceramic-vase-trio");
    await page.getByRole("radio", { name: /^Sage/ }).click();
    await page.getByRole("button", { name: "Increase quantity" }).first().click();
    await page
      .getByRole("button", { name: /^Add to cart$/ })
      .first()
      .click();
    const drawer = page.getByRole("dialog", { name: /Your cart/ });
    await expect(drawer).toContainText("Color: Sage");
    await page.keyboard.press("Escape");

    await page.goto("/checkout");
    await fillCheckout(page, { email: "e2e.cod@example.com", payment: "cod" });
    await page.getByRole("button", { name: /Place order/ }).click();
    await page.waitForURL(/\/order\/.+\/success/);
    const orderNumber = /\/order\/([^/]+)\/success/.exec(page.url())?.[1] ?? "";
    expect(orderNumber).toMatch(/^[A-Z]{2,5}-\d{8}-[A-Z0-9]{4}$/);
    await expect(page.locator("[data-cart-target]")).toHaveAttribute("aria-label", /0 items/);

    await page.goto(`/track/${orderNumber}`);
    await expect(page.getByText("Order placed").first()).toBeVisible();

    // A different browser has no access cookie: lookup required, wrong email refused.
    const other = await browser.newContext();
    const p2 = await other.newPage();
    await p2.goto(`${STORE_URL}/track/${orderNumber}`);
    await p2.waitForURL(/\/track\?order=/);
    await p2.fill("#trackEmail", "someone.else@example.com");
    await p2.getByRole("button", { name: "Track order" }).click();
    await expect(p2.getByText(/couldn’t find an order/)).toBeVisible();
    await p2.fill("#trackEmail", "e2e.cod@example.com");
    await p2.getByRole("button", { name: "Track order" }).click();
    await p2.waitForURL(new RegExp(`/track/${orderNumber}$`));
    await other.close();
  });

  test("buy now with demo card: decline, then success", async ({ page }) => {
    await page.goto("/products/fern-amber-glass-candle");
    await page.getByRole("button", { name: "Buy it now" }).click();
    await page.waitForURL(/\/checkout\?buy=/);
    await fillCheckout(page, {
      email: "e2e.card@example.com",
      payment: "card",
      card: "4000 0000 0000 0002",
    });
    await page.getByRole("button", { name: /Place order/ }).click();
    await expect(page.getByText(/declined/i).first()).toBeVisible();
    await page.fill('[id="card.number"]', "4242 4242 4242 4242");
    await page.getByRole("button", { name: /Place order/ }).click();
    await page.waitForURL(/\/order\/.+\/success/);
  });

  test("checkout validates required fields", async ({ page }) => {
    await page.goto("/products/fern-amber-glass-candle");
    await page.getByRole("button", { name: "Buy it now" }).click();
    await page.waitForURL(/\/checkout\?buy=/);
    await page.getByRole("button", { name: /Place order/ }).click();
    await expect(page.getByRole("alert").first()).toBeVisible();
    expect(page.url()).toContain("/checkout");
  });

  test("listing filters, contact form and review submission", async ({ page }) => {
    await page.goto("/products?color=Sage&sort=price_asc");
    await expect(page.getByText(/\d+ products?$/).first()).toBeVisible();

    await page.goto("/contact");
    await page.getByLabel("Name", { exact: true }).fill("E2E Tester");
    await page.getByLabel("Email", { exact: true }).fill("e2e@example.com");
    await page.getByLabel("Subject").fill("Hello from the E2E suite");
    await page
      .getByLabel("Message")
      .fill("Checking that the contact form saves messages correctly.");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Message sent")).toBeVisible();

    await page.goto("/products/olive-wood-spoon-set");
    await page.getByRole("button", { name: "Write a review" }).click();
    await page.getByRole("radio", { name: "5 stars" }).click();
    await page.getByLabel("Name").fill("E2E Reviewer");
    await page.getByLabel("Email (never shown)").fill("reviewer@example.com");
    await page.getByLabel("Review title").fill("Lovely spoons");
    await page.getByLabel("Your review").fill("Beautiful grain and they feel great in the hand.");
    await page.getByRole("button", { name: "Submit review" }).click();
    await expect(page.getByText(/will appear once approved/)).toBeVisible();
  });

  test("unknown product shows the 404 page", async ({ page }) => {
    const res = await page.goto("/products/does-not-exist");
    expect(res?.status()).toBe(404);
  });
});
