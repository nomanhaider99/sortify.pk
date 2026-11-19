import type { Metadata } from "next";
import { ListingPage } from "@/components/listing/listing-page";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Shop all",
  description:
    "Side tables, vases, candles, cookware, kitchen tools and tableware — everything in one place.",
};

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  return (
    <ListingPage
      title={q ? `Results for “${q.slice(0, 60)}”` : "Shop all"}
      description={
        q
          ? undefined
          : "Every piece in the collection — from small side tables to the wooden spoon you’ll use every day."
      }
      breadcrumb={[{ label: "Home", href: routes.home }, { label: "Shop" }]}
      searchParams={sp}
    />
  );
}
