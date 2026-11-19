import { PackageSearch } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { TrackForm } from "@/components/order/track-form";
import { Container } from "@/components/ui/container";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

/**
 * Account-lite (PLAN §5.10): checkout is guest-only in Phase 1, so customers find their orders by
 * order number + email. Full customer accounts are listed under Deferred.
 */
export default function AccountPage() {
  return (
    <Container className="pb-section max-w-3xl pt-10 md:pt-14">
      <PackageSearch className="text-primary-strong size-10" strokeWidth={1.25} aria-hidden />
      <h1 className="font-display text-display-xl mt-5 italic">Your orders</h1>
      <p className="text-ink-muted mt-4 max-w-lg">
        No account needed — every order can be found with its order number and the email you used at
        checkout. Customer accounts with saved addresses and order history are coming soon.
      </p>
      <div className="bg-surface border-border mt-10 rounded-sm border p-6 md:p-8">
        <TrackForm />
      </div>
      <p className="text-ink-muted mt-6 text-sm">
        Can’t find your order number?{" "}
        <Link href={routes.contact} className="text-primary-strong underline underline-offset-4">
          Contact us
        </Link>{" "}
        and we’ll help.
      </p>
    </Container>
  );
}
