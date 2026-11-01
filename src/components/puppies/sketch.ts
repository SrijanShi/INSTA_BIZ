/**
 * Generates the hand-drawn look of a puppy card: a wobbly photo mask, an ink
 * outline that is "retraced" partway round, a watercolour wash behind it and
 * a few doodles in the margin. Everything is derived from a seeded random
 * generator keyed on the puppy's slug, so each card is unique but identical
 * on the server and the client.
 */

const fmt = (n: number) => n.toFixed(2);

/** FNV-1a hash of the seed feeding a mulberry32 generator. */
function seededRandom(seed: string) {
  let h = 0x811c9dc5;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 0x1000193);
  let state = h >>> 0;
  return () => {
    let t = (state = (state + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

type Point = [number, number];

/** Points on a wobbly circle around (50, 50) in a 100×100 box. */
function wobble(rand: () => number, radius: number, amount: number, count = 40, start = 0, sweep = Math.PI * 2) {
  const phase = [rand() * 6.28, rand() * 6.28, rand() * 6.28];
  const squash = 1 + (rand() - 0.5) * 0.05;
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    const a = start + (i / (sweep >= Math.PI * 2 ? count : count - 1)) * sweep;
    const r =
      radius +
      amount * (0.55 * Math.sin(2 * a + phase[0]) + 0.3 * Math.sin(3 * a + phase[1]) + 0.15 * Math.sin(5 * a + phase[2]));
    points.push([50 + Math.cos(a) * r * squash, 50 + (Math.sin(a) * r) / squash]);
  }
  return points;
}

/** Smooth Catmull-Rom curve through the points, as an SVG path. */
function smoothPath(points: Point[], closed: boolean) {
  const n = points.length;
  const at = (i: number) => points[closed ? (i + n) % n : Math.min(n - 1, Math.max(0, i))];
  let d = `M${fmt(points[0][0])} ${fmt(points[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${fmt(c1[0])} ${fmt(c1[1])} ${fmt(c2[0])} ${fmt(c2[1])} ${fmt(p2[0])} ${fmt(p2[1])}`;
  }
  return closed ? `${d}Z` : d;
}

const WASHES = ["#f2be6b", "#f9cdbf", "#bfddf5", "#fbe3b4", "#e8c39a"];
const INKS = ["#c2622b", "#a24a1a", "#2a170e", "#d4893f"];
const DOODLES = ["sparkle", "heart", "dashes", "swirl", "dots", "paw"] as const;

export type DoodleKind = (typeof DOODLES)[number];
export type Doodle = { kind: DoodleKind; x: number; y: number; rot: number; size: number; ink: string };

export function sketchFor(seed: string) {
  const rand = seededRandom(seed);
  const mask = smoothPath(wobble(rand, 45.5, 2.6), true);
  const outline = smoothPath(wobble(rand, 47.8, 3.1), true);
  const start = rand() * Math.PI * 2;
  const retrace = smoothPath(wobble(rand, 49, 3.4, 30, start, Math.PI * (1.15 + 0.5 * rand())), false);
  const wash = {
    d: smoothPath(wobble(rand, 46.5, 3.6), true),
    dx: (rand() - 0.5) * 9,
    dy: 3 + rand() * 4,
    color: WASHES[Math.floor(rand() * WASHES.length)],
  };
  const tilt = (rand() - 0.5) * 5;

  // Doodles sit in different margins (lower right, lower left, top).
  const zones = [
    [0.86, 1.08],
    [1.16, 1.42],
    [-0.08, 0.16],
  ]
    .map((z) => ({ z, k: rand() }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.z);
  const count = 2 + Math.floor(rand() * 2);
  const used = new Set<DoodleKind>();
  const doodles: Doodle[] = [];
  for (let i = 0; i < count; i++) {
    let kind = DOODLES[Math.floor(rand() * DOODLES.length)];
    if (used.has(kind)) kind = DOODLES.find((k) => !used.has(k))!;
    used.add(kind);
    const [from, to] = zones[i];
    const angle = Math.PI * (from + rand() * (to - from));
    const dist = 55 + rand() * 4;
    doodles.push({
      kind,
      x: 50 + Math.cos(angle) * dist,
      y: 50 + Math.sin(angle) * dist,
      rot: (rand() - 0.5) * 50,
      size: 0.85 + rand() * 0.35,
      ink: INKS[Math.floor(rand() * INKS.length)],
    });
  }
  return { mask, outline, retrace, wash, tilt, doodles };
}

/** An SVG path as a CSS mask-image. */
export function maskUrl(d: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${d}" fill="#000"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
