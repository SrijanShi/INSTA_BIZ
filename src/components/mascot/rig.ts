/**
 * Teddy's skeleton: geometry, poses and the function that turns a pose plus
 * the current motion state into SVG transforms for every body part.
 *
 * Everything is drawn in a 300×240 viewBox, facing right.
 */

export const WIDTH = 300;
export const HEIGHT = 240;

export const INK = "#2a170e";
export const FUR = "#f2be6b";
export const FUR_SHADE = "#e4a352";
export const CREAM = "#fbe3b4";
export const COLLAR = "#a24a1a";
export const BLUSH = "#f9b9a6";
/** Vertical position of the eyes. */
export const EYE_Y = 98;
/** Ground line the paws stand on. */
export const GROUND_Y = 228;

type Point = [number, number];

const BODY_PIVOT: Point = [196, 206];
export const HEAD_PIVOT: Point = [212, 100];
const SHOULDER_NEAR: Point = [186, 194];
const SHOULDER_FAR: Point = [168, 192];
const HIP_NEAR: Point = [110, 194];
const HIP_FAR: Point = [94, 192];
const TAIL_BASE: Point = [84, 150];
const EAR_LEFT: Point = [174, 82];
const EAR_RIGHT: Point = [250, 82];

export const joints = {
  shoulderNear: SHOULDER_NEAR,
  shoulderFar: SHOULDER_FAR,
  hipNear: HIP_NEAR,
  hipFar: HIP_FAR,
  tailBase: TAIL_BASE,
};

/**
 * A fluffy, scalloped ellipse: `bumps` quadratic curls around an ellipse
 * centred at (cx, cy), optionally rotated by `tilt` degrees.
 */
function fluff(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  bumps: number,
  depth: number,
  start = -Math.PI / 2,
  tilt = 0,
) {
  const t = (tilt * Math.PI) / 180;
  const at = (angle: number, out: number) => {
    const x = Math.cos(angle) * (rx + out);
    const y = Math.sin(angle) * (ry + (ry / rx) * out);
    return `${(cx + x * Math.cos(t) - y * Math.sin(t)).toFixed(1)} ${(cy + x * Math.sin(t) + y * Math.cos(t)).toFixed(1)}`;
  };
  let d = "";
  for (let i = 0; i < bumps; i++) {
    const a0 = start + (i / bumps) * Math.PI * 2;
    const a1 = start + ((i + 1) / bumps) * Math.PI * 2;
    d += `${i === 0 ? `M${at(a0, 0)}` : ""}Q${at((a0 + a1) / 2, depth * 2.1)} ${at(a1, 0)}`;
  }
  return `${d}Z`;
}

export const shapes = {
  body: fluff(140, 170, 64, 36, 15, 3.4, Math.PI * 0.95),
  chest: fluff(192, 166, 30, 32, 9, 3.2, Math.PI * 0.6),
  tail: fluff(70, 126, 17, 16, 9, 3.2),
  tailStem: "M86 152 C80 146 76 140 74 136",
  haunch: fluff(110, 204, 30, 24, 10, 3.2, Math.PI),
  haunchPaw:
    "M112 214 C126 212 142 214 146 221 C148 226 144 229 136 229 L116 229 C108 229 104 224 106 219 Z",
  head: fluff(212, 100, 51, 46, 16, 3.6),
  topknot: fluff(212, 52, 17, 12, 8, 2.9, Math.PI),
  earL: fluff(170, 112, 19, 34, 10, 3.2, -Math.PI / 2, 12),
  earR: fluff(254, 112, 19, 34, 10, 3.2, -Math.PI / 2, -12),
  muzzle:
    "M188 120 C188 106 200 100 212 100 C224 100 236 106 236 120 C236 133 225 140 212 140 C199 140 188 133 188 120 Z",
  nose: "M204.5 111.5 Q212 107.2 219.5 111.5 Q218.2 118.4 212 120 Q205.8 118.4 204.5 111.5 Z",
  mouth: "M212 120 V124.5 M212 124.5 Q207.2 129.6 202.8 125.2 M212 124.5 Q216.8 129.6 221.2 125.2",
  mouthOpen: "M203 126 Q212 122 221 126 Q219 138 212 139 Q205 138 203 126 Z",
  tongue: "M207.6 127.4 Q212 136.6 216.4 127.4 Z",
  collar: "M178 146 Q212 162 246 146 L246 154 Q212 170 178 154 Z",
  tag: "M212 160 C212 156 206 155 206 159.4 C206 163 212 166.6 212 168.4 C212 166.6 218 163 218 159.4 C218 155 212 156 212 160 Z",
  ledgePaws:
    "M175 159 C175 148 181 142 190 142 C199 142 205 148 205 159 Z M219 159 C219 148 225 142 234 142 C243 142 249 148 249 159 Z",
  ledgeToes: "M186 153 v-4.5 M194 153 v-4.5 M230 153 v-4.5 M238 153 v-4.5",
  shadow: { cx: 150, cy: 230, rx: 92, ry: 7 },
};

