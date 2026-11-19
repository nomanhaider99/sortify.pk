import type { ReactNode } from "react";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { requirePagePermission } from "@/lib/session";

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  await requirePagePermission("settings:view");
  return (
    <div className="space-y-6">
      <SettingsTabs />
      <div className="max-w-4xl space-y-6">{children}</div>
    </div>
  );
}
