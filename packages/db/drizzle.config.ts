import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

if (existsSync("../../.env")) process.loadEnvFile("../../.env");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:5433/postgres",
  },
  strict: true,
  verbose: true,
});
