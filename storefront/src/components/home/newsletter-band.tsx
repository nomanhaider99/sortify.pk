import Image from "next/image";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { Reveal } from "@/components/motion/reveal";
import { RevealText } from "@/components/motion/reveal-text";

/** Newsletter CTA over a dining-table photo. */
export function NewsletterBand() {
  return (
    <section className="relative isolate overflow-hidden">
      <Image
        src="/images/site/dining.webp"
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-black/55" />
      <div className="container-site text-on-strong flex min-h-[60svh] flex-col items-center justify-center py-24 text-center">
        <p className="text-on-strong/80 text-xs tracking-[0.16em] uppercase">The journal</p>
        <RevealText
          as="h2"
          text={["Ideas for a", "well-loved home"]}
          className="font-display text-display-xl mt-4 italic"
        />
        <Reveal delay={0.2} className="mt-6 flex w-full flex-col items-center">
          <p className="text-on-strong/85 max-w-md">
            Styling notes, care guides and first access to new collections — once a month, never
            more.
          </p>
          <div className="mt-8 w-full max-w-md text-left">
            <NewsletterForm />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
