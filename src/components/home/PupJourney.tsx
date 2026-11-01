"use client";

import { useEffect, useRef } from "react";
import { PAW_PATH } from "@/components/icons";
import { PupDriver } from "@/components/mascot/driver";
import { PupSvg } from "@/components/mascot/PupSvg";
import { WIDTH, poses, type PoseName } from "@/components/mascot/rig";
import { burstHearts, nextTrick, tricks, type Timeline, type TrickContext, type TrickName } from "@/components/mascot/tricks";
import { prefersReducedMotion } from "@/lib/motion";
import { onPupCue } from "./pupCue";

/*
 * The walking Teddy of the home page.
 *
 * Every scene has a "stop" (a static Teddy marked with data-pup-stop). While
 * this component runs, the static ones hide and a single Teddy, drawn in a
 * fixed overlay, travels between them as the page scrolls: he rests at each
 * stop for a band of scroll ("holds") and walks or hops along a curve to the
 * next one in between. On phones he instead peeks in from the screen edges
 * above the WhatsApp bar ("lane" mode).
 */

type Box = [left: number, top: number, right: number, bottom: number];
type Point = { x: number; y: number };
type Rect = { left: number; top: number; right: number; bottom: number };

/** Where a stop sits: fixed to the page, the screen, or a sticky (pinned) element. */
type Track =
  | { kind: "page"; top: number }
  | { kind: "screen"; top: number }
  | { kind: "pin"; top: number; from: number; to: number };

type Stop = { x: number; track: Track; s: number; behind: boolean; sink: number; box: Box };

type StopMeta = {
  scene: HTMLElement | null;
  pose: PoseName;
  facing: number;
  act: string;
  /** Things in the scene worth glancing at. */
  looks: Element[];
  /** Treadmill track (Meet section) whose movement Teddy walks along to. */
  track: Element | null;
};

type Layout = { lane: boolean; stops: Stop[]; meta: StopMeta[]; holds: [number, number][]; blend: number; mainTop: number };

type Placement = Point & { s: number; front: boolean; airborne: boolean; k: number; t: number; walked: number };

/** Teddy's feet in rig coordinates (the point that "stands" on a stop). */
const FEET: Point = { x: 150, y: 228 };
const DEFAULT_BOX: Box = [48, 30, 288, 236];
/** Visible bounds of each pose, so he is kept fully on screen. */
const POSE_BOX: Partial<Record<PoseName, Box>> = {
  sit: [50, 26, 284, 234],
  peek: [148, 34, 280, 163],
  snug: [148, 40, 280, 163],
  bow: [58, 56, 292, 236],
};
const boxFor = (pose: string) => POSE_BOX[pose as PoseName] ?? DEFAULT_BOX;
/** How far a peeking Teddy sinks below the screen edge in lane mode. */
const LANE_SINK = FEET.y - 159;
/** Part of the screen (as fractions of its height) where a stop is "reached". */
const LANE_BAND = [0.6, 0.86];
const PAGE_BAND = [0.42, 0.78];
const WALK_TRICKS = ["jump", "woof", "love", "sneeze"];

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const smoothstep = (n: number) => n * n * (3 - 2 * n);
/** Smoothstep ramp from 0 at `from` to 1 at `to`. */
const ramp = (from: number, to: number, n: number) => (to === from ? +(n >= to) : smoothstep(clamp01((n - from) / (to - from))));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpBox = (a: Box, b: Box, t: number): Box => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)];
/** Smooth max/min, so clamping to the screen edges never looks like a hard stop. */
const softMax = (n: number, floor: number, k: number) => {
  const d = (n - floor) / k;
  return d > 20 ? n : floor + k * Math.log1p(Math.exp(d));
};
const softMin = (n: number, ceil: number, k: number) => -softMax(-n, -ceil, k);

function bezier(p0: Point, c1: Point, c2: Point, p1: Point, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return { x: a * p0.x + b * c1.x + c * c2.x + d * p1.x, y: a * p0.y + b * c1.y + c * c2.y + d * p1.y };
}

/** Screen position of a stop's feet at a given scroll offset. */
function stopPoint(stop: Stop, scroll: number): Point {
  const t = stop.track;
  const top =
    t.kind === "page"
      ? t.top - scroll
      : t.kind === "screen"
        ? t.top
        : scroll < t.from
          ? t.top - (scroll - t.from)
          : scroll > t.to
            ? t.top - (scroll - t.to)
            : t.top;
  return { x: stop.x + FEET.x * stop.s, y: top + FEET.y * stop.s };
}

/** Which hold (k) we are in or leaving, and progress t (0–1) towards the next. */
function segment(holds: [number, number][], scroll: number) {
  if (!holds.length || scroll <= holds[0][1]) return { k: 0, t: 0 };
  for (let i = 0; i < holds.length - 1; i++) {
    const leave = holds[i][1];
    const arrive = holds[i + 1][0];
    if (scroll < arrive) return { k: i, t: clamp01((scroll - leave) / Math.max(1, arrive - leave)) };
    if (scroll <= holds[i + 1][1]) return { k: i + 1, t: 0 };
  }
  return { k: holds.length - 1, t: 0 };
}

