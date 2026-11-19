import { expect, type Page } from "@playwright/test";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ADMIN_URL } from "./playwright.config";

export const DEMO_PASSWORD = "DemoPass!123";
export const OWNER = {
  email: "owner@example.com",
  starter: "ChangeMe!123",
  password: "E2eOwnerPass!789",
};

export async function fillCheckout(
  page: Page,
  { email, payment, card }: { email: string; payment: "cod" | "card"; card?: string },
) {
  await page.fill("#email", email);
  await page.fill("#phone", "+1 555 010 2030");
  await page.fill('[id="address.name"]', "Jane Tester");
  await page.fill('[id="address.line1"]', "12 Market Street");
  await page.fill('[id="address.city"]', "Portland");
  await page.fill('[id="address.state"]', "OR");
  await page.fill('[id="address.postalCode"]', "97205");
  await page.fill('[id="address.phone"]', "+1 555 010 2030");
  if (payment === "cod") {
    await page.locator('label[for="pay-cod"]').click();
    return;
  }
  await page.locator('label[for="pay-card"]').click();
  await page.fill('[id="card.number"]', card ?? "4242 4242 4242 4242");
  await page.fill('[id="card.expiry"]', "12 / 30");
  await page.fill('[id="card.cvc"]', "123");
  await page.fill('[id="card.name"]', "Jane Tester");
}

export async function adminLogin(page: Page, email: string, password: string) {
  await page.goto(`${ADMIN_URL}/login`);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

/** Set once the seeded Owner's forced password change is done (global-setup removes it). */
export const OWNER_READY_FLAG = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "test-results",
  ".owner-ready",
);

/**
 * Signs the Owner in, completing the first-login password change if it is still pending.
 * Never guesses: a wrong attempt would count towards the real login lockout.
 */
export async function ownerLogin(page: Page) {
  if (existsSync(OWNER_READY_FLAG)) {
    await adminLogin(page, OWNER.email, OWNER.password);
    await page.waitForURL((u) => u.pathname === "/", { waitUntil: "commit" });
    return;
  }
  await adminLogin(page, OWNER.email, OWNER.starter);
  // The forced change is shown in place of the dashboard (the URL may stay "/").
  await page.getByRole("heading", { name: "Set a new password to continue" }).waitFor();
  await page.fill("#current", OWNER.starter);
  await page.fill("#password", OWNER.password);
  await page.fill("#confirm", OWNER.password);
  await page.getByRole("button", { name: "Update password" }).click();
  await page.waitForURL(/\/login/);
  mkdirSync(path.dirname(OWNER_READY_FLAG), { recursive: true });
  writeFileSync(OWNER_READY_FLAG, "");
  await adminLogin(page, OWNER.email, OWNER.password);
  await page.waitForURL((u) => u.pathname === "/", { waitUntil: "commit" });
}

export const toast = (page: Page, text: string | RegExp) =>
  expect(page.locator("[data-sonner-toast]", { hasText: text }).first()).toBeVisible();
