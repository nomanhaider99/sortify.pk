import { existsSync } from "node:fs";
import type { NextConfig } from "next";

// Env lives at the monorepo root (shared by both apps and packages/db).
if (existsSync("../.env")) process.loadEnvFile("../.env");

const storefrontUrl = process.env.STOREFRONT_URL ?? "http://localhost:3000";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const config: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  poweredByHeader: false,
  transpilePackages: ["@repo/db", "@repo/shared"],
  serverExternalPackages: ["@node-rs/argon2"],
  images: {
    // Product media (seed placeholders) is served by the storefront.
    remotePatterns: [new URL(`${storefrontUrl}/seed/**`)],
  },
  headers() {
    return Promise.resolve([{ source: "/:path*", headers: securityHeaders }]);
  },
};

export default config;
