import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { OWNER_READY_FLAG } from "./helpers";
import { E2E_DB } from "./playwright.config";

/** Wipes and reseeds the local E2E database. Refuses anything that isn't on this machine. */
export default function globalSetup() {
  const host = new URL(E2E_DB).hostname;
  if (!["127.0.0.1", "localhost", "::1"].includes(host)) {
    throw new Error(
      `E2E tests reset the database — refusing to run against ${host}. Use a local DATABASE_URL.`,
    );
  }
  rmSync(OWNER_READY_FLAG, { force: true });
  execSync("pnpm --filter @repo/db reset", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: E2E_DB, NODE_ENV: "development" },
  });
}
