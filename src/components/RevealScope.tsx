"use client";

import { useEffect, useRef, type HTMLAttributes } from "react";
import { curtainDown } from "@/components/shell/RouteCurtain";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Reveals `[data-reveal]` descendants as they scroll into view by setting
 * `data-revealed`. Elements already on screen show immediately (no flash);
 * those below the fold are "armed" first so CSS can hide them until then.
 * While the route curtain is down, reveals wait until it lifts.
 */
export function RevealScope({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scope = ref.current;
    if (!scope) return;
    const pendingSelector = "[data-reveal]:not([data-revealed])";

    if (prefersReducedMotion()) {
      const revealAll = () =>
        scope.querySelectorAll<HTMLElement>(pendingSelector).forEach((el) => (el.dataset.revealed = "true"));
      revealAll();
      const mo = new MutationObserver(revealAll);
      mo.observe(scope, { childList: true, subtree: true });
      return () => mo.disconnect();
    }

    const waiting = new Set<HTMLElement>();
    const reveal = (el: HTMLElement) => {
      el.dataset.revealed = "true";
      io.unobserve(el);
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          if (curtainDown()) waiting.add(el);
          else reveal(el);
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    );
    const arm = (el: HTMLElement) => {
      if (el.dataset.armed) return io.observe(el);
      const box = el.getBoundingClientRect();
      if (box.top < innerHeight && box.bottom > 0 && !curtainDown()) {
        el.dataset.revealed = "true";
        return;
      }
      el.dataset.armed = "true";
      io.observe(el);
    };
    scope.querySelectorAll<HTMLElement>(pendingSelector).forEach(arm);
    // Content added later (e.g. filtered lists) is picked up too.
    const mo = new MutationObserver(() => scope.querySelectorAll<HTMLElement>(pendingSelector).forEach(arm));
    mo.observe(scope, { childList: true, subtree: true });

    const flush = () => {
      waiting.forEach(reveal);
      waiting.clear();
    };
    addEventListener("tp:arrived", flush);
    let timer: ReturnType<typeof setTimeout>;
    const flushWhenUp = () => (curtainDown() ? (timer = setTimeout(flushWhenUp, 400)) : flush());
    timer = setTimeout(flushWhenUp, 1600);

    return () => {
      clearTimeout(timer);
      io.disconnect();
      mo.disconnect();
      removeEventListener("tp:arrived", flush);
    };
  }, []);

  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
}
