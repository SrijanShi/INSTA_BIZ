"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { PawIcon } from "@/components/icons";
import { Runner } from "@/components/mascot/Runner";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Curtain states:
 *  intro    – first load: the blanket lifts off the freshly loaded page
 *  covering – a link was clicked; the blanket is sliding up over the page
 *  covered  – fully covered while the next route loads (Teddy runs)
 *  snap     – back/forward navigation: cover instantly
 *  lifting  – the new page is ready; the blanket slides away
 *  idle     – hidden
 */
type CurtainState = "intro" | "covering" | "covered" | "snap" | "lifting" | "idle";

/** Paw prints Teddy leaves while running: [left %, top px, rotation deg]. */
const PRINTS: [number, number, number][] = [
  [18, 6, 14],
  [27, -4, 6],
  [36, 7, 18],
  [45, -3, 4],
  [54, 6, 16],
];

/** How far the intro's resting animation has played, in ms (∞ once done). */
function introElapsed() {
  const rest = document
    .querySelector<HTMLElement>(".tp-curtain")
    ?.getAnimations()
    .find((a) => (a as CSSAnimation).animationName === "tp-curtain-rest");
  return rest && rest.playState !== "finished" && typeof rest.currentTime === "number" ? rest.currentTime : Infinity;
}

/** True while the curtain hides the page (used to delay scroll reveals). */
export function curtainDown() {
  const state = document.querySelector<HTMLElement>(".tp-curtain")?.dataset.state;
  return (state === "intro" && introElapsed() < 560) || state === "covering" || state === "covered" || state === "snap";
}

/**
 * The blanket that sweeps over the page between routes. It intercepts
 * same-origin link clicks, covers the page, navigates, and lifts once the
 * new route has rendered. Fires `tp:navigate` when leaving a page and
 * `tp:arrived` when the new one is revealed.
 */
export function RouteCurtain() {
  const router = useRouter();
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const pendingHref = useRef<string | null>(null);
  const coveredAt = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastPath = useRef(pathname);
  const focusMain = useRef(false);
  const lift = useRef(() => {});

  useEffect(() => {
    const curtain = ref.current!;
    const root = document.documentElement;
    const setState = (state: CurtainState) => {
      curtain.dataset.state = state;
      if (state === "idle") delete root.dataset.curtain;
      else root.dataset.curtain = state;
    };
    const clearTimers = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    const after = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

    const reveal = () => {
      const state = curtain.dataset.state;
      if (state === "idle" || state === "lifting") return;
      clearTimers();
      pendingHref.current = null;
      setState("lifting");
      dispatchEvent(new Event("tp:arrived"));
      // Keyboard users land on the new page's content.
      if (focusMain.current) {
        focusMain.current = false;
        document.getElementById("main")?.focus({ preventScroll: true });
      }
      after(() => setState("idle"), 460);
    };

    const go = (href: string) => {
      const url = new URL(href, location.href);
      if (url.pathname === location.pathname && url.search === location.search) {
        pendingHref.current = null;
        scrollTo({ top: 0, behavior: "instant" });
        after(reveal, 120);
        return;
      }
      router.push(url.pathname + url.search + url.hash);
      // Safety net in case the route never settles.
      after(reveal, 6000);
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download") || link.dataset.noCurtain !== undefined) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || /^\/(api|media|_next)(\/|$)/.test(url.pathname)) return;
      // In-page anchors scroll instead.
      if (url.pathname === location.pathname && (url.hash || url.search !== location.search)) return;
      if (prefersReducedMotion()) return;

      e.preventDefault();
      e.stopPropagation();
      focusMain.current = e.detail === 0;
      router.prefetch(url.pathname + url.search);
      dispatchEvent(new Event("tp:navigate"));
      pendingHref.current = url.href;

      const state = curtain.dataset.state as CurtainState;
      if (state === "covered" || state === "snap") return go(url.href);
      if (state === "covering") return;
      clearTimers();
      if (state === "intro" && introElapsed() < 1080) {
        setState("covered");
        coveredAt.current = performance.now();
        go(url.href);
      } else {
        setState("covering");
        after(() => {
          setState("covered");
          coveredAt.current = performance.now();
          if (pendingHref.current) go(pendingHref.current);
        }, 300);
      }
    };

    // Back/forward: cover instantly, then reveal the restored page.
    const onPopState = () => {
      if (prefersReducedMotion() || location.pathname === lastPath.current) return;
      clearTimers();
      setState("snap");
      coveredAt.current = performance.now();
      after(reveal, 1400);
    };

    // Restored from the back-forward cache: never show a stale curtain.
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        clearTimers();
        setState("idle");
      }
    };

    if (curtain.dataset.state === "intro") {
      const elapsed = introElapsed();
      after(() => dispatchEvent(new Event("tp:arrived")), Math.max(0, 560 - elapsed));
      after(() => curtain.dataset.state === "intro" && setState("idle"), Math.max(0, 1080 - elapsed));
    }
    if (prefersReducedMotion()) setState("idle");

    addEventListener("click", onClick, true);
    addEventListener("popstate", onPopState);
    addEventListener("pageshow", onPageShow);
    lift.current = reveal;
    return () => {
      clearTimers();
      delete root.dataset.curtain;
      removeEventListener("click", onClick, true);
      removeEventListener("popstate", onPopState);
      removeEventListener("pageshow", onPageShow);
    };
  }, [router]);

  // The new route rendered: lift the curtain (after a minimum cover time).
  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;
    const state = ref.current?.dataset.state;
    if (state !== "covered" && state !== "snap" && state !== "covering") return;
    const wait = state === "covering" ? 340 : Math.max(0, 140 - (performance.now() - coveredAt.current));
    const timer = setTimeout(() => requestAnimationFrame(() => lift.current()), wait);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div ref={ref} className="tp-curtain" data-state="intro" aria-hidden="true">
      <div className="tp-curtain__blanket">
        <svg className="tp-curtain__edge tp-curtain__edge--top" width="100%" height="40" preserveAspectRatio="none">
          <defs>
            <pattern id="tp-curtain-scallop" width="76" height="40" patternUnits="userSpaceOnUse">
              <path d="M0 40V27A38 25 0 0 1 76 27V40Z" fill="#fbe3b4" />
              <path d="M0 27A38 25 0 0 1 76 27" fill="none" stroke="#2a170e" strokeWidth="3" />
              <path
                d="M11 33A27 19 0 0 1 65 33"
                fill="none"
                stroke="#2a170e"
                strokeWidth="1.6"
                strokeDasharray="3.5 5.5"
                strokeLinecap="round"
                opacity=".42"
              />
            </pattern>
          </defs>
          <rect width="100%" height="40" fill="url(#tp-curtain-scallop)" />
        </svg>
        <div className="tp-curtain__stage">
          <div className="tp-curtain__prints">
            {PRINTS.map(([left, top, rotate], i) => (
              <PawIcon
                key={i}
                className="tp-curtain__print"
                style={{ left: `${left}%`, top: `${top}px`, rotate: `${rotate}deg`, animationDelay: `${(0.16 + i * 0.12).toFixed(2)}s` }}
              />
            ))}
          </div>
          <div className="tp-curtain__runner">
            <Runner />
          </div>
          <p className="tp-curtain__note font-scrawl">every puppy is family</p>
        </div>
        <svg className="tp-curtain__edge tp-curtain__edge--bottom" width="100%" height="40" preserveAspectRatio="none">
          <rect width="100%" height="40" fill="url(#tp-curtain-scallop)" />
        </svg>
      </div>
    </div>
  );
}