/** Keep the (scaled) pose box inside the safe area. */
function keepOnScreen(x: number, y: number, s: number, box: Box, safe: Rect, k = 8) {
  const left = (FEET.x - box[0]) * s;
  const right = (box[2] - FEET.x) * s;
  const above = (FEET.y - box[1]) * s;
  const below = (box[3] - FEET.y) * s;
  return {
    x: safe.right - safe.left > left + right ? softMin(softMax(x, safe.left + left, k), safe.right - right, k) : (safe.left + safe.right) / 2 - (right - left) / 2,
    y: safe.bottom - safe.top > above + below ? softMin(softMax(y, safe.top + above, k), safe.bottom - below, k) : safe.bottom - below,
  };
}

/** Find the nearest sticky ancestor and describe how the stop moves with it. */
function trackFor(el: Element, rect: DOMRect): Track {
  let sticky: HTMLElement | null = null;
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    if (getComputedStyle(p).position === "sticky") {
      sticky = p;
      break;
    }
  }
  if (!sticky) return { kind: "page", top: rect.top + scrollY };
  const stickTop = parseFloat(getComputedStyle(sticky).top) || 0;
  const offset = rect.top - sticky.getBoundingClientRect().top;
  // Measure where the sticky element would sit without sticking.
  const saved = sticky.style.position;
  sticky.style.position = "relative";
  const natural = sticky.getBoundingClientRect();
  const parent = sticky.parentElement!;
  const parentBottom = parent.getBoundingClientRect().bottom - (parseFloat(getComputedStyle(parent).paddingBottom) || 0);
  sticky.style.position = saved;
  const from = natural.top + scrollY - stickTop;
  const to = parentBottom + scrollY - natural.height - stickTop;
  return to <= from ? { kind: "page", top: natural.top + scrollY + offset } : { kind: "pin", top: stickTop + offset, from, to };
}

const isLaneMode = () => matchMedia("(max-width: 767px), (pointer: coarse) and (max-height: 519px)").matches;

function whatsappBar() {
  const bar = document.querySelector("[data-whatsapp-bar]");
  return bar?.getClientRects().length ? bar.getBoundingClientRect() : null;
}

/** Top of the mobile WhatsApp bar (or the bottom of the screen). */
function barTop() {
  const bar = whatsappBar();
  return bar && bar.height ? bar.top : innerHeight - 6;
}

