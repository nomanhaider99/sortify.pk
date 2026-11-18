// Shared ESLint flat-config pieces for every workspace package.
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

export const ignores = {
  ignores: [
    "**/node_modules/**",
    "**/.next/**",
    "**/dist/**",
    "**/coverage/**",
    "**/.pglite/**",
    "**/next-env.d.ts",
    "packages/db/drizzle/**",
  ],
};

/** Type-aware TypeScript rules (strict, no `any`). */
export const typescript = [
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true },
      globals: { ...globals.node },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      "@typescript-eslint/no-confusing-void-expression": ["error", { ignoreArrowShorthand: true }],
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    ...tseslint.configs.disableTypeChecked,
  },
];

/** Repo scripts run in Node but pass callbacks into the browser (Playwright page.evaluate). */
export const scripts = {
  files: ["scripts/**/*.{js,mjs}"],
  languageOptions: { globals: { ...globals.node, ...globals.browser } },
};

export default [ignores, js.configs.recommended, ...typescript, scripts, prettier];
