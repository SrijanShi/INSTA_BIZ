import { Figtree, Fraunces, Shantell_Sans } from "next/font/google";

/** Headlines: soft, slightly wonky serif. */
export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

/** Body copy. */
export const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

/** Handwritten notes and labels. */
export const shantell = Shantell_Sans({
  subsets: ["latin"],
  variable: "--font-shantell",
  axes: ["BNCE", "INFM"],
  display: "swap",
});

export const fontVariables = `${fraunces.variable} ${figtree.variable} ${shantell.variable}`;
