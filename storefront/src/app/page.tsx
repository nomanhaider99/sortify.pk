import { BRAND } from "@repo/shared";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { RevealText } from "@/components/motion/reveal-text";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

// Foundation landing page; replaced by the full home page in M3.
export default function HomePage() {
  return (
    <main className="bg-primary flex min-h-svh items-center">
      <Container className="py-section text-center">
        <RevealText
          as="h1"
          immediate
          text={["Make Your House", "Feel Like Home"]}
          className="font-display text-display-xl text-ink italic"
        />
        <Reveal immediate delay={0.4}>
          <p className="text-ink mx-auto mt-6 max-w-md">{BRAND.description}</p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild>
              <Link href="/">Shop {BRAND.name}</Link>
            </Button>
            <Button variant="secondary">Learn more</Button>
          </div>
        </Reveal>
      </Container>
    </main>
  );
}
