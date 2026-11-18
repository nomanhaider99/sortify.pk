import type { Metadata } from "next";
import Link from "next/link";
import { RevealText } from "@/components/motion/reveal-text";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <Container className="py-section flex min-h-[70svh] flex-col items-center justify-center text-center">
      <p className="text-ink-muted text-xs tracking-[0.16em] uppercase">Error 404</p>
      <RevealText
        as="h1"
        immediate
        text="This room is still empty"
        className="font-display text-display-lg mt-4 italic"
      />
      <p className="text-ink-muted mt-5 max-w-md">
        The page you’re looking for has moved, sold out, or never existed. Let’s get you somewhere
        comfortable.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href={routes.shop}>Shop all</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href={routes.home}>Back home</Link>
        </Button>
      </div>
    </Container>
  );
}
