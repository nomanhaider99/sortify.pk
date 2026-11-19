import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getAdminSession } from "@/lib/session";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getAdminSession()) redirect("/");
  const sp = await searchParams;
  const callbackUrl = typeof sp.callbackUrl === "string" ? sp.callbackUrl : "/";
  const notice =
    sp.expired === "1"
      ? "Your session ended. Please sign in again."
      : sp.set === "1"
        ? "Password saved — you can sign in now."
        : undefined;
  return (
    <Card>
      <h1 className="text-xl font-semibold">Sign in</h1>
      <p className="text-ink-muted mt-1 mb-6 text-sm">Staff access only.</p>
      <LoginForm callbackUrl={callbackUrl} notice={notice} />
    </Card>
  );
}
