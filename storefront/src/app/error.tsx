"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { routes } from "@/lib/routes";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="py-section flex min-h-[70svh] flex-col items-center justify-center text-center">
      <p className="text-ink-muted text-xs tracking-[0.16em] uppercase">Something went wrong</p>
      <h1 className="font-display text-display-lg mt-4 italic">We dropped a stitch</h1>
      <p className="text-ink-muted mt-5 max-w-md">
        An unexpected error interrupted this page. Please try again — if it keeps happening, our
        team would love to hear about it.
      </p>
      {error.digest ? (
        <p className="text-ink-muted mt-3 text-xs">Reference: {error.digest}</p>
      ) : null}
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="secondary">
          <Link href={routes.contact}>Contact us</Link>
        </Button>
      </div>
    </Container>
  );
}
