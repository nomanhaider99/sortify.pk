import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Access denied" };

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="max-w-md text-center">
        <ShieldAlert className="text-warning-ink mx-auto size-10" strokeWidth={1.5} aria-hidden />
        <p className="text-ink-muted mt-4 text-xs font-medium tracking-[0.12em] uppercase">
          Error 403
        </p>
        <h1 className="mt-2 text-xl font-semibold">You don’t have access to this page</h1>
        <p className="text-ink-muted mt-2 text-sm">
          Your role doesn’t include permission for this area. If you need it, ask the store owner to
          update your role.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Back to dashboard</Link>
        </Button>
      </Card>
    </main>
  );
}
