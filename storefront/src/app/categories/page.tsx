import { listCategories } from "@repo/db";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { RevealText } from "@/components/motion/reveal-text";
import { Container } from "@/components/ui/container";
import { routes } from "@/lib/routes";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Categories",
  description: "Browse home decor and kitchen essentials by category.",
};

export default async function CategoriesPage() {
  const categories = await listCategories();
  return (
    <Container className="pb-section pt-10 md:pt-14">
      <p className="text-ink-muted text-xs tracking-[0.16em] uppercase">Browse</p>
      <RevealText
        as="h1"
        immediate
        text="Shop by category"
        className="font-display text-display-xl mt-3 italic"
      />
      <p className="text-ink-muted mt-4 max-w-xl">
        From the side table by your sofa to the spoon in your hand — find exactly what your home
        needs.
      </p>

      <RevealGroup className="mt-14 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c, i) => (
          <RevealItem key={c.slug}>
            <Link href={routes.category(c.slug)} className="group block">
              <div className="bg-surface-muted relative aspect-[4/5] overflow-hidden rounded-sm">
                {c.imageUrl ? (
                  <Image
                    src={c.imageUrl}
                    alt=""
                    fill
                    priority={i < 3}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="ease-out-expo object-cover transition-transform duration-[1.2s] group-hover:scale-[1.05]"
                  />
                ) : null}
              </div>
              <div className="mt-5 flex items-start justify-between gap-6">
                <div>
                  <h2 className="font-display text-3xl italic">{c.name}</h2>
                  <p className="text-ink-muted mt-2 text-sm leading-relaxed">{c.description}</p>
                </div>
                <span className="text-ink-muted mt-2 shrink-0 text-xs">
                  {c.productCount} pieces
                </span>
              </div>
              <span className="mt-4 inline-flex items-center gap-2 text-sm tracking-[0.08em] uppercase">
                Shop now{" "}
                <ArrowRight
                  className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden
                />
              </span>
            </Link>
          </RevealItem>
        ))}
      </RevealGroup>
    </Container>
  );
}
