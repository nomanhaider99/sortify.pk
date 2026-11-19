import { BRAND } from "@repo/shared";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { getAdminSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Minimal signed-in layout (no sidebar) — used for the forced password change. */
export default async function PasswordLayout({ children }: { children: ReactNode }) {
  if (!(await getAdminSession())) redirect("/login?expired=1");
  return (
    <main className="relative flex min-h-svh items-center justify-center p-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2">
          <span className="bg-primary-strong text-on-strong rounded-control flex size-9 items-center justify-center font-semibold">
            {BRAND.name.charAt(0)}
          </span>
          <span className="text-lg font-semibold">{BRAND.name} Admin</span>
        </div>
        {children}
      </div>
    </main>
  );
}
