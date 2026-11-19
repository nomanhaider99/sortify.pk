import type { Metadata } from "next";
import { auth } from "@/auth";
import { changeOwnPassword } from "@/app/actions/password";
import { SetPasswordForm } from "@/components/auth/set-password-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Change password" };

export default async function ChangePasswordPage() {
  const session = await auth();
  const forced = session?.mustChangePassword ?? false;
  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h2 className="text-lg font-semibold">
          {forced ? "Set a new password to continue" : "Change password"}
        </h2>
        <p className="text-ink-muted mt-1 mb-6 text-sm">
          {forced
            ? "For security, the starter password must be changed before you can use the dashboard."
            : "You’ll be signed out on all devices and asked to sign in again."}
        </p>
        <SetPasswordForm action={changeOwnPassword} requireCurrent submitLabel="Update password" />
      </Card>
    </div>
  );
}
