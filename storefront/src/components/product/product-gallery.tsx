"use client";

import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { Dialog } from "radix-ui";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { cn } from "@/lib/cn";

type GalleryImage = { id: string; url: string; alt: string };

/**
 * PDP gallery: large image with thumbnail rail (desktop), swipeable scroll-snap strip (mobile),
 * hover zoom that follows the cursor, and a lightbox. `activeId` lets a chosen variant switch the image.
 */
export function ProductGallery({
  images,
  activeId,
  title,
}: {
  images: GalleryImage[];
  activeId?: string | null;
  title: string;
}) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const strip = useRef<HTMLDivElement>(null);

  // Follow the selected variant's image.
  useEffect(() => {
    if (!activeId) return;
    const i = images.findIndex((img) => img.id === activeId);
    if (i < 0) return;
    const id = requestAnimationFrame(() => setIndex(i));
    strip.current?.children[i]?.scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest",
    });
    return () => cancelAnimationFrame(id);
  }, [activeId, images]);

  const current = images[index] ?? images[0];
  if (!current) return null;

  const onMove = (e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  };
  const go = (d: 1 | -1) => setIndex((i) => (i + d + images.length) % images.length);

  return (
    <div className="lg:sticky lg:top-24">
      {/* Mobile: swipeable strip */}
      <div
        ref={strip}
        className="-mx-[var(--spacing-gutter)] flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto md:hidden [&::-webkit-scrollbar]:hidden"
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        aria-label={`${title} images`}
      >
        {images.map((img, i) => (
          <div
            key={img.id}
            className="bg-surface-muted relative aspect-[4/5] w-full shrink-0 snap-start"
          >
            <Image
              src={img.url}
              alt={img.alt}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      {images.length > 1 ? (
        <div className="mt-3 flex justify-center gap-1.5 md:hidden" aria-hidden>
          {images.map((img, i) => (
            <span
              key={img.id}
              className={cn(
                "h-1 rounded-full transition-all",
                i === index ? "bg-ink w-6" : "bg-border w-2",
              )}
            />
          ))}
        </div>
      ) : null}

      {/* Desktop: thumbnails + main image */}
      <div className="hidden gap-4 md:flex">
        {images.length > 1 ? (
          <ul className="flex w-20 shrink-0 flex-col gap-3" aria-label="Choose image">
            {images.map((img, i) => (
              <li key={img.id}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Show image ${i + 1}`}
                  aria-current={i === index}
                  className={cn(
                    "bg-surface-muted relative block aspect-[4/5] w-full overflow-hidden rounded-xs border transition-colors",
                    i === index ? "border-ink" : "hover:border-border border-transparent",
                  )}
                >
                  <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="relative flex-1">
          <button
            type="button"
            onMouseMove={onMove}
            onMouseLeave={() => setZoom(null)}
            onClick={() => setLightbox(true)}
            aria-label="Open image full screen"
            className="bg-surface-muted relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-sm"
          >
            <AnimatePresence initial={false}>
              <motion.div
                key={current.id}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Image
                  src={current.url}
                  alt={current.alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover transition-transform duration-300 ease-out"
                  style={
                    zoom
                      ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
                      : undefined
                  }
                />
              </motion.div>
            </AnimatePresence>
            <span
              className="bg-surface/90 absolute right-4 bottom-4 flex size-10 items-center justify-center rounded-full"
              aria-hidden
            >
              <Expand className="size-4" />
            </span>
          </button>
        </div>
      </div>

      <Dialog.Root open={lightbox} onOpenChange={setLightbox}>
        <Dialog.Portal>
          <Dialog.Overlay className="bg-menu-bg/95 fixed inset-0 z-50" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12"
          >
            <Dialog.Title className="sr-only">
              {title} — image {index + 1} of {images.length}
            </Dialog.Title>
            <div className="relative h-full w-full">
              <Image
                src={current.url}
                alt={current.alt}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
            <Dialog.Close
              className="bg-surface text-ink absolute top-4 right-4 flex size-11 items-center justify-center rounded-full"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden />
            </Dialog.Close>
            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous image"
                  className="bg-surface text-ink absolute left-4 flex size-11 items-center justify-center rounded-full"
                >
                  <ChevronLeft className="size-5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next image"
                  className="bg-surface text-ink absolute right-4 flex size-11 items-center justify-center rounded-full"
                >
                  <ChevronRight className="size-5" aria-hidden />
                </button>
              </>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
