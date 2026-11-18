import { DEFAULT_SETTINGS, settingsSchemas, type SettingsMap } from "@repo/shared";
import { inArray } from "drizzle-orm";
import { db as sharedDb, type Database } from "../client";
import { settings } from "../schema";

type Key = keyof SettingsMap;

/**
 * Reads settings, validating each value with its Zod schema. Invalid or missing values fall back
 * to the defaults so a bad admin edit can never take the storefront down.
 */
export async function getSettings<K extends Key>(
  keys: readonly K[],
  db: Database = sharedDb,
): Promise<Pick<SettingsMap, K>> {
  const rows = await db
    .select()
    .from(settings)
    .where(inArray(settings.key, [...keys]));
  const out = {} as Pick<SettingsMap, K>;
  for (const key of keys) {
    const row = rows.find((r) => r.key === key);
    const parsed = row ? settingsSchemas[key].safeParse(row.value) : null;
    out[key] = (parsed?.success ? parsed.data : DEFAULT_SETTINGS[key]) as SettingsMap[K];
  }
  return out;
}

export async function getSetting<K extends Key>(
  key: K,
  db: Database = sharedDb,
): Promise<SettingsMap[K]> {
  const result = await getSettings([key], db);
  return result[key];
}
