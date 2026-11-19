import { chromium } from "@playwright/test";
const b = await chromium.launch({ channel: "msedge" });
const out = process.argv[2];
const errs = [];
for (const [name, vp] of [
  ["d", { width: 1440, height: 900 }],
  ["m", { width: 390, height: 844 }],
]) {
  const p = await b.newPage({ viewport: vp });
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto("http://localhost:3100", { waitUntil: "load" });
  await new Promise((r) => setTimeout(r, 2500));
  // Scroll through once so whileInView reveals fire, then capture the full page.
  const h = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 500) {
    await p.mouse.wheel(0, 500);
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 1200));
  await p.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 1000));
  await p.screenshot({ path: `${out}/home-${name}-full.png`, fullPage: true });
  await p.close();
}
console.log(errs.length ? errs.join("\n") : "no page errors");
await b.close();
