"use client";

import { useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useId, useRef } from "react";
import { FlightSvg } from "@/components/Flight";
import { useReducedMotion } from "@/lib/motion";

/**
 * A plane that flies along the Korea → Dubai route as you scroll past it,
 * optionally with a puppy looking out of the porthole.
 */
export function ScrollFlight({ label, photoSrc }: { label: string; photoSrc?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const routeRef = useRef<SVGPathElement>(null);
  const planeRef = useRef<SVGGElement>(null);
  const clipId = useId();
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ["start 95%", "end 25%"] });

  // Place the plane along the route, nose pointing the way it travels.
  const place = (progress: number) => {
    const route = routeRef.current;
    const plane = planeRef.current;
    if (!route || !plane) return;
    const total = route.getTotalLength();
    const at = Math.min(total, Math.max(0, progress * total));
    const p = route.getPointAtLength(at);
    const ahead = route.getPointAtLength(Math.min(total, at + 1));
    const behind = route.getPointAtLength(Math.max(0, at - 1));
    const angle = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;
    plane.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${angle.toFixed(1)})`);
    // Take off from just past Korea.
    plane.style.opacity = String(Math.min(1, Math.max(0, (progress - 0.11) / 0.06)));
  };

  useMotionValueEvent(scrollYProgress, "change", (v) => !reduced && place(v));
  useEffect(() => place(reduced ? 0.62 : scrollYProgress.get()), [reduced, scrollYProgress]);

  return (
    <div ref={wrapRef} className="tp-flight">
      <FlightSvg label={label} photoSrc={photoSrc} clipId={clipId} routeRef={routeRef} planeRef={planeRef} />
    </div>
  );
}
