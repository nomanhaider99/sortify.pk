import { getCategoryBySlug } from "@repo/db";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingPage } from "@/components/listing/listing-page";
import { routes } from "@/lib/routes";

export async function generateMetadata({
  params,
}: PageProps<"/categories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };
  return {
    title: category.name,
    description: category.description,
    openGraph: { images: category.imageUrl ? [category.imageUrl] : [] },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<"/categories/[slug]">) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  return (
    <ListingPage
      title={category.name}
      description={category.description}
      categorySlug={category.slug}
      breadcrumb={[
        { label: "Home", href: routes.home },
        { label: "Categories", href: routes.categories },
        { label: category.name },
      ]}
      searchParams={await searchParams}
    />
  );
}
