/**
 * Downloads every photo in `image-manifest.ts` from Pexels once, converts it to WebP and writes it
 * to `storefront/public/images/`. Also regenerates `docs/image-credits.md`.
 *
 *   pnpm --filter @repo/db images            # skip files that already exist
 *   pnpm --filter @repo/db images --force    # re-download everything
 */
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { ALL_IMAGES, type ManifestImage } from "./image-manifest";

const OUT = fileURLToPath(new URL("../../../storefront/public/images/", import.meta.url));
const CREDITS = fileURLToPath(new URL("../../../docs/image-credits.md", import.meta.url));
const force = process.argv.includes("--force");

async function fetchOne(img: ManifestImage) {
  const file = join(OUT, `${img.name}.webp`);
  if (!force && existsSync(file)) return "skipped";
  const url = `https://images.pexels.com/photos/${img.pexelsId}/pexels-photo-${img.pexelsId}.jpeg?auto=compress&cs=tinysrgb&w=${img.width}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (image fetch for local storefront assets)" },
  });
  if (!res.ok) throw new Error(`${img.name}: HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(file), { recursive: true });
  await writeFile(
    file,
    await sharp(buf)
      .resize({ width: img.width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer(),
  );
  return "downloaded";
}

let done = 0;
const queue = [...ALL_IMAGES];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    for (let img = queue.shift(); img; img = queue.shift()) {
      const status = await fetchOne(img);
      done++;
      if (status === "downloaded") console.log(`✓ ${img.name}`);
    }
  }),
);

const unique = new Map(ALL_IMAGES.map((i) => [i.pexelsId, i]));
const lines = [...unique.values()].map(
  (i) =>
    `| \`${i.name}\` | ${i.alt} | [pexels.com/photo/${i.pexelsId}](https://www.pexels.com/photo/${i.pexelsId}/) |`,
);
await writeFile(
  CREDITS,
  `# Image credits

All storefront photography comes from [Pexels](https://www.pexels.com) and is used under the
[Pexels License](https://www.pexels.com/license/) (free for commercial use, attribution not
required). Files are downloaded once by \`pnpm --filter @repo/db images\` and served locally from
\`storefront/public/images/\` — the site never hotlinks Pexels.

| File | Subject | Source |
| --- | --- | --- |
${lines.join("\n")}
`,
);
console.log(
  `Done: ${done} images (${ALL_IMAGES.length} in manifest). Credits written to docs/image-credits.md`,
);
