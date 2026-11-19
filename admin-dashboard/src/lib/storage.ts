import "server-only";
import { createHash } from "node:crypto";

/** Storage adapter (PLAN §6.5). Cloudinary when CLOUDINARY_URL is set; otherwise uploads are off. */
export type StorageAdapter = {
  enabled: boolean;
  upload: (file: File) => Promise<{ url: string; width?: number; height?: number }>;
};

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function parseCloudinaryUrl(raw: string | undefined) {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "cloudinary:") return null;
    return {
      apiKey: decodeURIComponent(u.username),
      apiSecret: decodeURIComponent(u.password),
      cloud: u.hostname,
    };
  } catch {
    return null;
  }
}

export function getStorage(): StorageAdapter {
  const cfg = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
  if (!cfg) {
    return {
      enabled: false,
      upload: () =>
        Promise.reject(new Error("Image uploads aren’t configured (set CLOUDINARY_URL).")),
    };
  }
  return {
    enabled: true,
    async upload(file) {
      if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type))
        throw new Error("Use a JPG, PNG, WebP or AVIF image.");
      if (file.size > MAX_IMAGE_BYTES) throw new Error("Images must be 5 MB or smaller.");
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const folder = "storefront/products";
      // Signed upload: sha1 of the sorted params + API secret.
      const signature = createHash("sha1")
        .update(`folder=${folder}&timestamp=${timestamp}${cfg.apiSecret}`)
        .digest("hex");
      const form = new FormData();
      form.set("file", file);
      form.set("api_key", cfg.apiKey);
      form.set("timestamp", timestamp);
      form.set("folder", folder);
      form.set("signature", signature);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloud}/image/upload`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status}).`);
      const data = (await res.json()) as { secure_url: string; width?: number; height?: number };
      return { url: data.secure_url, width: data.width, height: data.height };
    },
  };
}
