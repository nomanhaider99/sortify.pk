// Admin security smoke test (auth, forced password change, invite, RBAC, audit, lockout, revocation).
//   node scripts/admin-smoke.mjs [adminUrl] [screenshotDir]
// Run against a freshly seeded *local* database — it changes the Owner password and creates a user.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3101";
const out = process.argv[3] ?? "screenshots";
mkdirSync(out, { recursive: true });
const OWNER = { email: "owner@example.com", password: "ChangeMe!123", next: "NewOwnerPass!456" };
const SARA = {
  name: "Sara Editor",
  email: `sara.${Date.now()}@example.com`,
  password: "SaraPass!2026x",
};

const browser = await chromium
  .launch()
  .catch(() => chromium.launch({ channel: "msedge" }))
  .catch(() => chromium.launch({ channel: "chrome" }));
const results = [];
const errors = [];
const check = (name, ok, detail = "") =>
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const watch = (page, tag) => page.on("pageerror", (e) => errors.push(`[${tag}] ${e.message}`));

async function login(page, email, password) {
  await page.goto(`${base}/login`, { waitUntil: "load" });
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await wait(2500);
}

// ── Owner ───────────────────────────────────────────────────────────────────
const ownerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const owner = await ownerCtx.newPage();
watch(owner, "owner");

await owner.goto(`${base}/users`, { waitUntil: "load" });
check("Signed-out visit redirects to /login", owner.url().includes("/login"));

await login(owner, OWNER.email, "wrong-password");
check(
  "Wrong password is refused (generic message)",
  (await owner.getByText("Incorrect email or password.").count()) > 0,
);

await login(owner, OWNER.email, OWNER.password);
await owner
  .waitForURL((u) => u.pathname === "/account/password", { timeout: 8000 })
  .catch(() => {});
check(
  "Starter password forces a change",
  (await owner.getByText("Set a new password to continue").count()) > 0,
  owner.url(),
);
await owner.screenshot({ path: `${out}/admin-01-forced-change.png` });
await owner.fill("#current", OWNER.password);
await owner.fill("#password", OWNER.next);
await owner.fill("#confirm", OWNER.next);
await owner.getByRole("button", { name: "Update password" }).click();
await wait(3000);
check("Password change signs out", owner.url().includes("/login"), owner.url());

await login(owner, OWNER.email, OWNER.next);
check("Owner signs in with the new password", new URL(owner.url()).pathname === "/", owner.url());
await owner.screenshot({ path: `${out}/admin-02-dashboard.png` });

await owner.goto(`${base}/users`, { waitUntil: "load" });
await owner.getByRole("button", { name: "Invite user" }).click();
await owner.fill("#invite-name", SARA.name);
await owner.fill("#invite-email", SARA.email);
await owner.selectOption("#invite-role", { label: "Editor" });
await owner.getByRole("button", { name: "Create invite" }).click();
await wait(2000);
const inviteLink = await owner
  .getByLabel("One-time link")
  .inputValue()
  .catch(() => "");
check(
  "Invite creates a one-time link",
  /\/invite\/[A-Za-z0-9_-]{20,}$/.test(inviteLink),
  inviteLink.slice(0, 60),
);
await owner.screenshot({ path: `${out}/admin-03-invite.png` });
await owner.keyboard.press("Escape");

// ── Sara (Editor) ───────────────────────────────────────────────────────────
const saraCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const sara = await saraCtx.newPage();
watch(sara, "sara");
const invitePath = new URL(inviteLink).pathname;
await sara.goto(`${base}${invitePath}`, { waitUntil: "load" });
await sara.fill("#password", SARA.password);
await sara.fill("#confirm", SARA.password);
await sara.getByRole("button", { name: "Activate account" }).click();
await wait(2500);
check("Invite accepted → back to login", sara.url().includes("/login?set=1"), sara.url());
await sara.goto(`${base}${invitePath}`, { waitUntil: "load" });
check("Invite link cannot be reused", (await sara.getByText("Invite link expired").count()) > 0);

await login(sara, SARA.email, SARA.password);
const nav = (await sara.getByRole("navigation", { name: "Admin" }).first().textContent()) ?? "";
check(
  "Editor sees Products/Categories/Reviews only",
  /Products/.test(nav) &&
    /Categories/.test(nav) &&
    /Reviews/.test(nav) &&
    !/Orders|Users|Audit|Settings|Customers/.test(nav),
  nav.replace(/\s+/g, " ").slice(0, 120),
);
await sara.screenshot({ path: `${out}/admin-04-editor.png` });
await sara.goto(`${base}/users`, { waitUntil: "load" });
check("Editor gets 403 on /users", sara.url().endsWith("/403"), sara.url());
await sara.screenshot({ path: `${out}/admin-05-403.png` });

// ── Audit + roles ───────────────────────────────────────────────────────────
await owner.goto(`${base}/audit`, { waitUntil: "load" });
const auditText = (await owner.locator("main").textContent()) ?? "";
check(
  "Audit log records invite, acceptance and password change",
  ["user.invited", "user.invite_accepted", "user.password_changed"].every((a) =>
    auditText.includes(a),
  ),
);
await owner.screenshot({ path: `${out}/admin-06-audit.png` });
await owner.goto(`${base}/roles`, { waitUntil: "load" });
await owner.getByRole("link", { name: "Editor", exact: true }).click();
await wait(1500);
await owner.screenshot({ path: `${out}/admin-07-role-matrix.png`, fullPage: true });

// ── Revocation: disabling Sara ends her session immediately ─────────────────
await owner.goto(`${base}/users`, { waitUntil: "load" });
await owner.getByRole("button", { name: `Actions for ${SARA.name}` }).click();
await owner.getByRole("menuitem", { name: "Disable account" }).click();
await wait(2000);
await sara.goto(`${base}/`, { waitUntil: "load" });
await wait(1000);
check("Disabled user is signed out on next request", sara.url().includes("/login"), sara.url());

// ── Lockout ─────────────────────────────────────────────────────────────────
const lockCtx = await browser.newContext();
const lock = await lockCtx.newPage();
for (let i = 0; i < 5; i++) await login(lock, "viewer@example.com", `bad-${i}`);
await login(lock, "viewer@example.com", "DemoPass!123");
check(
  "Lockout after 5 failures (even with the right password)",
  (await lock.getByText(/Too many failed attempts/).count()) > 0,
);

await browser.close();
console.log(results.join("\n"));
console.log(errors.length ? `\nPage errors:\n${errors.join("\n")}` : "\nNo page errors");
