import { getSettings } from "@repo/db";
import type { Metadata } from "next";
import { SettingsForm } from "@/components/settings/settings-form";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Homepage" };

export default async function HomepageSettingsPage() {
  const session = await requirePagePermission("settings:view");
  const { hero, announcement } = await getSettings(["hero", "announcement"]);
  const disabled = !session.can("settings:update");
  return (
    <>
      <SettingsForm
        settingKey="announcement"
        title="Announcement bar"
        description="Rotating messages at the very top of every page."
        initial={announcement}
        disabled={disabled}
        fields={[
          { name: "enabled", label: "Show the announcement bar", type: "bool" },
          { name: "dismissible", label: "Let shoppers dismiss it", type: "bool" },
          { name: "messages", label: "Messages", type: "lines", hint: "One per line, up to 8" },
        ]}
      />
      <SettingsForm
        settingKey="hero"
        title="Hero"
        description="The full-width banner at the top of the homepage."
        initial={hero}
        disabled={disabled}
        fields={[
          { name: "eyebrow", label: "Eyebrow", type: "text" },
          { name: "headline", label: "Headline", type: "text" },
          { name: "subtext", label: "Supporting text", type: "textarea" },
          { name: "ctaLabel", label: "Button label", type: "text" },
          {
            name: "ctaHref",
            label: "Button link",
            type: "text",
            hint: "e.g. /products?sort=newest",
          },
          {
            name: "imageUrl",
            label: "Background image",
            type: "image",
            hint: "Library path (/images/…) or https:// URL",
          },
          { name: "imageAlt", label: "Image description", type: "text", wide: true },
        ]}
      />
    </>
  );
}