/** Measure every stop and work out the scroll ranges where Teddy rests at each. */
function measure(probe: HTMLElement): Layout {
  const lane = isLaneMode();
  const width = document.documentElement.clientWidth;
  const screenH = probe.getBoundingClientRect().height || innerHeight;
  const headerH = document.getElementById("site-header")?.offsetHeight ?? 76;
  const bar = whatsappBar();
  const safe: Rect = { left: 10, top: headerH + 10, right: width - 10, bottom: screenH - 10 - (bar?.height ?? 0) };
  const main = document.getElementById("main");
  const stops: Stop[] = [];
  const meta: StopMeta[] = [];
  const holds: [number, number][] = [];

  const addStop = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const pose = (el.dataset.pose || "sit") as PoseName;
    const act = el.dataset.act ?? "";
    const stopScale = rect.width / WIDTH;
    // The walker is drawn a touch larger than the static stops on desktop.
    const s = act === "basket" || lane ? stopScale : stopScale * 1.12;
    const anchor = pose === "peek" ? { x: FEET.x, y: 159 } : FEET;
    const track = trackFor(el, rect);
    if (track.kind !== "screen") track.top += anchor.y * (stopScale - s);
    const stop: Stop = {
      x: rect.left + anchor.x * (stopScale - s),
      track,
      s,
      behind: el.dataset.behind === "true",
      sink: 0,
      box: boxFor(pose),
    };
    const scene = el.closest<HTMLElement>("[data-pup-scene]");
    stops.push(stop);
    meta.push({
      scene,
      pose,
      facing: el.dataset.facing === "left" ? -1 : 1,
      act,
      looks: scene ? [...scene.querySelectorAll("[data-pup-look]")] : [],
      track: act === "treadmill" ? (scene?.querySelector("[data-treadmill]") ?? null) : null,
    });

    // Scroll range during which the stop sits in the reading band.
    let hold: [number, number];
    if (track.kind === "pin") hold = [track.from, track.to];
    else {
      const band = lane ? LANE_BAND : PAGE_BAND;
      const top = track.top + stop.box[1] * s;
      const bottom = track.top + stop.box[3] * s;
      const mid = (top + bottom) / 2;
      const h = safe.bottom - safe.top;
      let from = mid - (safe.top + band[1] * h);
      let to = mid - (safe.top + band[0] * h);
      from = Math.max(from, bottom - safe.bottom);
      to = Math.min(to, top - safe.top);
      if (from > to) from = to = mid - (safe.top + h / 2);
      hold = [from, to];
    }
    // Leave a scene before its top scrolls away, so Teddy never lags behind.
    if (!lane && scene && track.kind === "page" && act !== "basket" && act !== "peekaboo") {
      const h = safe.bottom - safe.top;
      const leaveBy = scene.getBoundingClientRect().top + scrollY - safe.top + 0.08 * h;
      const earliest = track.top + stop.box[3] * stop.s - safe.bottom;
      if (hold[1] > leaveBy) {
        const end = Math.max(leaveBy, earliest + 0.12 * h);
        hold = [Math.max(earliest, end - Math.max(hold[1] - hold[0], 0.2 * h)), end];
      }
    }
    holds.push(hold);
  };

  const visibleStops = [...document.querySelectorAll<HTMLElement>("[data-pup-stop]")].filter((el) => el.getClientRects().length);

  if (lane) {
    // Phones: start at the hero, peek in from alternating screen edges for
    // every other scene, and end in the footer basket.
    const laneStops = visibleStops.filter((el) => el.dataset.lane === "true");
    const first = laneStops[0];
    const last = laneStops.length > 1 ? laneStops[laneStops.length - 1] : undefined;
    if (first) addStop(first);
    const firstScene = meta[0]?.scene ?? null;
    const scenes = [...document.querySelectorAll<HTMLElement>("#main [data-pup-scene]")].filter(
      (el) => el !== firstScene && el.getClientRects().length,
    );
    const s = Math.min(0.62, Math.max(0.5, width / 650));
    const box = boxFor("peek");
    scenes.forEach((scene, i) => {
      const fromLeft = i % 2 === 0;
      stops.push({
        x: fromLeft ? safe.left + 2 - box[0] * s : safe.right - 2 - box[2] * s,
        track: { kind: "screen", top: 0 },
        s,
        behind: false,
        sink: LANE_SINK,
        box,
      });
      meta.push({ scene, pose: "peek", facing: fromLeft ? 1 : -1, act: "lane", looks: [], track: null });
      const r = scene.getBoundingClientRect();
      const from = r.top + scrollY - 0.42 * screenH;
      const to = r.bottom + scrollY - 0.58 * screenH;
      holds.push(from <= to ? [from, to] : [(from + to) / 2, (from + to) / 2]);
    });
    if (last) addStop(last);
  } else visibleStops.forEach(addStop);

  const maxScroll = document.documentElement.scrollHeight - innerHeight;
  // Each walk between stops needs enough scroll to look natural.
  const gaps = stops.slice(1).map((stop, i) => {
    const prev = stops[i];
    const minGap = (lane ? 0.32 : 0.5) * screenH;
    const dx = Math.abs(stop.x + FEET.x * stop.s - (prev.x + FEET.x * prev.s));
    return Math.min(1.4 * screenH, Math.max(minGap, 1.15 * Math.hypot(dx, (PAGE_BAND[1] - PAGE_BAND[0]) * screenH)));
  });

  return { lane, stops, meta, holds: fitHolds(holds, gaps, maxScroll), blend: 0.12 * screenH, mainTop: main ? main.getBoundingClientRect().top + scrollY : 0 };
}

/** Make holds ordered, non-overlapping, and separated by at least `gaps`. */
function fitHolds(raw: [number, number][], gaps: number[], maxScroll: number) {
  const holds = raw.map(([a, b]): [number, number] => (a <= b ? [a, b] : [(a + b) / 2, (a + b) / 2]));
  if (!holds.length) return holds;
  holds[0][0] = -Infinity;
  const last = holds[holds.length - 1];
  last[1] = Infinity;
  last[0] = Math.min(last[0], maxScroll - 1);
  for (let i = 0; i < holds.length - 1; i++) {
    const cur = holds[i];
    const next = holds[i + 1];
    if (next[0] < cur[1]) {
      const mid = (cur[1] + next[0]) / 2;
      cur[1] = Math.max(cur[0], mid);
      next[0] = Math.min(next[1], mid);
      if (next[0] < cur[1]) next[0] = cur[1];
    }
    let missing = gaps[i] - (next[0] - cur[1]);
    if (missing > 0) {
      const fromCur = Math.min(missing / 2, cur[1] - cur[0]);
      const fromNext = Math.min(missing / 2, next[1] - next[0]);
      cur[1] -= fromCur;
      next[0] += fromNext;
      missing -= fromCur + fromNext;
      const more = Math.min(missing, next[1] - next[0]);
      next[0] += more;
      missing -= more;
      if (missing > 0) cur[1] -= Math.min(missing, cur[1] - cur[0]);
    }
  }
  for (const h of holds) if (h[1] < h[0]) h[1] = h[0];
  return holds;
}

