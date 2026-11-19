"use client";

/**
 * Fly-to-cart (PLAN §5.4): clones the product image at its on-screen position and animates it
 * along a curved path into the header cart icon, shrinking and fading. Resolves when it lands.
 * Skipped (resolves immediately) under reduced motion or when either element is not visible.
 */
export function flyToCart(source: HTMLElement | null, imageUrl: string | null): Promise<void> {
  if (typeof window === "undefined" || !source || !imageUrl) return Promise.resolve();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return Promise.resolve();
  const target = document.querySelector<HTMLElement>("[data-cart-target]");
  if (!target) return Promise.resolve();

  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (!from.width || !to.width) return Promise.resolve();

  const size = Math.min(from.width, from.height, 220);
  const startX = from.left + from.width / 2 - size / 2;
  const startY = from.top + from.height / 2 - size / 2;
  const endX = to.left + to.width / 2 - size / 2;
  const endY = to.top + to.height / 2 - size / 2;

  const clone = document.createElement("img");
  clone.src = imageUrl;
  clone.alt = "";
  clone.setAttribute("aria-hidden", "true");
  Object.assign(clone.style, {
    position: "fixed",
    left: `${startX}px`,
    top: `${startY}px`,
    width: `${size}px`,
    height: `${size}px`,
    objectFit: "cover",
    borderRadius: "4px",
    zIndex: "70",
    pointerEvents: "none",
    boxShadow: "0 18px 40px -18px rgb(31 42 26 / 0.45)",
  });
  document.body.appendChild(clone);

  // Quadratic bezier sampled into keyframes: control point lifts above the straight line.
  const dx = endX - startX;
  const dy = endY - startY;
  const cx = dx * 0.5;
  const cy = Math.min(dy, 0) - 160;
  const steps = 12;
  const frames: Keyframe[] = Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const x = 2 * (1 - t) * t * cx + t * t * dx;
    const y = 2 * (1 - t) * t * cy + t * t * dy;
    const scale = 1 - t * 0.86;
    return {
      transform: `translate(${x}px, ${y}px) scale(${scale})`,
      opacity: t < 0.85 ? 1 : 1 - (t - 0.85) / 0.15,
      offset: t,
    };
  });

  const animation = clone.animate(frames, {
    duration: 820,
    easing: "cubic-bezier(0.45, 0, 0.2, 1)",
  });
  return animation.finished.then(
    () => clone.remove(),
    () => clone.remove(),
  );
}
