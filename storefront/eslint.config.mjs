import nextVitals from "eslint-config-next/core-web-vitals";
import { ignores, typescript } from "../eslint.base.mjs";
import prettier from "eslint-config-prettier";

const config = [
  ignores,
  ...nextVitals,
  // Lets the Next plugin find the app when ESLint runs from the repo root (lint-staged).
  { settings: { next: { rootDir: import.meta.dirname } } },
  ...typescript,
  prettier,
];

export default config;
