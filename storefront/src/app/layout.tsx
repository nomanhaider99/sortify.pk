import { BRAND } from "@repo/shared";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/footer";
import { MainContent, SiteChrome } from "@/components/layout/site-chrome";
import { Providers } from "@/components/providers/providers";
import { getShellData } from "@/lib/data";
import { fontVariables } from "./fonts";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${BRAND.name} — ${BRAND.tagline}`, template: `%s | ${BRAND.name}` },
  description: BRAND.description,
  openGraph: { siteName: BRAND.name, type: "website", locale: "en_US" },
};

export const viewport: Viewport = {
  themeColor: "#F7F5EF",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const shell = await getShellData();
  return (
    <html lang="en" className={fontVariables}>
      <body className="bg-bg text-ink min-h-svh antialiased">
        <a
          href="#main"
          className="bg-primary-strong text-on-strong fixed top-2 left-2 z-[60] -translate-y-20 px-4 py-2 text-sm transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        <Providers>
          <SiteChrome data={shell} />
          <MainContent>{children}</MainContent>
          <Footer data={shell} />
        </Providers>
      </body>
    </html>
  );
}
