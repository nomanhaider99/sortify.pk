"use client";

import type { ProductCard as ProductCardData } from "@repo/db";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { RevealText } from "@/components/motion/reveal-text";
import { ProductCard } from "@/components/product/product-card";
import { cn } from "@/lib/cn";

/** Horizontal scroll-snap carousel with mouse drag and arrow buttons (Best sellers, Related). */
export function ProductCarousel({
  title,
  eyebrow,
  products,
  className,
}: {
  title: string;
  eyebrow?: string;
  products: ProductCardData[];
  className?: string;
}) {
  const track = useRef<HTMLUListElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = () => {
    const el = track.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft < 8,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8,
    });
  };
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const id = requestAnimationFrame(update);
    el.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(id);
      el.removeEventListener("scroll", update);
    };
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  // Mouse drag-to-scroll (touch uses native scrolling).
  const onPointerDown = (e: PointerEvent<HTMLUListElement>) => {
    if (e.pointerType !== "mouse" || !track.current) return;
    drag.current = { x: e.clientX, left: track.current.scrollLeft, moved: false };
  };
  const onPointerMove = (e: PointerEvent<HTMLUListElement>) => {
    const d = drag.current;
    const el = track.current;
    if (!d || !el) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4 && !d.moved) {
      d.moved = true;
      el.setPointerCapture(e.pointerId);
      el.style.scrollSnapType = "none";
    }
    if (d.moved) el.scrollLeft = d.left - dx;
  };
  const endDrag = (e: PointerEvent<HTMLUListElement>) => {
    const el = track.current;
    if (el && drag.current?.moved) {
      el.releasePointerCapture(e.pointerId);
      el.style.scrollSnapType = "";
      // Swallow the click that follows a drag so cards don't navigate.
      el.addEventListener("click", (ev) => ev.preventDefault(), { capture: true, once: true });
    }
    drag.current = null;
  };

  if (!products.length) return null;
  return (
    <section className={cn("py-section", className)} aria-label={title}>
      <div className="container-site flex items-end justify-between gap-6">
        <div>
          {eyebrow ? (
            <p className="text-ink-muted text-xs tracking-[0.16em] uppercase">{eyebrow}</p>
          ) : null}
          <RevealText as="h2" text={title} className="font-display text-display-lg mt-3 italic" />
        </div>
        <div className="hidden gap-2 md:flex">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            disabled={edges.start}
            aria-label="Previous products"
            className="border-ink hover:bg-ink hover:text-bg flex size-11 items-center justify-center rounded-full border transition-colors disabled:pointer-events-none disabled:opacity-30"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            disabled={edges.end}
            aria-label="Next products"
            className="border-ink hover:bg-ink hover:text-bg flex size-11 items-center justify-center rounded-full border transition-colors disabled:pointer-events-none disabled:opacity-30"
          >
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
      <ul
        ref={track}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="mt-10 flex snap-x snap-mandatory scroll-px-(--rail-pad) [scrollbar-width:none] gap-4 overflow-x-auto scroll-smooth px-(--rail-pad) pb-4 select-none [--rail-pad:max(var(--spacing-gutter),calc((100vw_-_var(--container-site))/2_+_var(--spacing-gutter)))] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => (
          <li
            key={p.id}
            className="w-[70vw] shrink-0 snap-start sm:w-[42vw] md:w-[30vw] lg:w-[22vw] xl:w-[300px]"
          >
            <ProductCard product={p} sizes="(min-width: 1024px) 300px, 70vw" />
          </li>
        ))}
      </ul>
    </section>
  );
}