/** A leg drawn from its joint (0,0) down to the ground, `width` wide at the top. */
function leg(width: number, length: number) {
  const h = width / 2;
  return `M${-h} -14 C${-h} 4 -12 ${length - 18} -12 ${length - 9} C-12 ${length - 2} -7 ${length} 0 ${length} C9 ${length} 13 ${length - 3} 13 ${length - 9} C13 ${length - 18} ${h} 4 ${h} -14`;
}

export const legs = {
  front: leg(24, GROUND_Y - SHOULDER_NEAR[1]),
  frontFar: leg(22, GROUND_Y - SHOULDER_FAR[1]),
  back: leg(30, GROUND_Y - HIP_NEAR[1]),
  backFar: leg(28, GROUND_Y - HIP_FAR[1]),
};

/** Two little toe lines at the bottom of a paw. */
export const toes = (length: number) => `M-3.5 ${length - 7} v5 M4.5 ${length - 7} v5`;

export type Pose = {
  bodyRot: number;
  bodyX: number;
  bodyY: number;
  stretch: number;
  headX: number;
  headY: number;
  headRot: number;
  earL: number;
  earR: number;
  tail: number;
  /** Leg rotations: front near/far, back near/far. */
  fn: number;
  ff: number;
  bn: number;
  bf: number;
  /** 1 = sitting (haunch visible, back legs hidden). */
  sit: number;
  /** 1 = eyes open, 0 = asleep. */
  eyes: number;
  happy: number;
  tongue: number;
  mouth: number;
  /** 1 = seen from the front, paws on a ledge (peeking over something). */
  front: number;
};

const STAND: Pose = {
  bodyRot: 0,
  bodyX: 0,
  bodyY: 0,
  stretch: 1,
  headX: 0,
  headY: 0,
  headRot: 0,
  earL: 0,
  earR: 0,
  tail: 0,
  fn: 0,
  ff: 0,
  bn: 0,
  bf: 0,
  sit: 0,
  eyes: 1,
  happy: 0,
  tongue: 0,
  mouth: 0,
  front: 0,
};

export const poses = {
  stand: STAND,
  walk: { ...STAND, tail: -6, tongue: 1 },
  sit: { ...STAND, bodyRot: -24, bodyY: -2, headX: -10, headY: -6, tail: 34, sit: 1, tongue: 1 },
  peek: { ...STAND, headY: 4, earL: -6, earR: 6, tail: -20, front: 1, tongue: 1 },
  snug: { ...STAND, headY: 9, headRot: 4, earL: 3, earR: -3, tail: -20, front: 1, tongue: 0 },
  lie: { ...STAND, bodyRot: -5, bodyY: 22, headX: 12, headY: 40, headRot: 3, fn: -84, ff: -80, sit: 1, tail: 58, tongue: 0 },
  sleep: {
    ...STAND,
    bodyRot: -5,
    bodyY: 22,
    headX: 14,
    headY: 44,
    headRot: -8,
    fn: -84,
    ff: -80,
    sit: 1,
    tail: 64,
    eyes: 0,
    earL: 4,
    earR: -4,
  },
  settle: { ...STAND, bodyRot: -5, bodyY: 22, headX: 10, headY: 16, fn: -84, ff: -80, sit: 1, tail: 40, tongue: 1 },
  hop: {
    ...STAND,
    bodyRot: -9,
    stretch: 1.06,
    headY: -6,
    fn: -42,
    ff: -32,
    bn: 40,
    bf: 30,
    earL: -26,
    earR: 26,
    tail: -24,
    tongue: 1,
  },
  sniff: { ...STAND, bodyRot: 7, headX: 16, headY: 32, headRot: 9, tail: -14, fn: 6, ff: 4 },
  bow: { ...STAND, bodyRot: 15, bodyY: 2, headX: 14, headY: 30, fn: -58, ff: -52, tail: -32, happy: 1, tongue: 1 },
  beg: {
    ...STAND,
    bodyRot: -36,
    bodyY: -6,
    headX: -18,
    headY: -18,
    sit: 1,
    fn: -70,
    ff: -64,
    tail: 30,
    happy: 1,
    tongue: 1,
  },
} satisfies Record<string, Pose>;

export type PoseName = keyof typeof poses;

const POSE_KEYS = Object.keys(STAND) as (keyof Pose)[];

