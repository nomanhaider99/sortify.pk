import { listAdminCategories } from "@repo/db/admin";
import type { Metadata } from "next";
import { CategoriesManager } from "@/components/catalog/categories-manager";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const session = await requirePagePermission("categories:view");
  const categories = await listAdminCategories();
  return (
    <CategoriesManager
      categories={categories}
      can={{
        create: session.can("categories:create"),
        update: session.can("categories:update"),
        delete: session.can("categories:delete"),
      }}
    />
  );
}
