/**
 * Design tokens (PLAN.md §4.1). The CSS variables in `styles/tokens.css` mirror these values;
 * `tokens.test.ts` keeps the two in sync and enforces the contrast rule.
 */
export const colors = {
  primary: "#9CAF88",
  primaryStrong: "#4F6B3F",
  primaryStrongHover: "#3F5A34",
  primarySoft: "#E4EBDC",
  bg: "#F7F5EF",
  surface: "#FFFFFF",
  surfaceMuted: "#F1EEE6",
  ink: "#1F2A1A",
  inkMuted: "#5E6659",
  border: "#E2DED3",
  menuBg: "#141414",
  menuInkMuted: "#A3A3A3",
  danger: "#B3402F",
  warning: "#C98A1B",
  /** Text-safe warning (the #C98A1B fill fails 4.5:1 as text on light surfaces). */
  warningInk: "#8A5D0E",
  success: "#4F6B3F",
} as const;

/** Admin dark mode, derived from the brand palette (PLAN.md §0.1 rule 2). */
export const darkColors = {
  primary: "#9CAF88",
  primaryStrong: "#4F6B3F",
  primaryStrongHover: "#3F5A34",
  primarySoft: "#26321F",
  bg: "#141A12",
  surface: "#1B2318",
  surfaceMuted: "#222C1E",
  ink: "#EEF1E8",
  inkMuted: "#A7B09E",
  border: "#2C3727",
  danger: "#E07A66",
  warning: "#E0A94A",
  warningInk: "#E0A94A",
  success: "#9CAF88",
} as const;

export type ColorToken = keyof typeof colors;

/** Chart palette for Recharts (admin), readable on both themes. */
export const chartColors = {
  line: colors.primaryStrong,
  fill: colors.primary,
  grid: colors.border,
  series: [colors.primaryStrong, colors.primary, "#C2A878", "#7C8B9A", colors.danger],
} as const;

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const h = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`Invalid hex color: ${hex}`);
  const [r, g, b] = [0, 2, 4].map((i) => channel(parseInt(h.slice(i, i + 2), 16))) as [
    number,
    number,
    number,
  ];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio between two hex colors (1–21). */
export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function meetsContrast(
  foreground: string,
  background: string,
  { largeText = false }: { largeText?: boolean } = {},
): boolean {
  return contrastRatio(foreground, background) >= (largeText ? 3 : 4.5);
}

/**
 * Every text/background pair the UI is allowed to use. Anything not listed here
 * (notably `bg` text on `primary` sage, ~2.2:1) is forbidden by the contrast rule.
 */
export const APPROVED_TEXT_PAIRS: ReadonlyArray<{
  fg: string;
  bg: string;
  label: string;
  largeText?: boolean;
}> = [
  { fg: colors.ink, bg: colors.bg, label: "ink on bg" },
  { fg: colors.ink, bg: colors.surface, label: "ink on surface" },
  { fg: colors.ink, bg: colors.surfaceMuted, label: "ink on surface-muted" },
  { fg: colors.ink, bg: colors.primary, label: "ink on sage (required for sage sections)" },
  { fg: colors.ink, bg: colors.primarySoft, label: "ink on primary-soft" },
  { fg: colors.ink, bg: colors.warning, label: "ink on warning fill" },
  { fg: colors.inkMuted, bg: colors.bg, label: "ink-muted on bg" },
  { fg: colors.inkMuted, bg: colors.surface, label: "ink-muted on surface" },
  { fg: colors.inkMuted, bg: colors.surfaceMuted, label: "ink-muted on surface-muted" },
  { fg: colors.inkMuted, bg: colors.primarySoft, label: "ink-muted on primary-soft" },
  { fg: colors.bg, bg: colors.primaryStrong, label: "button text" },
  { fg: colors.bg, bg: colors.primaryStrongHover, label: "button text (hover)" },
  { fg: colors.bg, bg: colors.menuBg, label: "menu text" },
  { fg: colors.menuInkMuted, bg: colors.menuBg, label: "menu dimmed links" },
  { fg: colors.bg, bg: colors.danger, label: "text on danger fill" },
  { fg: colors.primaryStrong, bg: colors.bg, label: "link on bg" },
  { fg: colors.primaryStrong, bg: colors.surface, label: "link on surface" },
  { fg: colors.primaryStrong, bg: colors.primarySoft, label: "active nav on primary-soft" },
  { fg: colors.danger, bg: colors.surface, label: "danger text" },
  { fg: colors.warningInk, bg: colors.surface, label: "warning text" },
  { fg: colors.warningInk, bg: colors.bg, label: "warning text on bg" },
  // Admin dark mode
  { fg: darkColors.ink, bg: darkColors.bg, label: "dark: ink on bg" },
  { fg: darkColors.ink, bg: darkColors.surface, label: "dark: ink on surface" },
  { fg: darkColors.inkMuted, bg: darkColors.surface, label: "dark: ink-muted on surface" },
  {
    fg: darkColors.inkMuted,
    bg: darkColors.surfaceMuted,
    label: "dark: ink-muted on surface-muted",
  },
  { fg: darkColors.primary, bg: darkColors.bg, label: "dark: sage accent on bg" },
  { fg: darkColors.primary, bg: darkColors.surface, label: "dark: sage accent on surface" },
  { fg: darkColors.primary, bg: darkColors.primarySoft, label: "dark: active nav" },
  { fg: colors.bg, bg: darkColors.primaryStrong, label: "dark: button text" },
  { fg: colors.bg, bg: darkColors.primaryStrongHover, label: "dark: button text (hover)" },
  { fg: darkColors.danger, bg: darkColors.surface, label: "dark: danger text" },
  { fg: darkColors.warningInk, bg: darkColors.surface, label: "dark: warning text" },
];
