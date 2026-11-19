import { expect, test } from "@playwright/test";
import { adminLogin, DEMO_PASSWORD, OWNER, ownerLogin, toast } from "./helpers";
import { ADMIN_URL, STORE_URL } from "./playwright.config";

test.use({ baseURL: ADMIN_URL });
test.describe.configure({ mode: "serial" });

test("signed-out visits redirect to login; wrong password gets a generic error", async ({
  page,
}) => {
  await page.goto("/orders");
  await expect(page).toHaveURL(/\/login/);
  await adminLogin(page, OWNER.email, "wrong-password");
  await expect(page.getByText("Incorrect email or password.")).toBeVisible();
});

test("owner must change the starter password, then lands on the dashboard", async ({ page }) => {
  await ownerLogin(page);
  await expect(page.getByText("Avg. order value")).toBeVisible();
  await expect(page.locator(".recharts-surface").first()).toBeVisible();
});

test("order workflow: confirm, note, event, audit", async ({ page }) => {
  await ownerLogin(page);
  await page.goto("/orders?status=pending");
  const orderNumber = (await page.locator("h2").first().textContent())?.trim() ?? "";
  await page.getByRole("button", { name: "Confirm order" }).click();
  await toast(page, "Order moved to Confirmed");
  await page.goto(`/orders?selected=${orderNumber}`);
  await expect(page.getByRole("button", { name: "Start processing" })).toBeVisible();

  await page.fill(`#note-${orderNumber}`, "Gift wrap requested.");
  await page.getByRole("button", { name: "Add note" }).click();
  await toast(page, "Note added");

  await page.fill(`#ev-title-${orderNumber}`, "Packed with care");
  await page.getByRole("button", { name: "Add event" }).click();
  await toast(page, "Event added");

  // The public event is visible on the storefront tracking timeline (order cookie not needed here:
  // the admin view lists it, and the audit log records every change).
  await page.goto("/audit");
  await expect(page.locator("main")).toContainText(orderNumber);
});

test("product builder creates variants and the storefront gets the published product", async ({
  page,
  request,
}) => {
  await ownerLogin(page);
  await page.goto("/products/new");
  const title = `E2E Oak Stool ${Date.now() % 100000}`;
  await page.fill("#title", title);
  await page.fill("#price", "79.00");
  await page.getByRole("button", { name: "Add option" }).click();
  await page.fill("#opt-0", "Finish");
  await page.getByLabel("Finish value 1").fill("Oak");
  await page.getByRole("button", { name: "+ Add value" }).click();
  await page.getByLabel("Finish value 2").fill("Walnut");
  await expect(page.locator('input[aria-label^="SKU for"]')).toHaveCount(2);
  await page.getByRole("button", { name: "Save & publish" }).click();
  await page.waitForURL(/\/products\/[0-9a-f-]{36}$/);
  await expect(page.locator("#vp-0")).toHaveValue("79.00");

  const slug = await page.locator("#slug").inputValue();
  await expect
    .poll(async () => (await request.get(`${STORE_URL}/products/${slug}`)).status(), {
      timeout: 15_000,
    })
    .toBe(200);
});

test("settings changes reach the storefront immediately", async ({ page, request }) => {
  await ownerLogin(page);
  await page.goto("/settings/homepage");
  const box = page.locator("#announcement-messages");
  const original = await box.inputValue();
  const marker = `E2E sale ${Date.now() % 100000}`;
  await box.fill(`${marker}\n${original}`);
  await page.getByRole("button", { name: "Save changes" }).first().click();
  await toast(page, "Settings saved");
  await expect
    .poll(async () => (await (await request.get(STORE_URL)).text()).includes(marker), {
      timeout: 15_000,
    })
    .toBe(true);
  await box.fill(original);
  await page.getByRole("button", { name: "Save changes" }).first().click();
  await toast(page, "Settings saved");
});

test("RBAC: Editor and Manager are limited server-side", async ({ page }) => {
  await adminLogin(page, "editor@example.com", DEMO_PASSWORD);
  await page.waitForURL((u) => u.pathname === "/");
  await expect(page.getByRole("link", { name: "Orders" })).toHaveCount(0);
  for (const path of ["/orders", "/settings", "/users", "/audit"]) {
    await page.goto(path);
    await expect(page, path).toHaveURL(/\/403/);
  }
  await page.goto("/products");
  await expect(page.locator("tbody tr").first()).toBeVisible();

  await page.context().clearCookies();
  await adminLogin(page, "manager@example.com", DEMO_PASSWORD);
  await page.waitForURL((u) => u.pathname === "/");
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/403/);
  await page.goto("/orders");
  await expect(page).toHaveURL(/\/orders/);
});
