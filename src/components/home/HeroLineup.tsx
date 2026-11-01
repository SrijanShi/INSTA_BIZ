"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { MediaImage } from "@/components/MediaImage";
import type { Media } from "@/lib/content";
import { prefersReducedMotion } from "@/lib/motion";

export type Friend = { id: string; slug: string; displayName: string; breed: string; cover: Media };

/** Arched seats along the quilt: [left %, width rem, how far the pup peeks up, tilt deg]. */
const SEATS: [x: number, w: number, peek: number, tilt: number][] = [
  [9, 8.6, 0.62, -5],
  [22.5, 10.4, 0.8, 3],
  [35, 9.2, 0.7, -2],
  [65, 9.4, 0.74, 3],
  [77.5, 10.6, 0.82, -3],
  [91, 8.4, 0.6, 4],
];

/** Pauses between swaps, cycled so the rhythm feels organic. */
const PAUSES = [1900, 2500, 1700, 2300, 2000, 2800, 1800];

function shuffle<T>(items: T[]) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const seatStyle = (i: number) => {
  const [x, w, peek, tilt] = SEATS[i];
  return { "--x": `${x}%`, "--w": `${w}rem`, "--peek": peek, "--tilt": `${tilt}deg`, "--i": i } as CSSProperties;
};

/**
 * Puppies peeking over the quilt. Every couple of seconds one ducks down and
 * pops back up, swapped for a puppy waiting "in the wings" (preloaded off
 * screen so the swap never shows a half-loaded photo). Pauses while the
 * visitor scrolls or interacts, and when the hero is off screen.
 */
