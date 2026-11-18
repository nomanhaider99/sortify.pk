/**
 * Renders neutral, original placeholder images (simple furniture silhouettes on muted tiles)
 * into `storefront/public/seed/`. No external or copyrighted imagery is used.
 *
 *   pnpm --filter @repo/db placeholders
 *
 * Swap any file for a real photo with the same name to upgrade the demo.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  CATEGORIES,
  PRODUCTS,
  productImageName,
  type FurnitureKind,
  type SeedColor,
} from "../src/seed/data";

const OUT = fileURLToPath(new URL("../../../storefront/public/seed/", import.meta.url));

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) =>
    Math.max(0, Math.min(255, Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount)));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const WOOD = "#8A6446";
const BRASS = "#B89A5E";

/** Draws a furniture silhouette centred in a 1200×1500 canvas. */
function furniture(kind: FurnitureKind, c: string): string {
  const d = shade(c, -0.18);
  const l = shade(c, 0.12);
  const shadow = `<ellipse cx="600" cy="1080" rx="380" ry="34" fill="#000" opacity="0.08"/>`;
  const legs = (xs: number[], y: number, h: number, col = WOOD, w = 18) =>
    xs
      .map(
        (x) => `<rect x="${x - w / 2}" y="${y}" width="${w}" height="${h}" rx="6" fill="${col}"/>`,
      )
      .join("");
  switch (kind) {
    case "armchair":
      return `${shadow}${legs([330, 870], 940, 140)}
        <rect x="270" y="560" width="660" height="330" rx="120" fill="${d}"/>
        <rect x="230" y="700" width="160" height="300" rx="70" fill="${c}"/>
        <rect x="810" y="700" width="160" height="300" rx="70" fill="${c}"/>
        <rect x="350" y="800" width="500" height="170" rx="60" fill="${l}"/>`;
    case "swivel":
      return `${shadow}<rect x="500" y="980" width="200" height="90" rx="20" fill="${BRASS}"/>
        <path d="M300 760 Q300 520 600 520 Q900 520 900 760 L900 900 Q900 990 800 990 L400 990 Q300 990 300 900 Z" fill="${d}"/>
        <rect x="370" y="800" width="460" height="170" rx="70" fill="${l}"/>`;
    case "wingback":
      return `${shadow}${legs([360, 840], 960, 120)}
        <path d="M330 980 L330 470 Q330 400 400 400 L800 400 Q870 400 870 470 L870 980 Z" fill="${d}"/>
        <path d="M260 600 Q260 520 340 540 L340 980 L260 980 Z" fill="${c}"/>
        <path d="M940 600 Q940 520 860 540 L860 980 L940 980 Z" fill="${c}"/>
        <rect x="340" y="800" width="520" height="170" rx="40" fill="${l}"/>`;
    case "dining-chair":
      return `${shadow}${legs([420, 780], 860, 220, WOOD, 20)}
        <path d="M410 520 Q600 470 790 520 L790 620 Q600 580 410 620 Z" fill="${d}"/>
        ${legs([430, 770], 600, 260, WOOD, 18)}
        <rect x="390" y="820" width="420" height="70" rx="24" fill="${c}"/>`;
    case "stool":
      return `${shadow}${legs([480, 720], 760, 320, c, 22)}
        <rect x="470" y="930" width="260" height="16" rx="8" fill="${d}"/>
        <path d="M430 720 Q600 680 770 720 L770 770 L430 770 Z" fill="${d}"/>`;
    case "sofa":
      return `${shadow}${legs([230, 970], 960, 110)}
        <rect x="190" y="620" width="820" height="300" rx="80" fill="${d}"/>
        <rect x="140" y="720" width="150" height="270" rx="60" fill="${c}"/>
        <rect x="910" y="720" width="150" height="270" rx="60" fill="${c}"/>
        <rect x="270" y="820" width="320" height="150" rx="50" fill="${l}"/>
        <rect x="610" y="820" width="320" height="150" rx="50" fill="${l}"/>`;
    case "loveseat":
      return `${shadow}<rect x="300" y="1000" width="600" height="60" rx="16" fill="${BRASS}"/>
        <path d="M230 800 Q230 590 600 590 Q970 590 970 800 L970 960 Q970 1010 920 1010 L280 1010 Q230 1010 230 960 Z" fill="${d}"/>
        <rect x="300" y="830" width="290" height="150" rx="60" fill="${l}"/>
        <rect x="610" y="830" width="290" height="150" rx="60" fill="${l}"/>`;
    case "coffee-table":
      return `${shadow}<rect x="230" y="800" width="740" height="70" rx="35" fill="${c}"/>
        ${legs([300, 900], 860, 210, d, 34)}
        <rect x="300" y="980" width="600" height="30" rx="12" fill="${d}"/>`;
    case "dining-table":
      return `${shadow}<rect x="170" y="680" width="860" height="60" rx="20" fill="${c}"/>
        <path d="M290 740 L250 1070 L290 1070 L340 740 Z M910 740 L950 1070 L910 1070 L860 740 Z" fill="${d}"/>
        <rect x="300" y="900" width="600" height="22" rx="10" fill="${d}"/>`;
    case "round-table":
      return `${shadow}<ellipse cx="600" cy="690" rx="380" ry="60" fill="${c}"/>
        <path d="M560 740 Q520 900 470 1060 L730 1060 Q680 900 640 740 Z" fill="${d}"/>`;
    case "console":
    case "sideboard": {
      const w = kind === "console" ? 860 : 780;
      const x = 600 - w / 2;
      const top = kind === "console" ? 760 : 660;
      const doors = kind === "console" ? 3 : 4;
      const dw = (w - 40) / doors;
      return `${shadow}${legs([x + 50, x + w - 50], 1000, 80, d, 22)}
        <rect x="${x}" y="${top}" width="${w}" height="${1010 - top}" rx="14" fill="${c}"/>
        ${Array.from({ length: doors }, (_, i) => `<rect x="${x + 20 + i * dw + 6}" y="${top + 24}" width="${dw - 12}" height="${1010 - top - 48}" rx="8" fill="${l}"/>`).join("")}`;
    }
    case "nightstand":
      return `${shadow}${legs([480, 720], 990, 80, d, 20)}
        <rect x="440" y="730" width="320" height="280" rx="16" fill="${c}"/>
        <rect x="465" y="760" width="270" height="100" rx="10" fill="${l}"/>
        <rect x="465" y="880" width="270" height="100" rx="10" fill="${l}"/>`;
    case "dresser":
      return `${shadow}${legs([340, 860], 1000, 80, d, 22)}
        <rect x="300" y="620" width="600" height="390" rx="16" fill="${c}"/>
        ${[0, 1, 2].flatMap((r) => [0, 1].map((col) => `<rect x="${325 + col * 280}" y="${645 + r * 120}" width="270" height="100" rx="10" fill="${l}"/>`)).join("")}`;
    case "wardrobe":
      return `${shadow}${legs([420, 780], 1030, 50, d, 22)}
        <rect x="380" y="300" width="440" height="740" rx="16" fill="${c}"/>
        <rect x="400" y="320" width="190" height="700" rx="8" fill="${l}"/>
        <rect x="610" y="320" width="190" height="700" rx="8" fill="${l}"/>
        <rect x="575" y="620" width="8" height="110" rx="4" fill="${d}"/><rect x="617" y="620" width="8" height="110" rx="4" fill="${d}"/>`;
    case "bed":
      return `${shadow}<rect x="150" y="520" width="900" height="420" rx="40" fill="${d}"/>
        <rect x="120" y="860" width="960" height="150" rx="30" fill="${c}"/>
        <rect x="160" y="800" width="880" height="110" rx="40" fill="#F4F1EA"/>
        <rect x="230" y="720" width="300" height="110" rx="50" fill="#FBFAF6"/>
        <rect x="670" y="720" width="300" height="110" rx="50" fill="#FBFAF6"/>
        ${legs([190, 1010], 1000, 70, WOOD, 24)}`;
    case "bench":
      return `${shadow}${legs([300, 900], 860, 210, WOOD, 22)}
        <rect x="240" y="780" width="720" height="110" rx="36" fill="${c}"/>
        <rect x="260" y="770" width="680" height="40" rx="20" fill="${l}"/>`;
    case "lamp":
      return `${shadow}<circle cx="600" cy="420" r="230" fill="#FFF6DF" opacity="0.6"/>
        <path d="M440 300 L760 300 L820 520 L380 520 Z" fill="${c}"/>
        <rect x="592" y="520" width="16" height="520" fill="${WOOD}"/>
        <ellipse cx="600" cy="1050" rx="120" ry="22" fill="${shade(WOOD, -0.2)}"/>`;
  }
}

