import { getSettings } from "@repo/db";
import type { Metadata } from "next";
import { SettingsForm } from "@/components/settings/settings-form";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Shipping & payments" };

export default async function CommerceSettingsPage() {
  const session = await requirePagePermission("settings:view");
  const { shipping, payments, tax } = await getSettings(["shipping", "payments", "tax"]);
  const disabled = !session.can("settings:update");
  return (
    <>
      <SettingsForm
        settingKey="shipping"
        title="Shipping"
        description="Rates are recalculated on the server at checkout."
        initial={shipping}
        disabled={disabled}
        fields={[
          { name: "standardCents", label: "Standard rate", type: "money" },
          { name: "standardEta", label: "Standard delivery time", type: "text" },
          { name: "expressCents", label: "Express rate", type: "money" },
          { name: "expressEta", label: "Express delivery time", type: "text" },
          {
            name: "freeShippingThresholdCents",
            label: "Free standard shipping over",
            type: "money",
            hint: "Set to 0 to turn off free shipping",
          },
        ]}
      />
      <SettingsForm
        settingKey="payments"
        title="Payments"
        initial={payments}
        disabled={disabled}
        fields={[
          {
            name: "codEnabled",
            label: "Cash on delivery",
            type: "bool",
            hint: "Customers pay the courier when the order arrives",
          },
          {
            name: "cardDemoEnabled",
            label: "Card (demo mode)",
            type: "bool",
            hint: "No real charges — test card 4242 4242 4242 4242",
          },
          { name: "codFeeCents", label: "Cash on delivery fee", type: "money" },
          {
            name: "autoOpenCartOnAdd",
            label: "Open the cart drawer after adding to cart",
            type: "bool",
          },
        ]}
      />
      <SettingsForm
        settingKey="tax"
        title="Tax"
        initial={tax}
        disabled={disabled}
        fields={[
          { name: "rateBps", label: "Tax rate", type: "percent" },
          { name: "includedInPrices", label: "Prices already include tax", type: "bool" },
        ]}
      />
    </>
  );
}