/** Bezier from one stop to the next, swinging wide when they are close. */
function walkPath(from: Point, to: Point, safe: Rect) {
  const dx = to.x - from.x;
  const reach = Math.max(Math.abs(dx) * 0.45, 0);
  const dir = dx >= 0 ? 1 : -1;
  let c1 = { x: from.x + dir * reach, y: from.y };
  let c2 = { x: to.x - dir * reach, y: to.y };
  const minSwing = 0.14 * (safe.right - safe.left);
  if (Math.abs(dx) < minSwing) {
    const side = ((from.x + to.x) / 2 < (safe.left + safe.right) / 2 ? 1 : -1) * (minSwing - Math.abs(dx)) * 0.9;
    c1 = { x: c1.x + side, y: lerp(from.y, to.y, 0.2) };
    c2 = { x: c2.x + side, y: lerp(from.y, to.y, 0.8) };
  }
  const inside = (p: Point) => ({ x: Math.min(safe.right, Math.max(safe.left, p.x)), y: Math.min(safe.bottom, Math.max(safe.top, p.y)) });
  return { p0: from, c1: inside(c1), c2: inside(c2), p1: to };
}

function arcLength(path: ReturnType<typeof walkPath>, t: number) {
  let length = 0;
  let prev = path.p0;
  const steps = Math.max(1, Math.ceil(32 * clamp01(t)));
  for (let i = 1; i <= steps; i++) {
    const p = bezier(path.p0, path.c1, path.c2, path.p1, (i / steps) * clamp01(t));
    length += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  return length;
}

function safeArea(layout: Layout): Rect {
  const width = document.documentElement.clientWidth;
  const top = (document.getElementById("site-header")?.offsetHeight ?? 76) + 10;
  if (layout.lane) return { left: 10, top, right: width - 10, bottom: barTop() + 40 };
  const bar = whatsappBar();
  return { left: 10, top, right: width - 10, bottom: Math.min(innerHeight, bar ? bar.top : innerHeight) - 10 };
}

/** Where Teddy should be for a given scroll offset. */
function place(layout: Layout, scroll: number): Placement {
  const { stops, holds } = layout;
  if (layout.lane) for (const stop of stops) if (stop.track.kind === "screen") stop.track.top = barTop() - 159 * stop.s;
  const safe = safeArea(layout);
  const { k, t } = segment(holds, scroll);

  if (t <= 0 || k >= stops.length - 1) {
    const stop = stops[k];
    const p = stopPoint(stop, scroll);
    const pos = keepOnScreen(p.x, p.y, stop.s, stop.box, safe);
    return { ...pos, s: stop.s, front: !stop.behind, airborne: false, k, t: 0, walked: 0 };
  }

  const a = stops[k];
  const b = stops[k + 1];
  const leave = holds[k][1];
  const arrive = holds[k + 1][0];
  const span = Math.max(1, arrive - leave);
  const v = clamp01((scroll - leave) / span);
  const start = stopPoint(a, leave);
  const end = stopPoint(b, arrive);
  const path = walkPath({ x: start.x, y: start.y - a.sink * a.s }, { x: end.x, y: end.y - b.sink * b.s }, safe);
  const eased = v * v * v * (v * (6 * v - 15) + 10);
  const p = bezier(path.p0, path.c1, path.c2, path.p1, eased);
  const s = lerp(a.s, b.s, smoothstep(clamp01(v / 0.65)));
  // Near either end, follow the stop if it is itself moving (pinned sections).
  const blend = Math.min(0.3, Math.max(0.06, layout.blend / span));
  const fromA = 1 - ramp(0, blend, v);
  const toB = ramp(1 - blend, 1, v);
  let y = p.y + fromA * (stopPoint(a, scroll).y - start.y) + toB * (stopPoint(b, scroll).y - end.y);
  y += a.sink * a.s * (1 - ramp(0, 0.22, v)) + b.sink * b.s * ramp(0.78, 1, v);
  let airborne = false;
  // Hop out from behind scenery, and hop back behind it on arrival.
  if (a.behind && v < 0.36) {
    y -= Math.sin((v / 0.36) * Math.PI) * Math.min(64 * a.s, 72);
    airborne = v < 0.32;
  }
  if (b.behind && v > 0.68) {
    y -= Math.sin(((v - 0.68) / 0.32) * Math.PI) * Math.min(56 * b.s, 60);
    airborne = true;
  }
  if (a.sink && v < 0.2) airborne = true;
  const front = !((a.behind && v < 0.12) || (b.behind && v > 0.92));
  const box =
    v < 0.5
      ? lerpBox(a.box, DEFAULT_BOX, ramp(0, a.sink ? 0.22 : a.behind ? 0.36 : 0.06, v))
      : lerpBox(DEFAULT_BOX, b.box, ramp(b.sink ? 0.78 : b.behind ? 0.68 : 0.94, 1, v));
  const pos = keepOnScreen(p.x, y, s, box, safe);
  return { ...pos, s, front, airborne, k, t: v, walked: arcLength(path, eased) };
}

/** When scrolling stops mid-hop, finish the hop rather than freezing half hidden. */
function settledScroll(layout: Layout, scroll: number) {
  const { k, t } = segment(layout.holds, scroll);
  if (t <= 0 || k >= layout.stops.length - 1) return scroll;
  const a = layout.stops[k];
  const b = layout.stops[k + 1];
  const outEnd = a.sink ? 0.22 : a.behind ? 0.36 : 0;
  const inStart = b.sink ? 0.78 : b.behind ? 0.68 : 1;
  let target = t;
  if (t < outEnd) target = t < outEnd / 2 ? 0 : outEnd;
  else if (t > inStart) target = t > (1 + inStart) / 2 ? 1 : inStart;
  return target === t ? scroll : layout.holds[k][1] + target * (layout.holds[k + 1][0] - layout.holds[k][1]);
}

const setData = (el: HTMLElement, key: string, value: string) => {
  if (el.dataset[key] !== value) el.dataset[key] = value;
};

const pick = <T,>(items: T[], not: T | null) => {
  const pool = items.filter((i) => i !== not);
  return pool[Math.floor(Math.random() * pool.length)];
};

// Only one walker may run at a time (e.g. during fast refresh).
let stopActive: (() => void) | null = null;

export function PupJourney() {
  const layerRef = useRef<HTMLDivElement>(null);
  const actorRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const bubbleAtRef = useRef<HTMLSpanElement>(null);
  const printsRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    stopActive?.();
    const layer = layerRef.current!;
    const actor = actorRef.current!;
    const body = bodyRef.current!;
    const bubble = bubbleRef.current!;
    const bubbleAt = bubbleAtRef.current!;
    const prints = [...printsRef.current!.children] as HTMLElement[];
    const probe = probeRef.current!;
    const svg = body.querySelector("svg")!;
    const root = document.documentElement;

    let layout: Layout | null = null;
    let driver: PupDriver | null = null;
    let running = false;
    let frameId = 0;
    let relayoutTimer: ReturnType<typeof setTimeout>;
    let printIndex = 0;
    let bubbleUntil = 0;
    const now = () => performance.now() / 1000;

    const say = (text: string, at: number, seconds = 1.4) => {
      bubble.textContent = text;
      bubble.dataset.show = "true";
      bubbleUntil = at + seconds;
    };

    // Gaze targets: the pointer, a cue from a scene, or a focused control.
    let pointer: (Point & { t: number }) | null = null;
    let lookTarget: { el: Element; until: number } | null = null;
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") pointer = { x: e.clientX, y: e.clientY, t: now() };
    };
    const onFocus = (e: FocusEvent) => {
      const el = e.target;
      if (el instanceof HTMLElement && el.matches("a, button, input, textarea, select, summary")) lookTarget = { el, until: now() + 1.4 };
    };

    let lastTime = now();
    let lastScroll = scrollY;
    let last: Point | null = null;
    let current: Placement | null = null;
    const offset = { x: 0, y: 0, s: 0 };
    let stillFor = 0;
    let atStop = -1;
    let arrivedAt = 0;
    let activeAt = 0;
    let timeline: Timeline = [];
    let lastLook = 0;
    let lookIndex = -1;
    let trackLeft: number | null = null;
    let treadmillIdle = 0;
    let printSegment = -1;
    let printStep = 0;
    let nextFidget = 0;
    let scrolledAt = now();
    let scrollDir = 1;
    let snapping = false;
    let laneFollow: Point | null = null;
    let laneAnchor = 0;
    let laneWalked = 0;
    let layerShift = 0;

    const removeCue = onPupCue((cue) => {
      const scene = atStop >= 0 ? layout?.meta[atStop]?.scene : null;
      if (!scene || (cue.look && !scene.contains(cue.look))) return;
      const t = now();
      if (cue.look) lookTarget = { el: cue.look, until: t + (cue.secs ?? 1.6) };
      if (cue.say) say(cue.say, t);
    });

    const contextFor = (m: StopMeta): TrickContext => ({
      d: driver!,
      rest: poses[m.pose],
      facing: m.facing,
      say: (text, seconds) => say(text, now(), seconds),
      hearts: () =>
        current &&
        burstHearts(
          layer,
          current.x - FEET.x * current.s + (driver!.facingDir > 0 ? 212 : WIDTH - 212) * current.s,
          current.y - (FEET.y - 40) * current.s - layerShift,
        ),
    });

    const frame = () => {
      frameId = requestAnimationFrame(frame);
      if (!layout || !driver) return;
      const d = driver;
      const t = now();
      const dt = Math.min(0.05, t - lastTime);
      lastTime = t;
      const scroll = scrollY;
      const scrolled = scroll - lastScroll;
      lastScroll = scroll;
      if (Math.abs(scrolled) > 0.5) {
        scrolledAt = t;
        scrollDir = scrolled > 0 ? 1 : -1;
      }
      while (timeline.length && timeline[0][0] <= t) timeline.shift()![1](t);

      const effectiveScroll = t - scrolledAt > 0.25 ? settledScroll(layout, scroll) : scroll;
      const target = place(layout, effectiveScroll);
      const walkingLane =
        layout.lane &&
        layout.stops[target.k].track.kind === "screen" &&
        (target.t > 0 ? layout.stops[target.k + 1] : layout.stops[target.k])?.track.kind === "screen";

      // Ease out any jump left over from a relayout or a snap.
      const decay = Math.exp(-dt / 0.28);
      offset.x *= decay;
      offset.y *= decay;
      offset.s *= decay;
      if (Math.abs(offset.x) < 0.05 && Math.abs(offset.y) < 0.05) offset.x = offset.y = 0;
      const isSnapping = effectiveScroll !== scroll;
      if (isSnapping !== snapping && last && !walkingLane) {
        offset.x = last.x - target.x;
        offset.y = last.y - target.y;
      }
      snapping = isSnapping;

      const s = target.s + offset.s;
      let x = target.x + offset.x;
      let y = target.y + offset.y;
      const anchor = layout.lane ? barTop() : 0;
      let settled = true;
      if (walkingLane) {
        // Along the bottom bar Teddy trots after his target instead of sliding.
        laneFollow ??= last ? { x: last.x, y: last.y - laneAnchor } : { x, y: y - anchor };
        const k = 1 - Math.exp(-dt / 0.14);
        laneFollow.x += (x - laneFollow.x) * k;
        laneFollow.y += (y - anchor - laneFollow.y) * k;
        settled = Math.hypot(x - laneFollow.x, y - anchor - laneFollow.y) < 1.5;
        x = laneFollow.x;
        y = anchor + laneFollow.y;
      } else if (laneFollow) {
        offset.x = (last?.x ?? x) - target.x;
        offset.y = (last?.y ?? y) - target.y;
        x = target.x + offset.x;
        y = target.y + offset.y;
        laneFollow = null;
      }
      laneAnchor = anchor;
      current = { ...target, x, y, s };
      setData(layer, "anchor", walkingLane ? "bottom" : "top");
      layerShift = walkingLane ? layer.getBoundingClientRect().top : 0;

      const holding = target.t === 0 && settled;
      const k = target.k;
      if (holding) {
        if (atStop !== k) {
          // Arrived: settle into this stop's pose.
          const m = layout.meta[k];
          timeline = [];
          lookTarget = null;
          atStop = k;
          arrivedAt = activeAt = t;
          trackLeft = null;
          d.reset();
          d.setPose(m.pose);
          d.face(m.facing, 0.14);
          d.stride(0);
          d.wag(m.act === "basket" ? 0.3 : 0.7);
          d.jolt(0.4);
          nextFidget = t + 2.4;
        }
        const m = layout.meta[k];
        if (m.track && !timeline.length) {
          // Treadmill: walk in place while the hallway of doors slides by.
          const left = m.track.getBoundingClientRect().left;
          const moved = trackLeft === null ? 0 : left - trackLeft;
          trackLeft = left;
          d.walkedTo(-left / s);
          if (Math.abs(moved) > 0.15) {
            treadmillIdle = 0;
            d.setPose("walk");
            d.stride(1);
            d.face(moved < 0 ? 1 : -1, 0.16);
          } else if ((treadmillIdle += dt) > 0.25) {
            d.setPose("stand");
            d.stride(0);
          }
        }
        if (m.act === "tilt" && !timeline.length && t - arrivedAt > 1.2) {
          const w = Math.sin(t * 0.9);
          d.cock(w > 0.35 ? 13 : w < -0.35 ? -10 : 0);
        }
        if (m.act === "basket" && !timeline.length && t > nextFidget) {
          nextFidget = t + 4.5 + Math.random() * 3;
          if (Math.random() < 0.7) d.jolt(0.55);
          else d.yawn(t, 0.7);
        }
        // Glance around the scene's points of interest.
        const busy = (lookTarget && lookTarget.until > t) || (pointer && t - pointer.t < 2.5);
        if (m.looks.length && !busy && t - arrivedAt > 0.8 && t - lastLook > 1.7) {
          lastLook = t;
          lookIndex = (lookIndex + 1) % (m.looks.length + 1);
          if (lookIndex < m.looks.length) lookTarget = { el: m.looks[lookIndex], until: t + 1.4 };
        }
        if (Math.abs(scrolled) > 0.5) activeAt = t;
        if (!timeline.length && !m.track && m.act !== "basket" && t - activeAt > 9) {
          activeAt = t;
          timeline =
            Math.random() < 0.55
              ? tricks.tilt(contextFor(m), t)
              : [
                  [t, () => d.wag(1)],
                  [t + 2.4, () => d.wag(0.7)],
                ];
        }
      } else {
        if (atStop !== -1) {
          atStop = -1;
          timeline = [];
          d.reset();
        }
        const moved = last ? Math.hypot(x - last.x, y - last.y) : 0;
        stillFor = moved > 0.25 ? 0 : stillFor + dt;
        let airborne = target.airborne;
        if (layout.lane && target.t > 0) {
          const a = layout.stops[k];
          const b = layout.stops[k + 1];
          if (a.sink && target.t < 0.22) airborne = scrollDir > 0;
          else if (b?.sink && target.t > 0.78) airborne = scrollDir < 0;
        }
        if (airborne) {
          d.setPose("hop");
          d.stride(0);
        } else if (stillFor > 0.3) {
          d.setPose("stand");
          d.stride(0);
          if (stillFor > 2.6 && stillFor - dt <= 2.6) say("coming?", t);
        } else {
          d.setPose("walk");
          d.stride(1);
        }
        d.walkedTo((walkingLane ? (laneWalked += moved) : target.walked) / Math.max(0.05, s));
        if (last) {
          const dx = x - last.x;
          if (Math.abs(dx) > 0.6 && Math.abs(dx) > 0.35 * Math.abs(y - last.y)) d.face(dx > 0 ? 1 : -1, 0.16);
        }
        // Leave fading paw prints on the page behind him.
        if (!layout.lane) {
          const step = Math.floor(target.walked / (34 * s));
          if (printSegment === k && step !== printStep && !target.airborne && last) {
            const front = step & 1;
            const footX = front ? 186 : 110;
            const left = x - FEET.x * s;
            const top = y - FEET.y * s;
            const px = left + (d.facingDir > 0 ? footX : WIDTH - footX) * s;
            const py = top + 226 * s + scroll - layout.mainTop + (front ? -4 : 4) * s;
            const angle = Math.atan2(y - last.y + scrolled, x - last.x) + Math.PI / 2;
            const size = 14 * Math.max(0.75, 1.5 * s);
            const print = prints[printIndex++ % prints.length];
            print.style.transform = `translate(${(px - size / 2).toFixed(1)}px, ${(py - size / 2).toFixed(1)}px) rotate(${angle.toFixed(3)}rad)`;
            print.style.width = print.style.height = `${size.toFixed(1)}px`;
            print.animate([{ opacity: 0 }, { opacity: 0.45, offset: 0.08 }, { opacity: 0.45, offset: 0.5 }, { opacity: 0 }], {
              duration: 2600,
              easing: "ease-out",
            });
          }
          printSegment = k;
          printStep = step;
        }
      }

      last = { x, y };
      // Scenes know whether Teddy is here (and doors open once visited).
      layout.meta.forEach((m, i) => {
        if (!m.scene) return;
        setData(m.scene, "here", String(holding && i === k));
        setData(m.scene, "visited", String(i <= k || (i === k + 1 && target.t > 0.92)));
      });

      if (lookTarget && lookTarget.until > t) {
        const r = lookTarget.el.getBoundingClientRect();
        d.lookAt({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      } else if (pointer && t - pointer.t < 2.5) d.lookAt(pointer);
      else d.lookAt(null);

      actor.style.transform = `translate3d(${(x - FEET.x * s).toFixed(2)}px, ${(y - FEET.y * s - layerShift).toFixed(2)}px, 0)`;
      body.style.transform = `scale(${s.toFixed(4)})`;
      setData(layer, "front", String(target.front));
      setData(actor, "holding", String(holding));
      if (bubble.dataset.show === "true") {
        if (t > bubbleUntil) bubble.dataset.show = "false";
        const bx = (d.facingDir > 0 ? 214 : WIDTH - 214) * s;
        bubbleAt.style.transform = `translate(${bx.toFixed(1)}px, ${(30 * s).toFixed(1)}px)`;
      }
      d.tick(dt, t);
    };

    // Clicking Teddy: a quick trick while walking, the stop's repertoire when resting.
    let streak = 0;
    let lastClick = 0;
    let lastTrick: string | null = null;
    const onClick = () => {
      if (!driver || !layout) return;
      const d = driver;
      const t = now();
      streak = t - lastClick < 0.7 ? streak + 1 : 1;
      lastClick = t;
      activeAt = t;
      if (atStop < 0) {
        const m = layout.meta[Math.max(0, current?.k ?? 0)];
        const trick = pick(WALK_TRICKS, lastTrick);
        lastTrick = trick;
        const ctx = contextFor(m);
        timeline =
          trick === "jump"
            ? [
                [t, () => (d.hop(1.35), ctx.say(pick(["wheee!", "boing!", "yip!"], null)))],
                [t + 0.5, () => d.hop(0.7)],
              ]
            : trick === "woof"
              ? [
                  [t, (at) => (d.woof(at), ctx.say("woof!"))],
                  [t + 0.4, (at) => d.woof(at)],
                ]
              : trick === "love"
                ? [[t, () => (d.wag(1), d.hop(0.5), ctx.hearts(), ctx.say("I like you!"))]]
                : [[t, (at) => (d.jolt(1.4), d.hop(0.4), d.yawn(at, 0.22), ctx.say("achoo!"))]];
        return;
      }
      const m = layout.meta[atStop];
      let trick: TrickName;
      if (m.track) trick = pick<TrickName>(["woof", "hop", "love"], lastTrick as TrickName);
      else if (m.act === "basket") trick = pick<TrickName>(["tilt", "love", "sneeze", "woof"], lastTrick as TrickName);
      else if (m.pose === "peek") trick = pick<TrickName>(["peekaboo", "woof", "tilt", "sneeze"], lastTrick as TrickName);
      else {
        trick = nextTrick(lastTrick as TrickName | null, streak);
        if (trick === "zoomies") trick = "spin";
      }
      if (trick === "peekaboo" && timeline.length) return;
      lastTrick = trick;
      d.reset();
      timeline = tricks[trick](contextFor(m), t);
    };
    const onPointerEnter = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && driver && atStop >= 0) {
        driver.petting(true);
        driver.wag(1);
      }
    };
    const onPointerLeave = () => {
      if (!driver) return;
      driver.petting(false);
      if (atStop >= 0) driver.wag(layout?.meta[atStop]?.act === "basket" ? 0.3 : 0.7);
    };

    const start = () => {
      if (running || prefersReducedMotion()) return;
      const next = measure(probe);
      if (next.stops.length < 2) return;
      layout = next;
      running = true;
      root.dataset.pup = next.lane ? "lane" : "live";
      layer.hidden = false;
      const first = next.meta[0];
      driver = new PupDriver(svg, first.pose, first.facing);
      lastScroll = scrollY;
      last = null;
      scrolledAt = lastTime = now();
      snapping = false;
      laneFollow = null;
      const t = lastTime;
      const initial = place(next, scrollY);
      if (initial.k === 0 && initial.t === 0 && first.act === "peekaboo") {
        // Hello! Pop up from behind the quilt and look along the lineup.
        atStop = 0;
        arrivedAt = t;
        const friends = first.scene?.querySelectorAll("[data-pup-friend]") ?? [];
        const firstFriend = friends[0];
        const lastFriend = friends[friends.length - 1];
        const d = driver;
        timeline = [
          [t + 0.1, () => d.setPose({ ...poses.peek, headY: 120 })],
          [t + 0.7, (at) => (d.setPose("peek"), d.jolt(1.2), say("peekaboo!", at, 1.6))],
          [t + 1.5, (at) => firstFriend && (lookTarget = { el: firstFriend, until: at + 0.8 })],
          [t + 2.3, (at) => lastFriend && (lookTarget = { el: lastFriend, until: at + 0.8 })],
          [t + 3.1, () => ((lookTarget = null), d.wag(1))],
        ];
      } else atStop = -1;
      addEventListener("pointermove", onPointerMove, { passive: true });
      addEventListener("focusin", onFocus);
      actor.addEventListener("click", onClick);
      actor.addEventListener("pointerenter", onPointerEnter);
      actor.addEventListener("pointerleave", onPointerLeave);
      frameId = requestAnimationFrame(frame);
    };

    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(frameId);
      delete root.dataset.pup;
      layer.hidden = true;
      delete layer.dataset.anchor;
      layerShift = 0;
      layout?.meta.forEach((m) => {
        if (m.scene) {
          delete m.scene.dataset.here;
          delete m.scene.dataset.visited;
        }
      });
      layout = null;
      driver = null;
      atStop = -1;
      removeEventListener("pointermove", onPointerMove);
      removeEventListener("focusin", onFocus);
      actor.removeEventListener("click", onClick);
      actor.removeEventListener("pointerenter", onPointerEnter);
      actor.removeEventListener("pointerleave", onPointerLeave);
    };

    // Page size changed (images loaded, resize, rotation): measure again and
    // glide from where Teddy is now to his new spot.
    const relayout = () => {
      clearTimeout(relayoutTimer);
      relayoutTimer = setTimeout(() => {
        if (!running || !layout) return;
        const next = measure(probe);
        if (next.stops.length < 2) return stop();
        const was = current;
        const laneChanged = next.lane !== layout.lane;
        layout = next;
        root.dataset.pup = next.lane ? "lane" : "live";
        if (laneChanged) atStop = -1;
        if (was) {
          const now = place(next, scrollY);
          offset.x = was.x - now.x;
          offset.y = was.y - now.y;
          offset.s = was.s - now.s;
        }
      }, 120);
    };
    const ro = new ResizeObserver(relayout);
    ro.observe(document.body);
    addEventListener("resize", relayout);
    addEventListener("load", relayout);
    const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => (prefersReducedMotion() ? stop() : start());
    motionQuery.addEventListener("change", onMotionChange);
    start();
    document.fonts?.ready.then(relayout);

    const cleanup = () => {
      stop();
      clearTimeout(relayoutTimer);
      ro.disconnect();
      removeCue();
      removeEventListener("resize", relayout);
      removeEventListener("load", relayout);
      motionQuery.removeEventListener("change", onMotionChange);
      if (stopActive === cleanup) stopActive = null;
    };
    stopActive = cleanup;
    return cleanup;
  }, []);

  return (
    <>
      {/* Measures the small-viewport height (100svh) on mobile browsers. */}
      <div ref={probeRef} aria-hidden="true" className="pup-probe" />
      <div ref={printsRef} aria-hidden="true" className="pup-prints">
        {Array.from({ length: 24 }, (_, i) => (
          <svg key={i} viewBox="0 0 64 64">
            <path d={PAW_PATH} />
          </svg>
        ))}
      </div>
      <div ref={layerRef} aria-hidden="true" className="pup-layer" hidden data-front="true">
        <div ref={actorRef} className="pup-actor">
          <div ref={bodyRef} className="pup-actor__body">
            <PupSvg pose="peek" />
          </div>
          <span ref={bubbleAtRef} className="pup-bubble-at">
            <span ref={bubbleRef} className="pup-bubble" data-show="false" />
          </span>
        </div>
      </div>
    </>
  );
}
