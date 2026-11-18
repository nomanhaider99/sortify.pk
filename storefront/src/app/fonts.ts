import { Archivo, Cormorant_Garamond, Poppins } from "next/font/google";

/** Display serif with italics (headings, hero, product names). */
export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

/** Body / UI geometric sans. */
export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

/** Heavy grotesk for the full-page menu links. */
export const archivo = Archivo({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-archivo",
  display: "swap",
});

export const fontVariables = `${cormorant.variable} ${poppins.variable} ${archivo.variable}`;
