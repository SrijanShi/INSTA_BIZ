"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Wraps the site header: tucks it away while scrolling down, brings it back
 * when scrolling up (or when something inside it gets keyboard focus).
 */
export function HeaderBehavior({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const home = usePathname() === "/";

  useEffect(() => {
    const header = ref.current!;
    let lastY = scrollY;
    let queued = false;
    const update = () => {
      const y = scrollY;
      header.dataset.scrolled = y > 8 ? "true" : "false";
      if (Math.abs(y - lastY) > 6) {
        header.dataset.hidden = y > lastY && y > 220 ? "true" : "false";
        lastY = y;
      }
      queued = false;
    };
    const onScroll = () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    };
    const onFocus = () => (header.dataset.hidden = "false");
    update();
    addEventListener("scroll", onScroll, { passive: true });
    header.addEventListener("focusin", onFocus);
    return () => {
      removeEventListener("scroll", onScroll);
      header.removeEventListener("focusin", onFocus);
    };
  }, []);

  return (
    <header
      ref={ref}
      id="site-header"
      data-scrolled="false"
      data-hidden="false"
      data-home={home || undefined}
      className="tp-header fixed inset-x-0 top-0 z-50"
    >
      {children}
    </header>
  );
}
