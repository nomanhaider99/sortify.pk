import { listAdminCategories, listImageLibrary } from "@repo/db/admin";
import type { Metadata } from "next";
import { ProductEditor } from "@/components/products/product-editor";
import { getStorage } from "@/lib/storage";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const session = await requirePagePermission("products:create");
  const [categories, library] = await Promise.all([listAdminCategories(), listImageLibrary()]);
  return (
    <ProductEditor
      product={null}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      library={library}
      uploadsEnabled={getStorage().enabled}
      canPublish={session.can("products:publish")}
    />
  );
}
