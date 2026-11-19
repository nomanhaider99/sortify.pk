import { BRAND } from "@repo/shared";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

/** Centered auth card on the canvas (admin-layout-notes.md → "Login"). */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-svh items-center justify-center p-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
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
