import { peekAccountToken } from "@repo/db/admin";
import type { Metadata } from "next";
import Link from "next/link";
import { setPasswordWithToken } from "@/app/actions/password";
import { SetPasswordForm } from "@/components/auth/set-password-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Accept invite" };
export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const invite = await peekAccountToken("invite", token);
  if (!invite) {
    return (
      <Card>
        <h1 className="text-xl font-semibold">Invite link expired</h1>
        <p className="text-ink-muted mt-2 text-sm">
          This invite is invalid, expired or already used. Ask an admin to send a new one.
        </p>
        <Link href="/login" className="text-accent-ink mt-6 inline-block text-sm underline">
          Back to sign in
        </Link>
      </Card>
    );
  }
  return (
    <Card>
      <h1 className="text-xl font-semibold">Welcome, {invite.name.split(" ")[0]}</h1>
      <p className="text-ink-muted mt-1 mb-6 text-sm">
        Set a password for {invite.email} to activate your account.
      </p>
      <SetPasswordForm
        action={setPasswordWithToken}
        hidden={{ kind: "invite", token }}
        submitLabel="Activate account"
      />
    </Card>
  );
}
