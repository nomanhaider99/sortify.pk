import { migrate } from "drizzle-orm/postgres-js/migrator";
import { fileURLToPath } from "node:url";
import { createClient } from "./client";

const { db, sql } = createClient(undefined, { max: 1 });

try {
  await migrate(db, {
    migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)),
  });
  console.log("✓ Migrations applied");
} finally {
  await sql.end();
}
