import { desc, ilike, isNull, or, and } from "drizzle-orm";
import { db as sharedDb, type Database } from "../client";
import { customers, orders, products } from "../schema";

export type AdminSearchResult = {
  orders: { orderNumber: string; email: string; status: string; totalCents: number }[];
  products: { id: string; title: string; status: string }[];
  customers: { id: string; name: string; email: string }[];
};

/** Command-palette search. Callers pass which entity types the user may see. */
export async function adminSearch(
  query: string,
  scope: { orders: boolean; products: boolean; customers: boolean },
  db: Database = sharedDb,
): Promise<AdminSearchResult> {
  const q = query.trim();
  if (q.length < 2) return { orders: [], products: [], customers: [] };
  const like = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
  const [o, p, c] = await Promise.all([
    scope.orders
      ? db
          .select({
            orderNumber: orders.orderNumber,
            email: orders.email,
            status: orders.status,
            totalCents: orders.totalCents,
          })
          .from(orders)
          .where(or(ilike(orders.orderNumber, like), ilike(orders.email, like)))
          .orderBy(desc(orders.placedAt))
          .limit(5)
      : Promise.resolve([]),
    scope.products
      ? db
          .select({ id: products.id, title: products.title, status: products.status })
          .from(products)
          .where(
            and(
              isNull(products.deletedAt),
              or(ilike(products.title, like), ilike(products.slug, like)),
            ),
          )
          .limit(5)
      : Promise.resolve([]),
    scope.customers
      ? db
          .select({ id: customers.id, name: customers.name, email: customers.email })
          .from(customers)
          .where(or(ilike(customers.name, like), ilike(customers.email, like)))
          .limit(5)
      : Promise.resolve([]),
  ]);
  return { orders: o, products: p, customers: c };
}
