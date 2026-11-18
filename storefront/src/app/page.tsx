import { getSettings, listCategories } from "@repo/db";
import { DEFAULT_SETTINGS } from "@repo/shared";
import Image from "next/image";
import Link from "next/link";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { RevealText } from "@/components/motion/reveal-text";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { routes } from "@/lib/routes";

export const revalidate = 300;

async function loadHome() {
  try {
    const [{ hero }, categories] = await Promise.all([getSettings(["hero"]), listCategories()]);
    return { hero, categories };
  } catch (error) {
    console.error("[home] failed to load data", error);
    return { hero: DEFAULT_SETTINGS.hero, categories: [] };
  }
}

// Shell-stage home page: a dark full-bleed hero (so the transparent header can be verified
// against ref-1) and a category row. M3 replaces this with the full home page.
export default async function HomePage() {
  const { hero, categories } = await loadHome();
  return (
    <>
      <section className="relative isolate flex min-h-svh items-center justify-center overflow-hidden">
        <Image
          src={hero.imageUrl}
          alt={hero.imageAlt}
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/45 via-black/30 to-black/55" />
        <Container className="text-on-strong text-center">
          <RevealText
            as="h1"
            immediate
            text={[hero.eyebrow, hero.headline]}
            className="font-display italic"
            lineClassNames={["text-display-lg", "text-display-2xl"]}
            stagger={0.12}
          />
          <Reveal immediate delay={0.5}>
            <p className="mx-auto mt-8 max-w-[30rem] text-base font-light">{hero.subtext}</p>
            <Button asChild variant="inverse" className="mt-7 font-normal">
              <Link href={routes.newArrivals}>{hero.ctaLabel}</Link>
            </Button>
          </Reveal>
        </Container>
      </section>

      {categories.length ? (
        <section className="py-section">
          <Container>
            <h2 className="font-display text-display-md text-center italic">Shop by room</h2>
            <RevealGroup className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {categories.map((c) => (
                <RevealItem key={c.slug}>
                  <Link href={routes.category(c.slug)} className="group block">
                    <div className="bg-surface-muted relative aspect-[4/3] overflow-hidden rounded-xs">
                      {c.imageUrl ? (
                        <Image
                          src={c.imageUrl}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 25vw, 50vw"
                          className="ease-out-expo object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : null}
                    </div>
                    <p className="font-display mt-3 text-xl italic">{c.name}</p>
                    <p className="text-ink-muted text-xs">{c.productCount} pieces</p>
                  </Link>
                </RevealItem>
              ))}
            </RevealGroup>
          </Container>
        </section>
      ) : null}
    </>
  );
}
