import { EYE_Y, HEAD_PIVOT, HEIGHT, STILL, WIDTH, frame, lerpPose, poses, type Frame, type Motion, type Pose, type PoseName } from "./rig";

/** Which attribute of which part is driven by which frame value. */
const BINDINGS: [part: string, attr: string, value: keyof Frame | "root"][] = [
  ["root", "transform", "root"],
  ["shadow", "transform", "shadow"],
  ["shadow", "opacity", "shadowOpacity"],
  ["body", "transform", "body"],
  ["body", "opacity", "side"],
  ["bf", "transform", "bf"],
  ["bf", "opacity", "backLegs"],
  ["bn", "transform", "bn"],
  ["bn", "opacity", "backLegs"],
  ["ff", "transform", "ff"],
  ["fn", "transform", "fn"],
  ["tail", "transform", "tail"],
  ["haunch", "transform", "haunch"],
  ["haunch", "opacity", "haunchOpacity"],
  ["head", "transform", "head"],
  ["earL", "transform", "earL"],
  ["earR", "transform", "earR"],
  ["eyes", "transform", "eyes"],
  ["open", "opacity", "openEyes"],
  ["blink", "transform", "blink"],
  ["happy", "opacity", "happyEyes"],
  ["shut", "opacity", "shutEyes"],
  ["tongue", "opacity", "tongue"],
  ["mouth", "opacity", "mouth"],
  ["ledge", "opacity", "ledge"],
];

/** Fraction of the way an exponential ease covers in `dt` seconds. */
const ease = (dt: number, tau: number) => 1 - Math.exp(-dt / tau);
const clamp = (n: number, min = -1, max = 1) => Math.max(min, Math.min(max, n));

/**
 * Animates a server-rendered {@link PupSvg} in place. Call `tick` every
 * animation frame; the other methods set targets that are eased towards, so
 * Teddy never snaps between poses.
 */
export class PupDriver {
  private els = new Map<string, Element>();
  private written = new Map<string, string>();
  private pose: Pose;
  private target: Pose;
  private m: Motion = { ...STILL };
  private facing: number;
  private facingTarget: number;
  private turnTau = 0.07;
  private strideTarget = 0;
  private wagTarget = 0.35;
  private gazeTarget = { x: 0, y: 0 };
  private tilt = 0;
  private tiltTarget = 0;
  private earV = 0;
  private nextBlink = 1.2;
  private blinkAt = -1;
  private mouthOpenUntil = 0;
  private bounce = 0;
  private bounceV = 0;
  private offset = 0;
  private offsetTarget = 0;
  private pet = 0;
  private petTarget = 0;
  lean = 0;

  constructor(
    private svg: SVGSVGElement,
    pose: PoseName = "sit",
    facing = 1,
  ) {
    svg.querySelectorAll<SVGElement>("[data-p]").forEach((el) => this.els.set(el.dataset.p!, el));
    this.pose = { ...poses[pose] };
    this.target = this.pose;
    this.facing = this.facingTarget = facing;
  }

  setPose(pose: PoseName | Pose) {
    this.target = typeof pose === "string" ? poses[pose] : pose;
  }

  /** Switch pose (and optionally direction) without easing. */
  jump(pose: PoseName, facing?: number) {
    this.pose = { ...poses[pose] };
    this.target = poses[pose];
    if (facing) this.facing = this.facingTarget = facing;
  }

  face(dir: number, tau = 0.07) {
    this.facingTarget = dir;
    this.turnTau = tau;
  }

  get facingDir() {
    return this.facingTarget;
  }

  stride(amount: number) {
    this.strideTarget = clamp(amount, 0, 1);
  }

  /** Advance the walk cycle by a distance in viewBox units. */
  advance(distance: number) {
    this.m.phase += (distance / 46) * Math.PI;
  }

  walkedTo(distance: number) {
    this.m.phase = (distance / 46) * Math.PI;
  }

  wag(amount: number) {
    this.wagTarget = clamp(amount, 0, 1);
  }

  /** Cock the head by `deg` degrees. */
  cock(deg: number) {
    this.tiltTarget = deg;
  }

  /** Look towards a viewport point, or straight ahead when null. */
  lookAt(point: { x: number; y: number } | null) {
    if (!point) {
      this.gazeTarget = { x: 0, y: 0 };
      return;
    }
    const box = this.svg.getBoundingClientRect();
    const headX = this.facingTarget > 0 ? HEAD_PIVOT[0] : WIDTH - HEAD_PIVOT[0];
    const dx = point.x - (box.left + (headX / WIDTH) * box.width);
    const dy = point.y - (box.top + (EYE_Y / HEIGHT) * box.height);
    const dist = Math.hypot(dx, dy) || 1;
    const reach = Math.min(1, dist / 160);
    this.gazeTarget = { x: (dx / dist) * reach * this.facingTarget, y: (dy / dist) * reach };
  }

