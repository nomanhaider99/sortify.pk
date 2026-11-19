import type { Metadata } from "next";
import Image from "next/image";
import { RevealText } from "@/components/motion/reveal-text";
import { TrackForm } from "@/components/order/track-form";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Track your order" };

export default async function TrackPage({ searchParams }: PageProps<"/track">) {
  const sp = await searchParams;
  const order = typeof sp.order === "string" ? sp.order.slice(0, 30) : "";
  return (
    <Container className="pb-section grid gap-12 pt-10 md:pt-14 lg:grid-cols-2 lg:gap-20">
      <div className="lg:py-10">
        <p className="text-ink-muted text-xs tracking-[0.16em] uppercase">Order tracking</p>
        <RevealText
          as="h1"
          immediate
          text="Where’s my order?"
          className="font-display text-display-xl mt-3 italic"
        />
        <p className="text-ink-muted mt-5 max-w-md">
          Enter your order number (it’s in your confirmation email) and the email you used at
          checkout to see live updates.
        </p>
        <div className="mt-10 max-w-md">
          <TrackForm defaultOrderNumber={order} />
        </div>
      </div>
      <div className="bg-surface-muted relative hidden min-h-[520px] overflow-hidden rounded-sm lg:block">
        <Image
          src="/images/site/breakfast.webp"
          alt=""
          fill
          sizes="50vw"
          className="object-cover"
        />
      </div>
    </Container>
  );
}
