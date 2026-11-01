"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { prefersReducedMotion, useReducedMotion } from "@/lib/motion";

let lenis: Lenis | null = null;

/**
 * Buttery wheel scrolling on desktop (Lenis) and smooth in-page anchor
 * jumps everywhere. Touch devices keep native scrolling.
 */
export function SmoothScroll() {
  const reduced = useReducedMotion();

  // Same-page "#section" links glide to their target.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.detail === 0 || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href*='#']") as HTMLAnchorElement | null;
      if (!link || (link.target && link.target !== "_self")) return;
      const url = new URL(link.href, location.href);
      if (
        url.origin !== location.origin ||
        url.pathname !== location.pathname ||
        url.search !== location.search ||
        url.hash.length < 2
      )
        return;
      const id = decodeURIComponent(url.hash.slice(1));
      const target = [...document.querySelectorAll(`[id="${CSS.escape(id)}"]`)].find((el) => el.getClientRects().length);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target as HTMLElement);
      else target.scrollIntoView({ behavior: prefersReducedMotion() ? "instant" : "smooth" });
      history.pushState(null, "", url.hash);
    };
    addEventListener("click", onClick);
    return () => removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (reduced || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const root = document.documentElement;
    const instance = new Lenis({
      autoRaf: true,
      lerp: 0.1,
      wheelMultiplier: 0.85,
      // Let dialogs and marked panels scroll natively.
      prevent: (node) => !!node.closest?.("dialog, [data-lenis-prevent]"),
      // Pause while something (e.g. an open dialog) locks page scroll.
      virtualScroll: () => getComputedStyle(root).overflowY !== "hidden",
    });
    lenis = instance;
    // Stop any in-flight glide when the page changes.
    const settle = () => instance.scrollTo(instance.actualScroll, { immediate: true });
    addEventListener("tp:navigate", settle);
    addEventListener("popstate", settle);
    return () => {
      removeEventListener("tp:navigate", settle);
      removeEventListener("popstate", settle);
      instance.destroy();
      lenis = null;
    };
  }, [reduced]);

  return null;
}
