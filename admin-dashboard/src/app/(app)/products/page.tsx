import { listAdminCategories, listAdminProducts } from "@repo/db/admin";
import { PRODUCT_STATUSES, type ProductStatus } from "@repo/shared";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ProductsTable } from "@/components/products/products-table";
import { buttonVariants } from "@/components/ui/button";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const session = await requirePagePermission("products:view");
  const sp = await searchParams;
  const status =
    typeof sp.status === "string" && (PRODUCT_STATUSES as readonly string[]).includes(sp.status)
      ? (sp.status as ProductStatus)
      : undefined;
  const stock = sp.stock === "low" || sp.stock === "out" ? sp.stock : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const [{ rows, total }, categories] = await Promise.all([
    listAdminProducts({
      q: typeof sp.q === "string" ? sp.q.slice(0, 80) : undefined,
      status,
      stock,
      categoryId:
        typeof sp.category === "string" && /^[0-9a-f-]{36}$/.test(sp.category)
          ? sp.category
          : undefined,
      limit: 50,
      offset: (page - 1) * 50,
    }),
    listAdminCategories(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-ink-muted text-sm">
          {total} product{total === 1 ? "" : "s"}
        </p>
        {session.can("products:create") ? (
          <Link href={"/products/new"} className={buttonVariants()}>
            <Plus aria-hidden /> Add product
          </Link>
        ) : null}
      </div>
      <ProductsTable
        rows={rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() }))}
        total={total}
        page={page}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        can={{
          update: session.can("products:update"),
          publish: session.can("products:publish"),
          delete: session.can("products:delete"),
          create: session.can("products:create"),
        }}
      />
    </div>
  );
}
