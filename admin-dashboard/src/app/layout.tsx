import { BRAND } from "@repo/shared";
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { StorefrontOrigin } from "@/components/storefront-origin";
import { themeInitScript } from "@/components/theme-toggle";
import { storefrontOrigin } from "@/lib/links";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });

export const metadata: Metadata = {
  title: { default: `${BRAND.name} Admin`, template: `%s · ${BRAND.name} Admin` },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={dmSans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-bg text-ink min-h-svh antialiased">
        <StorefrontOrigin origin={storefrontOrigin()} />
        {children}
      </body>
    </html>
  );
}
