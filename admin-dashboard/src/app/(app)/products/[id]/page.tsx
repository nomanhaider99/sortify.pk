import { getAdminProduct, listAdminCategories, listImageLibrary } from "@repo/db/admin";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductEditor } from "@/components/products/product-editor";
import { getStorage } from "@/lib/storage";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: PageProps<"/products/[id]">) {
  const session = await requirePagePermission("products:view");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [product, categories, library] = await Promise.all([
    getAdminProduct(id),
    listAdminCategories(),
    listImageLibrary(),
  ]);
  if (!product) notFound();
  return (
    <ProductEditor
      product={{
        id: product.id,
        title: product.title,
        slug: product.slug,
        summary: product.summary,
        description: product.description,
        brand: product.brand,
        tags: product.tags,
        details: product.details,
        status: product.status,
        isFeatured: product.isFeatured,
        basePriceCents: product.basePriceCents,
        compareAtPriceCents: product.compareAtPriceCents,
        seoTitle: product.seoTitle,
        seoDescription: product.seoDescription,
        categoryIds: product.categoryIds,
        images: product.images.map((i) => ({ url: i.url, alt: i.alt })),
        options: product.options.map((o) => ({
          name: o.name,
          values: o.values.map((v) => ({ value: v.value, swatchHex: v.swatchHex })),
        })),
        variants: product.variants.map((v) => ({
          key: v.key,
          sku: v.sku,
          priceCents: v.priceCents,
          compareAtPriceCents: v.compareAtPriceCents,
          stockQty: v.stockQty,
          imageUrl: v.imageUrl,
          isActive: v.isActive,
        })),
      }}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      library={library}
      uploadsEnabled={getStorage().enabled}
      canPublish={session.can("products:publish")}
      readOnly={!session.can("products:update")}
    />
  );
}
