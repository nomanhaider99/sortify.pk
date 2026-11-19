import { peekAccountToken } from "@repo/db/admin";
import type { Metadata } from "next";
import Link from "next/link";
import { setPasswordWithToken } from "@/app/actions/password";
import { SetPasswordForm } from "@/components/auth/set-password-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Reset password" };
export const dynamic = "force-dynamic";

export default async function ResetPage({ params }: PageProps<"/reset/[token]">) {
  const { token } = await params;
  const reset = await peekAccountToken("reset", token);
  if (!reset) {
    return (
      <Card>
        <h1 className="text-xl font-semibold">Reset link expired</h1>
        <p className="text-ink-muted mt-2 text-sm">
          This link is invalid, expired or already used. Ask an admin for a new one.
        </p>
        <Link href="/login" className="text-accent-ink mt-6 inline-block text-sm underline">
          Back to sign in
        </Link>
      </Card>
    );
  }
  return (
    <Card>
      <h1 className="text-xl font-semibold">Choose a new password</h1>
      <p className="text-ink-muted mt-1 mb-6 text-sm">
        For {reset.email}. All existing sessions will be signed out.
      </p>
      <SetPasswordForm action={setPasswordWithToken} hidden={{ kind: "reset", token }} />
    </Card>
  );
}
