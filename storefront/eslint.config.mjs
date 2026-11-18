import nextVitals from "eslint-config-next/core-web-vitals";
import { ignores, typescript } from "../eslint.base.mjs";
import prettier from "eslint-config-prettier";

const config = [ignores, ...nextVitals, ...typescript, prettier];

export default config;
