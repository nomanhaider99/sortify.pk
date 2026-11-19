import Image from "next/image";
import Link from "next/link";
import { Parallax } from "@/components/motion/parallax";
import { Reveal } from "@/components/motion/reveal";
import { RevealText } from "@/components/motion/reveal-text";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { routes } from "@/lib/routes";

/** "Made by hand" brand story split with layered images. */
export function StoryTeaser({ storeName }: { storeName: string }) {
  return (
    <section className="py-section overflow-hidden">
      <Container className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <div className="relative">
          <Parallax offset={60} className="aspect-[4/5] rounded-sm">
            <Image
              src="/images/site/workshop.webp"
              alt="A potter shaping a vase on a wheel in our partner studio"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="scale-110 object-cover"
            />
          </Parallax>
          <Reveal
            className="border-bg absolute -right-4 -bottom-10 hidden w-[46%] overflow-hidden rounded-sm border-8 md:block lg:-right-12"
            distance={50}
          >
            <div className="relative aspect-square">
              <Image
                src="/images/site/hands-clay.webp"
                alt="Hands forming a clay bowl on a pottery wheel"
                fill
                sizes="20vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
        <div className="lg:pl-6">
          <p className="text-ink-muted text-xs tracking-[0.16em] uppercase">Our story</p>
          <RevealText
            as="h2"
            text="Made slowly, by hands that care"
            className="font-display text-display-lg mt-4 italic"
          />
          <Reveal delay={0.15}>
            <p className="text-ink-muted mt-6 max-w-lg leading-relaxed">
              {storeName} began at a kitchen table with a handful of potters and woodworkers we
              admired. Today we work with small studios around the world to bring you pieces that
              are honest in material, generous in use and made to be lived with — not replaced.
            </p>
            <p className="text-ink-muted mt-4 max-w-lg leading-relaxed">
              Every vase, board and bowl is checked by our team before it leaves the studio, and
              every maker is paid fairly for their craft.
            </p>
            <Button asChild variant="secondary" className="mt-9">
              <Link href={routes.about}>Read our story</Link>
            </Button>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
