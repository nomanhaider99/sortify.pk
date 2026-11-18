// Visual check helper: captures storefront states for comparison with the reference images.
//   node scripts/screenshot.mjs [baseUrl] [outDir]
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const base = process.argv[2] ?? "http://localhost:3000";
const out = process.argv[3] ?? "screenshots";
mkdirSync(out, { recursive: true });

// Prefer the bundled Chromium; fall back to an installed Edge/Chrome (e.g. on Windows).
const browser = await chromium
  .launch()
  .catch(() => chromium.launch({ channel: "msedge" }))
  .catch(() => chromium.launch({ channel: "chrome" }));
const errors = [];

async function session(name, viewport, steps) {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", (e) => errors.push(`[${name}] pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`[${name}] console: ${m.text()}`);
  });
  await steps(page, async (label) => {
    await page.screenshot({ path: join(out, `${name}-${label}.png`) });
  });
  await page.close();
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

await session("desktop", { width: 1365, height: 768 }, async (page, shot) => {
  await page.goto(base, { waitUntil: "load" });
  await wait(1500);
  await shot("home-top");
  await page.mouse.wheel(0, 500);
  await wait(900);
  await page.mouse.wheel(0, -120);
  await wait(900);
  await shot("home-scrolled-up");
  await page.mouse.wheel(0, 600);
  await wait(900);
  await shot("home-scrolled-down");
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(800);
  await page.getByRole("button", { name: "Open menu" }).click();
  await wait(1600);
  await shot("menu");
  await page.keyboard.press("Escape");
  await wait(900);
  await page.getByRole("button", { name: "Search" }).click();
  await wait(700);
  await page.keyboard.type("sofa");
  await wait(1500);
  await shot("search");
  await page.keyboard.press("Escape");
  await page.goto(`${base}/does-not-exist`, { waitUntil: "load" });
  await wait(1200);
  await shot("404");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await wait(1500);
  await shot("footer");
});

await session("mobile", { width: 390, height: 844 }, async (page, shot) => {
  await page.goto(base, { waitUntil: "load" });
  await wait(1500);
  await shot("home-top");
  await page.getByRole("button", { name: "Open menu" }).click();
  await wait(1500);
  await shot("menu");
  await page.getByRole("button", { name: "Categories" }).click();
  await wait(900);
  await shot("menu-expanded");
});

await browser.close();
console.log(errors.length ? errors.join("\n") : "no page errors");
