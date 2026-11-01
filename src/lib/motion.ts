"use client";

import { useSyncExternalStore } from "react";

const REDUCED = "(prefers-reduced-motion: reduce)";

export const prefersReducedMotion = () => matchMedia(REDUCED).matches;

function useMedia(query: string, serverValue: boolean) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => matchMedia(query).matches,
    () => serverValue,
  );
}

/**
 * True when the visitor prefers reduced motion. Assumes "reduced" during
 * server rendering so animated components hydrate in their static state.
 */
export const useReducedMotion = () => useMedia(REDUCED, true);

export const useMediaQuery = (query: string) => useMedia(query, false);