function tile(kind: FurnitureKind, color: string, view: 1 | 2): string {
  const bg = view === 1 ? "#F1EEE6" : "#E9E4D8";
  const transform =
    view === 2 ? `transform="translate(600 760) scale(1.28) translate(-600 -760)"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
    <rect width="1200" height="1500" fill="${bg}"/>
    ${view === 2 ? `<rect y="1080" width="1200" height="420" fill="#E2DCCD"/>` : ""}
    <g ${transform}>${furniture(kind, color)}</g>
  </svg>`;
}

function categoryTile(kind: FurnitureKind, tone: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200" viewBox="0 0 1600 1200">
    <defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9E3D6"/><stop offset="1" stop-color="#DCD4C3"/></linearGradient></defs>
    <rect width="1600" height="1200" fill="url(#w)"/>
    <rect y="900" width="1600" height="300" fill="#CFC5B1"/>
    <rect x="1180" y="160" width="260" height="520" rx="8" fill="#F6F2E9" opacity="0.7"/>
    <g transform="translate(200 -180) scale(1)">${furniture(kind, tone)}</g>
  </svg>`;
}

function hero(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1500" viewBox="0 0 2400 1500">
    <defs>
      <linearGradient id="wall" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#3A332B"/><stop offset="0.5" stop-color="#4A4136"/><stop offset="1" stop-color="#2B2620"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#F3D9A4" stop-opacity="0.55"/><stop offset="1" stop-color="#F3D9A4" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="win" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#C9C7B4"/><stop offset="1" stop-color="#8E9A7A"/>
      </linearGradient>
    </defs>
    <rect width="2400" height="1500" fill="url(#wall)"/>
    ${Array.from({ length: 22 }, (_, i) => `<rect x="${980 + i * 26}" y="0" width="10" height="1100" fill="#000" opacity="0.12"/>`).join("")}
    <rect x="120" y="120" width="520" height="980" fill="url(#win)" opacity="0.55"/>
    <rect x="370" y="120" width="12" height="980" fill="#2B2620" opacity="0.6"/>
    <rect x="1760" y="180" width="460" height="900" fill="#2A241E"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="1780" y="${220 + i * 220}" width="420" height="10" fill="#C89B5A" opacity="0.8"/><circle cx="1990" cy="${200 + i * 220}" r="160" fill="url(#glow)"/>`).join("")}
    <rect y="1100" width="2400" height="400" fill="#2A241F"/>
    <circle cx="560" cy="700" r="260" fill="#3F4A2E" opacity="0.75"/>
    <circle cx="660" cy="560" r="180" fill="#4D5A37" opacity="0.7"/>
    <rect x="590" y="820" width="20" height="300" fill="#3A2E22"/>
    <rect x="500" y="1020" width="200" height="120" rx="20" fill="#5A4A3A"/>
    <rect x="620" y="780" width="1180" height="260" rx="90" fill="#CFC4B2"/>
    <rect x="560" y="900" width="200" height="250" rx="70" fill="#D8CDBA"/>
    <rect x="1660" y="900" width="200" height="250" rx="70" fill="#D8CDBA"/>
    <rect x="740" y="960" width="460" height="170" rx="60" fill="#E2D8C6"/>
    <rect x="1220" y="960" width="460" height="170" rx="60" fill="#E2D8C6"/>
    <rect x="800" y="860" width="160" height="140" rx="40" fill="#9A6B45"/>
    <rect x="1460" y="860" width="160" height="140" rx="40" fill="#9A6B45"/>
    <rect x="900" y="1210" width="620" height="90" rx="20" fill="#3B3530"/>
    <ellipse cx="1210" cy="1200" rx="90" ry="40" fill="#B08F5A"/>
    <circle cx="2050" cy="900" r="260" fill="url(#glow)"/>
    <path d="M1960 1150 Q1940 930 2100 920 Q2240 930 2220 1150 Z" fill="#7A4E33"/>
    <rect width="2400" height="1500" fill="#000" opacity="0.18"/>
  </svg>`;
}

async function write(name: string, svg: string, width: number) {
  const file = join(OUT, name);
  await mkdir(dirname(file), { recursive: true });
  const buf = await sharp(Buffer.from(svg)).resize({ width }).webp({ quality: 82 }).toBuffer();
  await writeFile(file, buf);
}

let count = 0;
for (const p of PRODUCTS) {
  const colors: (SeedColor | null)[] = p.colors ?? [null];
  for (const color of colors) {
    const hex = color?.hex ?? p.tone ?? "#C9BFAE";
    await write(productImageName(p, color, 1), tile(p.kind, hex, 1), 900);
    await write(productImageName(p, color, 2), tile(p.kind, hex, 2), 900);
    count += 2;
  }
}
for (const c of CATEGORIES) {
  await write(`categories/${c.slug}.webp`, categoryTile(c.kind, c.tone), 1400);
  count++;
}
await write("hero.webp", hero(), 2400);
count++;

console.log(`✓ Generated ${count} placeholder images in ${OUT}`);
