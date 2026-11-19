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
keepProtocolCyclesTogether(server);
await server.start();

/**
 * PGlite is a single Postgres session shared by every socket. The bundled queue only pins a client
 * while a transaction is open, so with two apps connected (storefront + admin) one client's
 * Parse … Sync cycle can be split by another's Parse, clobbering the unnamed statement
 * ("bind message supplies 1 parameters, but prepared statement requires 2"). This keeps each
 * client on the session until its extended-protocol cycle ends (Sync) or a simple Query completes.
 */
function keepProtocolCyclesTogether(s: PGLiteSocketServer) {
  type Item = {
    handlerId: number;
    message: Uint8Array;
    resolve: (bytes: number) => void;
    reject: (e: unknown) => void;
    onData: (d: Uint8Array) => void;
  };
  type Queue = {
    queue: Item[];
    processing: boolean;
    lastHandlerId: number | null;
    processQueue: () => Promise<void>;
    clearQueueForHandler: (id: number) => void;
  };
  const q = (s as unknown as { queryQueue: Queue }).queryQueue;
  const ENDS_CYCLE = new Set(["S", "Q", "X"]);
  let owner: number | null = null;

  q.processQueue = async function processQueue(this: Queue) {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    try {
      while (this.queue.length > 0) {
        const pinned =
          db.isInTransaction() && this.lastHandlerId !== null ? this.lastHandlerId : owner;
        const index = pinned === null ? 0 : this.queue.findIndex((i) => i.handlerId === pinned);
        if (index === -1) break; // wait for the pinned client's next message (enqueue re-triggers)
        const [item] = this.queue.splice(index, 1);
        if (!item) break;
        let bytes = 0;
        try {
          await db.runExclusive(() =>
            db.execProtocolRawStream(item.message, {
              onRawData: (d: Uint8Array) => {
                bytes += d.length;
                item.onData(d);
              },
            }),
          );
        } catch (error) {
          owner = null;
          item.reject(error);
          continue;
        }
        const type = String.fromCharCode(item.message[0] ?? 0);
        owner = ENDS_CYCLE.has(type) ? null : item.handlerId;
        this.lastHandlerId = item.handlerId;
        item.resolve(bytes);
      }
    } finally {
      this.processing = false;
    }
  };

  const clear = q.clearQueueForHandler.bind(q);
  q.clearQueueForHandler = (id: number) => {
    clear(id);
    if (owner === id) {
      owner = null;
      void q.processQueue();
    }
  };
}

console.log(`PGlite server listening on postgres://postgres:postgres@127.0.0.1:${port}/postgres`);
console.log(`Data directory: ${dataDir}`);

async function shutdown() {
  await server.stop();
  await db.close();
  process.exit(0);
}
process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
