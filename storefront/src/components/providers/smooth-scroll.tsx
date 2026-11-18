"use client";

import Lenis from "lenis";
import { useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";

const LenisContext = createContext<RefObject<Lenis | null> | null>(null);

/**
 * Returns a getter for the Lenis instance. It is `null` when smooth scroll is disabled
 * (reduced motion) or not yet mounted, so call it inside effects/handlers, not during render.
 */
export function useLenis(): () => Lenis | null {
  const ref = useContext(LenisContext);
  return () => ref?.current ?? null;
}

/** Site-wide Lenis smooth scroll. Disabled under `prefers-reduced-motion`. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion() ?? false;
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (reduced) return;
    const instance = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      autoRaf: true,
    });
    lenisRef.current = instance;
    return () => {
      instance.destroy();
      lenisRef.current = null;
    };
  }, [reduced]);

  // Start each route at the top.
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return <LenisContext.Provider value={lenisRef}>{children}</LenisContext.Provider>;
}
