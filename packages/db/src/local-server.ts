/**
 * Local development database: an embedded PGlite (Postgres compiled to WASM) exposed over the
 * Postgres wire protocol, so both apps and drizzle use the exact same `postgres` driver they
 * use against Neon. Data persists in `<repo>/.pglite`.
 *
 *   pnpm db:local   # keep running in its own terminal
 */
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { fileURLToPath } from "node:url";

const dataDir = fileURLToPath(new URL("../../../.pglite", import.meta.url));
const url = new URL(
  process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:5433/postgres",
);
const port = Number(url.port || 5433);

const db = await PGlite.create(dataDir);
const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1", maxConnections: 20 });
await server.start();

console.log(`PGlite server listening on postgres://postgres:postgres@127.0.0.1:${port}/postgres`);
console.log(`Data directory: ${dataDir}`);

async function shutdown() {
  await server.stop();
  await db.close();
  process.exit(0);
}
process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