/** Per-frame motion that sits on top of a pose (walk cycle, wag, gaze…). */
export type Motion = {
  /** Walk-cycle phase in radians. */
  phase: number;
  /** 0 = standing still, 1 = full stride. */
  stride: number;
  time: number;
  wag: number;
  gazeX: number;
  gazeY: number;
  /** 0 = open, 1 = eyelids closed. */
  blink: number;
  /** Ear wobble in degrees. */
  ear: number;
};

export const STILL: Motion = { phase: 0, stride: 0, time: 0, wag: 0, gazeX: 0, gazeY: 0, blink: 0, ear: 0 };

export function lerpPose(from: Pose, to: Pose, t: number): Pose {
  const out = { ...from };
  for (const k of POSE_KEYS) out[k] = from[k] + (to[k] - from[k]) * t;
  return out;
}

const round = (n: number) => Math.round(n * 100) / 100;
const rotate = (deg: number, [x, y]: Point) => `rotate(${round(deg)} ${x} ${y})`;

export type Frame = ReturnType<typeof frame>;

/** Transforms and opacities for every rig part. */
export function frame(pose: Pose, m: Motion = STILL) {
  const near = Math.sin(m.phase);
  const far = Math.sin(m.phase + Math.PI);
  const swing = 20 + 10 * m.stride;
  const bob = (1 - Math.cos(2 * m.phase)) / 2;
  const moving = m.stride > 0.01 ? 1 : 0;
  const breathe = Math.sin(m.time * 2.4) * (1 - moving);
  const bodyY = pose.bodyY - bob * (2.5 + 4 * m.stride) * moving + 0.6 * breathe;
  const bodyRot = pose.bodyRot + 1.6 * Math.sin(m.phase) * moving;
  // Front legs stay vertical while the body tilts.
  const counter = -pose.bodyRot;
  const wagAmp = 5 + 17 * m.wag;
  const wagSpeed = 1.2 + 2.6 * m.wag;
  const tail = pose.tail + Math.sin(m.time * wagSpeed * Math.PI * 2) * wagAmp;
  const headBob = (-(1 - Math.cos(2 * m.phase - 0.7)) / 2) * (2 + 3 * m.stride) * moving + 0.9 * breathe;
  const [px] = BODY_PIVOT;

  return {
    body: `translate(${round(pose.bodyX)} ${round(bodyY)}) ${rotate(bodyRot, BODY_PIVOT)} translate(${px} 0) scale(${round(pose.stretch)} 1) translate(${-px} 0)`,
    fn: `translate(${SHOULDER_NEAR[0]} ${SHOULDER_NEAR[1]}) rotate(${round(pose.fn + counter + near * swing * moving)})`,
    ff: `translate(${SHOULDER_FAR[0]} ${SHOULDER_FAR[1]}) rotate(${round(pose.ff + counter + far * swing * moving)})`,
    bn: `translate(${HIP_NEAR[0]} ${HIP_NEAR[1]}) rotate(${round(pose.bn + far * swing * moving)})`,
    bf: `translate(${HIP_FAR[0]} ${HIP_FAR[1]}) rotate(${round(pose.bf + near * swing * moving)})`,
    tail: rotate(tail, TAIL_BASE),
    haunch: `translate(0 ${round(-(0.06 * pose.bodyRot))})`,
    head: `translate(${round(pose.headX)} ${round(pose.headY + headBob)}) ${rotate(pose.headRot + 1.4 * Math.sin(m.phase) * moving, HEAD_PIVOT)}`,
    earL: rotate(pose.earL + m.ear + 4 * Math.sin(2 * m.phase) * moving, EAR_LEFT),
    earR: rotate(pose.earR - m.ear - 4 * Math.sin(2 * m.phase) * moving, EAR_RIGHT),
    eyes: `translate(${round(3.4 * m.gazeX)} ${round(2.6 * m.gazeY)})`,
    blink: `translate(0 ${round(EYE_Y * m.blink * 0.92)}) scale(1 ${round(1 - 0.92 * m.blink)})`,
    openEyes: round(Math.max(0, pose.eyes - pose.happy)),
    happyEyes: round(Math.min(pose.happy, pose.eyes)),
    shutEyes: round(1 - pose.eyes),
    tongue: round(pose.tongue * (1 - pose.mouth)),
    mouth: round(pose.mouth),
    backLegs: round(1 - pose.sit),
    haunchOpacity: round(pose.sit * (1 - pose.front)),
    side: round(1 - pose.front),
    ledge: round(pose.front),
    shadow: `translate(${round(0.6 * pose.bodyX)} 0) scale(${round(1 - 0.05 * bob * moving)} 1)`,
    shadowOpacity: round(0.12 * (1 - pose.front)),
  };
}
