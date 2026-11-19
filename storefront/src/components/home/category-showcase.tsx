import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { RevealText } from "@/components/motion/reveal-text";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

type Category = {
  slug: string;
  name: string;
  description: string;
  imageUrl: string | null;
  productCount: number;
};

/** Editorial category tiles: image + italic title + "Shop now", staggered reveal, zoom on hover. */
export function CategoryShowcase({ categories }: { categories: Category[] }) {
  // Bento layout on desktop (4 cols × 3 rows): one 2×2 tile, two 1×1, three 2×1.
  const spans = [
    "lg:col-span-2 lg:row-span-2",
    "",
    "",
    "lg:col-span-2",
    "lg:col-span-2",
    "lg:col-span-2",
  ];
  return (
    <section className="bg-surface-muted py-section">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-ink-muted text-xs tracking-[0.16em] uppercase">Shop by category</p>
            <RevealText
              as="h2"
              text="Everything for the heart of your home"
              className="font-display text-display-lg mt-3 max-w-xl italic"
            />
          </div>
          <Link href={routes.categories} className="text-sm underline underline-offset-4">
            View all categories
          </Link>
        </div>

        <RevealGroup className="mt-12 grid auto-rows-[260px] grid-cols-1 gap-4 sm:grid-cols-2 lg:auto-rows-[280px] lg:grid-cols-4">
          {categories.slice(0, 6).map((c, i) => (
            <RevealItem key={c.slug} className={cn("h-full", spans[i])}>
              <Link
                href={routes.category(c.slug)}
                className="group relative flex h-full overflow-hidden rounded-sm"
              >
                {c.imageUrl ? (
                  <Image
                    src={c.imageUrl}
                    alt=""
                    fill
                    sizes={
                      i === 0
                        ? "(min-width: 1024px) 50vw, 100vw"
                        : "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    }
                    className="ease-out-expo object-cover transition-transform duration-[1.2s] group-hover:scale-[1.06]"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                <div className="text-on-strong relative mt-auto flex w-full items-end justify-between gap-4 p-6">
                  <div>
                    <h3
                      className={cn(
                        "font-display italic",
                        i === 0 ? "text-display-md" : "text-2xl",
                      )}
                    >
                      {c.name}
                    </h3>
                    <p className="text-on-strong/80 mt-1 text-xs">{c.productCount} pieces</p>
                  </div>
                  <span className="border-on-strong/60 group-hover:bg-on-strong group-hover:text-ink flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors duration-300">
                    <ArrowUpRight className="size-4" aria-hidden />
                    <span className="sr-only">Shop now</span>
                  </span>
                </div>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
