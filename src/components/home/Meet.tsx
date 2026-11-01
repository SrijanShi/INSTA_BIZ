"use client";

import { motion, useScroll, useSpring, useTransform } from "motion/react";
import Link from "next/link";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { PupStop } from "@/components/mascot/PupStop";
import { Scene, tones } from "@/components/Scene";
import type { Puppy, Section } from "@/lib/content";
import { useReducedMotion } from "@/lib/motion";
import { Door } from "./Door";
import { cuePup } from "./pupCue";

/**
 * "Meet the pups". On large screens the section pins and scrolling walks
 * Teddy along a hallway of doors: the track slides sideways and each door
 * swings open as it reaches him. On small screens it is a plain grid.
 */
export function Meet({ section, puppies }: { section: Section; puppies: Puppy[] }) {
  const rangeRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const hallRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [overflow, setOverflow] = useState(0);
  const [pinned, setPinned] = useState(false);
  const ctaHref = (section.data.ctaHref as string) ?? "/puppies";

  // Measure how far the track must travel, and size doors to fit the screen.
  useLayoutEffect(() => {
    const measure = () => {
      const wide = matchMedia("(min-width: 1024px)").matches;
      setPinned(wide && !reduced);
      const track = trackRef.current;
      const hall = hallRef.current;
      if (hall && track && wide && !reduced) {
        const stage = hall.parentElement!;
        const head = stage.querySelector<HTMLElement>(".tp-meet__head");
        const plate = Math.max(64, ...[...track.querySelectorAll<HTMLElement>(".tp-door__plate")].map((p) => p.offsetHeight));
        const floor = hall.querySelector<HTMLElement>(".tp-meet__floor")?.offsetHeight ?? 0;
        const room = stage.clientHeight - (head ? head.offsetTop + head.offsetHeight : 0) - floor - plate - 40;
        const doorWidth = Math.max(128, Math.min(256, innerWidth * 0.15, room / 1.3));
        hall.style.setProperty("--door-w", `${doorWidth.toFixed(0)}px`);
      } else hall?.style.removeProperty("--door-w");
      setOverflow(track ? Math.max(0, track.scrollWidth - innerWidth) : 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    if (hallRef.current?.parentElement) ro.observe(hallRef.current.parentElement);
    addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      removeEventListener("resize", measure);
    };
  }, [reduced]);

  const { scrollYProgress } = useScroll({ target: rangeRef, offset: ["start start", "end end"] });
  const eased = useSpring(scrollYProgress, { stiffness: 170, damping: 32, mass: 0.35 });
  const x = useTransform(eased, [0, 1], [0, -overflow]);

  // Open the doors Teddy has reached (and have him glance at each one).
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!pinned || !track) return;
    const update = (offset: number, cue: boolean) => {
      hallRef.current?.style.setProperty("--floor-x", `${offset.toFixed(1)}px`);
      const teddyX = innerWidth * 0.36;
      for (const door of track.children as HTMLCollectionOf<HTMLElement>) {
        const open = door.offsetLeft + offset < teddyX;
        if ((door.dataset.open === "true") !== open) {
          door.dataset.open = String(open);
          if (open && cue) cuePup({ look: door, secs: 0.9 });
        }
      }
    };
    update(x.get(), false);
    return x.on("change", (v) => update(v, true));
  }, [pinned, x]);

  if (!puppies.length) return null;

  return (
    <Scene tone={tones.meet} aria-labelledby="meet-title" className="tp-meet" data-pinned={pinned || undefined}>
      <div
        ref={rangeRef}
        data-pin-range
        style={{ height: pinned ? `calc(100vh + ${Math.round(overflow * 0.8)}px)` : undefined, "--pinned": pinned ? 1 : 0 } as CSSProperties}
      >
        <div className="tp-meet__stage">
          <header className="tp-meet__head gutter">
            <div>
              <h2 id="meet-title" className="font-plush text-huge">
                {section.heading}
              </h2>
              {section.body && <p className="text-lede mt-3 max-w-[44ch] text-[var(--ink-soft)]">{section.body}</p>}
            </div>
            {typeof section.data.ctaLabel === "string" && (
              <Link href={ctaHref} className="btn btn-primary shrink-0">
                {section.data.ctaLabel}
              </Link>
            )}
          </header>
          <div ref={hallRef} className="tp-meet__hall">
            <motion.ol
              ref={trackRef}
              style={pinned ? { x } : undefined}
              className="tp-meet__track"
              data-treadmill
              aria-label="Puppies looking for a family"
            >
              {puppies.map((pup, i) => (
                <li key={pup.id} className="tp-door" data-open={pinned ? "false" : "true"}>
                  <Door pup={pup} index={i} sizes="(min-width: 1024px) 15rem, 44vw" />
                </li>
              ))}
              <li className="tp-door tp-door--all" data-open="true">
                <Link href={ctaHref} className="tp-door__link">
                  <span className="tp-door__frame tp-door__frame--all">
                    <span className="font-plush tp-door__all">Meet them all</span>
                  </span>
                </Link>
              </li>
            </motion.ol>
            <div aria-hidden="true" className="tp-meet__floor" />
            <PupStop pose={pinned ? "walk" : "sit"} act={pinned ? "treadmill" : undefined} className="tp-meet__teddy" />
          </div>
        </div>
      </div>
    </Scene>
  );
}
