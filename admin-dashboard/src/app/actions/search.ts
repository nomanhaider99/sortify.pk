"use server";

import { adminSearch, type AdminSearchResult } from "@repo/db/admin";
import { z } from "zod";
import { getAdminSession } from "@/lib/session";

const EMPTY: AdminSearchResult = { orders: [], products: [], customers: [] };

/** Command-palette search, scoped to what the signed-in user is allowed to view. */
export async function searchAdmin(query: string): Promise<AdminSearchResult> {
  const session = await getAdminSession();
  const parsed = z.string().trim().min(2).max(60).safeParse(query);
  if (!session || !parsed.success) return EMPTY;
  return adminSearch(parsed.data, {
    orders: session.can("orders:view"),
    products: session.can("products:view"),
    customers: session.can("customers:view"),
  });
}
