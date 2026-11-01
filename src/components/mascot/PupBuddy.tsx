"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { useReducedMotion } from "@/lib/motion";
import { PupDriver } from "./driver";
import { PupSvg } from "./PupSvg";
import { poses, type PoseName } from "./rig";
import { burstHearts, nextTrick, tricks, type Timeline, type TrickContext, type TrickName } from "./tricks";

/** Peeking/snuggled Teddy can't spin or beg, so it has its own repertoire. */
const PEEK_TRICKS: TrickName[] = ["peekaboo", "woof", "tilt", "sneeze"];
const SNUG_TRICKS: TrickName[] = ["tilt", "love", "sneeze", "woof"];

type Props = {
  pose?: PoseName;
  facing?: "left" | "right";
  /** "tilt": keep cocking the head as if listening. */
  act?: "tilt";
  label?: string;
  className?: string;
  style?: CSSProperties;
  /**
   * A "stop" for the home page's walking Teddy: hidden while the walker is
   * present, and its idle animation pauses.
   */
  asStop?: boolean;
};

/**
 * Teddy the mascot. Renders a static SVG on the server; on the client it
 * comes alive while on screen: breathing, blinking, wagging, following the
 * pointer, enjoying being hovered ("petted") and doing a trick when clicked.
 */
export function PupBuddy({ pose = "sit", facing = "right", act, label, className = "", style, asStop = false }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const host = hostRef.current!;
    const bubble = bubbleRef.current!;
    const dir = facing === "left" ? -1 : 1;
    const d = new PupDriver(host.querySelector("svg")!, pose, dir);
    d.wag(0.6);

    const seconds = () => performance.now() / 1000;
    let timeline: Timeline = [];
    let last = seconds();
    let lastIdle = last;
    let bubbleUntil = 0;
    let pointer: { x: number; y: number; t: number } | null = null;
    let lastTrick: TrickName | null = null;
    let streak = 0;
    let lastClick = 0;
    let playing = false;
    let playUntil = 0;

    const ctx: TrickContext = {
      d,
      rest: poses[pose],
      facing: dir,
      say(text, duration = 1.4) {
        bubble.textContent = text;
        bubble.dataset.show = "true";
        bubbleUntil = seconds() + duration;
      },
      hearts: () => burstHearts(host, host.clientWidth * (dir > 0 ? 0.7 : 0.3), host.clientHeight * 0.25),
    };

    const loop = () => {
      const now = seconds();
      const dt = Math.min(0.05, now - last);
      last = now;
      while (timeline.length && timeline[0][0] <= now) timeline.shift()![1](now);
      if (playing !== now < playUntil) {
        playing = !playing;
        host.toggleAttribute("data-playing", playing);
      }
      d.lookAt(pointer && now - pointer.t < 3 ? pointer : null);
      if (act === "tilt" && !timeline.length) {
        const s = Math.sin(now * 0.9);
        d.cock(s > 0.35 ? 13 : s < -0.35 ? -10 : 0);
      }
      // Every ~9 idle seconds: a curious head tilt or a happy wag.
      if (!timeline.length && now - lastIdle > 9) {
        lastIdle = now;
        timeline =
          Math.random() < 0.5
            ? tricks.tilt(ctx, now)
            : [
                [now, () => d.wag(1)],
                [now + 2.2, () => d.wag(0.6)],
              ];
      }
      if (bubble.dataset.show === "true" && now > bubbleUntil) bubble.dataset.show = "false";
      d.tick(dt, now);
      frameId = requestAnimationFrame(loop);
    };

    // Only animate while visible (and, for stops, while no walker is around).
    let frameId = 0;
    let running = false;
    const setRunning = (on: boolean) => {
      if (asStop && document.documentElement.dataset.pup) on = false;
      if (on === running) return;
      running = on;
      if (on) {
        last = seconds();
        frameId = requestAnimationFrame(loop);
      } else cancelAnimationFrame(frameId);
    };
    const observer = new IntersectionObserver(([entry]) => setRunning(entry.isIntersecting));
    observer.observe(host);

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") pointer = { x: e.clientX, y: e.clientY, t: seconds() };
    };
    const onClick = () => {
      const now = seconds();
      streak = now - lastClick < 0.7 ? streak + 1 : 1;
      lastClick = now;
      const pool = pose === "peek" ? PEEK_TRICKS : pose === "snug" ? SNUG_TRICKS : null;
      let trick: TrickName;
      if (pool) {
        const options = pool.filter((t) => t !== lastTrick);
        trick = options[Math.floor(Math.random() * options.length)];
      } else trick = nextTrick(lastTrick, streak);
      lastTrick = trick;
      d.reset();
      timeline = tricks[trick](ctx, now);
      playUntil = timeline[timeline.length - 1][0] + 0.4;
      lastIdle = now;
    };
    const onPointerEnter = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        d.petting(true);
        d.wag(1);
      }
    };
    const onPointerLeave = () => {
      d.petting(false);
      d.wag(0.6);
    };

    addEventListener("pointermove", onPointerMove, { passive: true });
    host.addEventListener("click", onClick);
    host.addEventListener("pointerenter", onPointerEnter);
    host.addEventListener("pointerleave", onPointerLeave);
    return () => {
      setRunning(false);
      host.removeAttribute("data-playing");
      observer.disconnect();
      removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("click", onClick);
      host.removeEventListener("pointerenter", onPointerEnter);
      host.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [reduced, pose, facing, act, asStop]);

  return (
    <div
      ref={hostRef}
      className={`pup-buddy ${className}`}
      style={style}
      data-live={reduced ? undefined : ""}
      data-facing={facing}
    >
      {/* Re-mount the SVG when animation toggles so it starts from the static pose. */}
      <PupSvg key={String(reduced)} pose={pose} facing={facing} label={label} />
      <span ref={bubbleRef} aria-hidden="true" className="pup-bubble" data-show="false" />
    </div>
  );
}