  woof(now: number) {
    this.mouthOpenUntil = now + 0.34;
    this.bounceV = -150;
    this.earV += 260;
  }

  jolt(strength = 1) {
    this.earV += 220 * strength;
  }

  hop(strength = 1) {
    this.bounceV = -230 * strength;
    this.earV += 200 * strength;
  }

  yawn(now: number, duration = 0.9) {
    this.mouthOpenUntil = now + duration;
  }

  /** Run sideways to an offset (viewBox units) from the resting spot. */
  dash(offset: number) {
    this.offsetTarget = offset;
  }

  petting(on: boolean) {
    this.petTarget = on ? 1 : 0;
  }

  reset() {
    this.offsetTarget = 0;
    this.tiltTarget = 0;
    this.petTarget = 0;
  }

  tick(dt: number, now: number) {
    dt = Math.min(dt, 0.05);
    const m = this.m;
    m.time = now;
    this.pose = lerpPose(this.pose, this.target, ease(dt, 0.16));
    this.facing += (this.facingTarget - this.facing) * ease(dt, this.turnTau);
    m.stride += (this.strideTarget - m.stride) * ease(dt, 0.12);
    if (m.stride < 0.012 && this.strideTarget === 0) m.stride = 0;
    m.wag += (this.wagTarget - m.wag) * ease(dt, 0.4);
    m.gazeX += (this.gazeTarget.x - m.gazeX) * ease(dt, 0.07);
    m.gazeY += (this.gazeTarget.y - m.gazeY) * ease(dt, 0.07);
    this.tilt += (this.tiltTarget + 3 * m.gazeX - this.tilt) * ease(dt, 0.18);

    // Springs: floppy ears and a little bounce.
    this.earV += (-150 * m.ear - 10 * this.earV) * dt;
    m.ear = clamp(m.ear + this.earV * dt, -28, 28);
    this.bounceV += (-260 * this.bounce - 16 * this.bounceV) * dt;
    this.bounce += this.bounceV * dt;

    // Dashing sideways moves the legs too.
    const before = this.offset;
    this.offset += (this.offsetTarget - this.offset) * ease(dt, 0.2);
    if (Math.abs(this.offsetTarget - this.offset) < 0.05) this.offset = this.offsetTarget;
    const moved = Math.abs(this.offset - before);
    if (moved) this.advance(moved);
    const dashStride = dt > 0 ? Math.min(1, moved / dt / 180) : 0;

    this.pet += (this.petTarget - this.pet) * ease(dt, 0.15);

    // Blink every few seconds, sometimes twice in a row.
    if (now > this.nextBlink && this.pose.eyes > 0.6) {
      this.blinkAt = now;
      this.nextBlink = now + 2.2 + Math.random() * 3.8;
      if (Math.random() < 0.18) this.nextBlink = now + 0.32;
    }
    const blinkT = (now - this.blinkAt) / 0.15;
    m.blink = blinkT >= 0 && blinkT <= 1 ? Math.sin(blinkT * Math.PI) : 0;

    const pose = {
      ...this.pose,
      headRot: this.pose.headRot + this.tilt,
      bodyRot: this.pose.bodyRot + this.lean,
      bodyY: this.pose.bodyY + this.bounce,
      headY: this.pose.headY + this.bounce * 1.15,
      mouth: now < this.mouthOpenUntil ? 1 : this.pose.mouth,
      happy: Math.max(this.pose.happy, this.pet),
    };
    const f = frame(pose, dashStride > m.stride ? { ...m, stride: dashStride } : m);
    // Never scale to exactly 0 while turning around, or the SVG vanishes.
    const scaleX = Math.abs(this.facing) < 0.02 ? 0.02 * Math.sign(this.facing || 1) : this.facing;
    const root = `translate(${this.offset.toFixed(1)} 0) translate(${WIDTH / 2} 0) scale(${scaleX.toFixed(3)} 1) translate(${-WIDTH / 2} 0)`;

    for (const [part, attr, key] of BINDINGS) {
      const el = this.els.get(part);
      if (!el) continue;
      const value = key === "root" ? root : String(f[key]);
      const id = `${part}:${attr}`;
      if (this.written.get(id) !== value) {
        el.setAttribute(attr, value);
        this.written.set(id, value);
      }
    }
  }
}
