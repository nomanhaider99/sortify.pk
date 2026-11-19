import { getSettings } from "@repo/db";
import type { Metadata } from "next";
import { SettingsForm } from "@/components/settings/settings-form";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

export default async function StoreSettingsPage() {
  const session = await requirePagePermission("settings:view");
  const { store } = await getSettings(["store"]);
  return (
    <SettingsForm
      settingKey="store"
      title="Store details"
      description="Shown in the footer, on the contact page and on invoices."
      initial={store}
      disabled={!session.can("settings:update")}
      fields={[
        { name: "name", label: "Store name", type: "text" },
        { name: "email", label: "Contact email", type: "email" },
        { name: "phone", label: "Phone", type: "text" },
        { name: "hours", label: "Opening hours", type: "text" },
        { name: "address", label: "Address", type: "textarea" },
        {
          name: "logoUrl",
          label: "Logo URL (optional)",
          type: "image",
          hint: "Leave empty to use the wordmark",
        },
        { name: "currency", label: "Currency", type: "upper", hint: "ISO code, e.g. USD" },
        {
          name: "orderPrefix",
          label: "Order number prefix",
          type: "upper",
          hint: "2–5 letters, e.g. MAJ → MAJ-20261119-AB12",
        },
      ]}
    />
  );
}
