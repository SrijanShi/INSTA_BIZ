"use client";

import { useEffect, useRef } from "react";
import { PAW_PATH } from "@/components/icons";
import { useReducedMotion } from "@/lib/motion";

/** Spacing between prints, in pixels of mouse travel. */
const STEP = 46;
const LIFETIME = 1000;
const FADE_FROM = 600;
const MAX_PRINTS = 14;

type Print = { x: number; y: number; angle: number; born: number };

/** Little paw prints that follow the mouse and fade away (desktop only). */
export function PawTrail() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const paw = new Path2D(PAW_PATH);
    const prints: Print[] = [];
    let dpr = 1;
    let frameId = 0;
    let drawing = false;
    let lastX = NaN;
    let lastY = NaN;
    let travelled = 0;
    // Alternate left/right feet.
    let side = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
    };
    resize();

    const draw = (now: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = prints.length - 1; i >= 0; i--) {
        const p = prints[i];
        const age = now - p.born;
        if (age > LIFETIME) {
          prints.splice(i, 1);
          continue;
        }
        const life = age < FADE_FROM ? 1 : 1 - (age - FADE_FROM) / (LIFETIME - FADE_FROM);
        ctx.globalAlpha = 0.42 * life * life;
        ctx.setTransform(0.27 * dpr, 0, 0, 0.27 * dpr, p.x * dpr, p.y * dpr);
        ctx.rotate(p.angle);
        ctx.translate(-32, -34);
        ctx.fillStyle = "#c2622b";
        ctx.fill(paw);
      }
      if (prints.length) frameId = requestAnimationFrame(draw);
      else drawing = false;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (Number.isNaN(lastX)) {
        lastX = e.clientX;
        lastY = e.clientY;
        return;
      }
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      travelled += Math.hypot(dx, dy);
      if (travelled >= STEP) {
        travelled = 0;
        const angle = Math.atan2(dy, dx) + Math.PI / 2;
        side = -side;
        const offset = 7 * side;
        prints.push({
          x: e.clientX + Math.cos(angle) * offset + 14,
          y: e.clientY + Math.sin(angle) * offset + 16,
          angle,
          born: performance.now(),
        });
        if (prints.length > MAX_PRINTS) prints.shift();
        if (!drawing) {
          drawing = true;
          frameId = requestAnimationFrame(draw);
        }
      }
      lastX = e.clientX;
      lastY = e.clientY;
    };

    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("resize", resize);
    return () => {
      removeEventListener("pointermove", onMove);
      removeEventListener("resize", resize);
      cancelAnimationFrame(frameId);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [reduced]);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70] size-full" />;
}
