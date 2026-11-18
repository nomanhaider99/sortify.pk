import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { APPROVED_TEXT_PAIRS, colors, contrastRatio, meetsContrast } from "./tokens";

const css = readFileSync(new URL("./styles/tokens.css", import.meta.url), "utf8");

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

describe("design tokens", () => {
  it("CSS variables match tokens.ts", () => {
    for (const [name, hex] of Object.entries(colors)) {
      const match = new RegExp(`--${kebab(name)}:\\s*(#[0-9a-fA-F]{6});`).exec(css);
      expect(match, `--${kebab(name)} missing in tokens.css`).not.toBeNull();
      expect(match?.[1]?.toLowerCase()).toBe(hex.toLowerCase());
    }
  });

  it.each(APPROVED_TEXT_PAIRS)("$label meets WCAG AA", ({ fg, bg, largeText }) => {
    expect(meetsContrast(fg, bg, { largeText: largeText ?? false })).toBe(true);
  });

  it("off-white text on sage is forbidden (fails contrast)", () => {
    expect(contrastRatio(colors.bg, colors.primary)).toBeLessThan(3);
    expect(APPROVED_TEXT_PAIRS.some((p) => p.fg === colors.bg && p.bg === colors.primary)).toBe(
      false,
    );
  });
});
