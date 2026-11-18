import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge our custom font-size scale (globals.css @theme) so classes like
// `text-menu` / `text-display-xl` aren't mistaken for text colours and dropped.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display-2xl", "display-xl", "display-lg", "display-md", "menu"],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
