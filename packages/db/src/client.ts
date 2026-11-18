import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env (or run `pnpm db:local` for a local PGlite server).",
    );
  }
  return url;
}

function isLocal(url: string): boolean {
  const host = new URL(url).hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

export function createClient(url: string = databaseUrl(), { max = 10 }: { max?: number } = {}) {
  const local = isLocal(url);
  const sql = postgres(url, {
    max: local ? 1 : max, // the local PGlite server multiplexes a single connection
    ssl: local ? false : "require",
    prepare: false, // compatible with Neon's pooler (PgBouncer transaction mode)
    // PGlite multiplexes one session: the extra type-fetch connection would interleave with
    // extended-protocol messages. Drizzle serialises arrays itself, so it is not needed.
    fetch_types: !local,
    onnotice: () => undefined,
    ...(process.env.DB_DEBUG
      ? {
          debug: (conn: number, query: string, params: unknown[]) =>
            console.log(`[sql#${conn}]`, query.slice(0, 300), JSON.stringify(params).slice(0, 600)),
        }
      : {}),
  });
  return { db: drizzle(sql, { schema }), sql };
}

// Reuse one client across Next.js hot reloads in development.
const globalForDb = globalThis as unknown as { __repoDb?: ReturnType<typeof createClient> };

function getClient() {
  globalForDb.__repoDb ??= createClient();
  return globalForDb.__repoDb;
}

/** Lazily-initialised shared Drizzle instance (so importing never throws at build time). */
// The proxy target is never used directly: every property access is forwarded to the real client.
// eslint-disable-next-line @typescript-eslint/no-unsafe-class-instance-assignment
export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    const real = getClient().db;
    const value: unknown = Reflect.get(real, prop);
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(real) : value;
  },
});

export { schema };