export function HeroLineup({ friends }: { friends: Friend[] }) {
  const seatsCount = Math.min(SEATS.length, friends.length);
  const [seated, setSeated] = useState(() => friends.slice(0, seatsCount).map((_, i) => i));
  const [motion, setMotion] = useState<Record<number, "duck" | "pop" | undefined>>({});
  const [popped, setPopped] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [wings, setWings] = useState<number | null>(friends.length > seatsCount ? seatsCount : null);
  const listRef = useRef<HTMLUListElement>(null);
  const wingsRef = useRef<HTMLSpanElement>(null);
  const seatedRef = useRef(seated);

  useEffect(() => {
    seatedRef.current = seated;
  }, [seated]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || !seatsCount || prefersReducedMotion()) return;
    const canSwap = friends.length > seatsCount;
    const scene = list.closest<HTMLElement>("[data-pup-scene]");
    let visible = true;
    let quietUntil = 0;
    let alive = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.35 });
    io.observe(list);
    const hush = () => (quietUntil = performance.now() + 1200);
    addEventListener("scroll", hush, { passive: true });
    addEventListener("pointerdown", hush, { passive: true });
    list.addEventListener("pointerover", hush, { passive: true });

    const offstage = () => friends.map((_, i) => i).filter((i) => !seatedRef.current.includes(i));
    const first = offstage();
    // The puppy already preloaded in the wings goes on first.
    let queue = first.includes(seatsCount) ? [seatsCount, ...shuffle(first.filter((i) => i !== seatsCount))] : shuffle(first);
    let seatOrder: number[] = [];
    let lastSeat = -1;
    let beat = 0;
    let retries = 0;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const after = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));

    const next = () => {
      const ready = !document.hidden && visible && performance.now() > quietUntil && scene?.dataset.here !== "false";
      if (!ready) return after(next, 900);
      if (!canSwap) return swap();
      if (!queue.length) queue = shuffle(offstage());
      // Wait until the incoming photo has decoded.
      const img = wingsRef.current?.dataset.for === String(queue[0]) ? wingsRef.current.querySelector("img") : null;
      if (!img || !img.complete || !img.naturalWidth) {
        if (++retries < 15) return after(next, 400);
        queue.push(queue.shift()!);
        setWings(queue[0] ?? null);
        retries = 0;
        return after(next, 800);
      }
      retries = 0;
      img.decode().then(swap, swap);
    };

    const swap = () => {
      if (!seatOrder.length) {
        const shown = [...list.children].map((el, i) => (el.getClientRects().length ? i : -1)).filter((i) => i >= 0);
        seatOrder = shuffle(shown).filter((seat, i, all) => !(i === 0 && seat === lastSeat && all.length > 1));
      }
      const seat = seatOrder.shift();
      if (seat === undefined) return after(next, 2000);
      lastSeat = seat;
      const incoming = canSwap ? queue.shift()! : seatedRef.current[seat];
      setMotion((m) => ({ ...m, [seat]: "duck" }));
      after(() => {
        if (canSwap) {
          const outgoing = seatedRef.current[seat];
          setSeated((s) => s.map((f, i) => (i === seat ? incoming : f)));
          queue.push(outgoing);
          setWings(queue[0] ?? null);
        }
        setMotion((m) => ({ ...m, [seat]: "pop" }));
        setPopped(seat);
        after(() => setPopped((p) => (p === seat ? null : p)), 1800);
        after(() => setMotion((m) => ({ ...m, [seat]: undefined })), 700);
      }, 360);
      after(next, PAUSES[beat++ % PAUSES.length]);
    };

    if (canSwap) setWings(queue[0] ?? null);
    // Start once the entrance "peek" animations have finished.
    const entrances = [...list.querySelectorAll(".tp-lineup__pup")]
      .flatMap((el) => el.getAnimations())
      .filter((a) => (a as CSSAnimation).animationName === "tp-peek");
    const start = () => alive && after(next, 250);
    Promise.all(entrances.map((a) => a.finished)).then(start, start);

    return () => {
      alive = false;
      timers.forEach(clearTimeout);
      timers = [];
      io.disconnect();
      removeEventListener("scroll", hush);
      removeEventListener("pointerdown", hush);
      list.removeEventListener("pointerover", hush);
    };
  }, [friends, seatsCount]);

  if (!seatsCount) return null;
  const unhover = (seat: number) => () => setHovered((h) => (h === seat ? null : h));

  return (
    <>
      <ul ref={listRef} className="tp-lineup" aria-label="Some of the puppies in our showroom">
        {seated.map((friendIndex, seat) => {
          const pup = friends[friendIndex];
          return (
            <li key={seat} className="tp-lineup__seat" style={seatStyle(seat)}>
              <Link
                href={`/puppies/${pup.slug}`}
                className="tp-lineup__pup"
                data-pup-friend
                data-state={motion[seat]}
                aria-label={`Meet ${pup.displayName}, ${pup.breed}`}
                onPointerEnter={() => setHovered(seat)}
                onPointerLeave={unhover(seat)}
                onFocus={() => setHovered(seat)}
                onBlur={unhover(seat)}
              >
                <span className="tp-lineup__photo">
                  <MediaImage key={pup.id} media={pup.cover} sizes="11rem" preload={seat < 2} eager />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {/* Name tags that pop up above a puppy when it appears or is hovered. */}
      <ul aria-hidden="true" className="tp-lineup tp-lineup--tags">
        {seated.map((friendIndex, seat) => (
          <li key={seat} className="tp-lineup__seat" style={seatStyle(seat)}>
            <span
              className="tp-lineup__ghost"
              data-state={motion[seat]}
              data-tag={popped === seat || hovered === seat ? "show" : undefined}
            >
              <span className="tp-lineup__name font-scrawl">{friends[friendIndex].displayName}</span>
            </span>
          </li>
        ))}
      </ul>
      {wings !== null && (
        <span ref={wingsRef} aria-hidden="true" className="tp-lineup__wings" data-for={wings}>
          <MediaImage media={friends[wings].cover} sizes="11rem" alt="" eager />
        </span>
      )}
    </>
  );
}
