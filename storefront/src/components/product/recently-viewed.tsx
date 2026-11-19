"use client";

import { formatMoney } from "@repo/shared";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { routes } from "@/lib/routes";

type Viewed = { slug: string; title: string; image: string | null; priceCents: number };
const KEY = "majestic-recently-viewed";

function read(): Viewed[] {
  try {
    const raw = localStorage.getItem(KEY);
    const data: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(data)
      ? (data as Viewed[]).filter((v) => typeof v.slug === "string").slice(0, 8)
      : [];
  } catch {
    return [];
  }
}

/** Records the current product and shows the others recently viewed (localStorage only). */
export function RecentlyViewed({ current }: { current: Viewed }) {
  const [items, setItems] = useState<Viewed[]>([]);

  useEffect(() => {
    const previous = read().filter((v) => v.slug !== current.slug);
    try {
      localStorage.setItem(KEY, JSON.stringify([current, ...previous].slice(0, 8)));
    } catch {
      // Storage unavailable — skip silently.
    }
    const id = requestAnimationFrame(() => setItems(previous.slice(0, 6)));
    return () => cancelAnimationFrame(id);
  }, [current]);

  if (!items.length) return null;
  return (
    <section className="container-site py-16" aria-labelledby="recent-title">
      <h2 id="recent-title" className="font-display text-display-md italic">
        Recently viewed
      </h2>
      <ul className="mt-8 grid grid-cols-3 gap-4 md:grid-cols-6">
        {items.map((v) => (
          <li key={v.slug}>
            <Link href={routes.product(v.slug)} className="group block">
              <div className="bg-surface-muted relative aspect-[4/5] overflow-hidden rounded-xs">
                {v.image ? (
                  <Image
                    src={v.image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 15vw, 30vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : null}
              </div>
              <p className="font-display mt-2 line-clamp-1 text-sm italic">{v.title}</p>
              <p className="text-ink-muted text-xs">
                {formatMoney(v.priceCents, "USD", { withCode: false })}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
