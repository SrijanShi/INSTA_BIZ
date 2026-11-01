import type { CSSProperties } from "react";
import {
  BLUSH,
  COLLAR,
  CREAM,
  EYE_Y,
  FUR,
  FUR_SHADE,
  GROUND_Y,
  HEIGHT,
  INK,
  WIDTH,
  frame,
  legs,
  poses,
  shapes,
  toes,
  type PoseName,
} from "./rig";

const ink = { stroke: INK, strokeWidth: 3.4, strokeLinejoin: "round", strokeLinecap: "round" } as const;
const line = { ...ink, fill: "none" } as const;

function Leg(props: { part: string; d: string; length: number; fill: string; transform: string; opacity?: number }) {
  return (
    <g data-p={props.part} transform={props.transform} opacity={props.opacity}>
      <path d={`${props.d}Z`} fill={props.fill} />
      <path d={props.d} {...line} />
      <path d={toes(props.length)} {...line} strokeWidth={2.4} />
    </g>
  );
}

function Eyes() {
  return (
    <>
      <ellipse cx={194} cy={EYE_Y} rx={7.4} ry={8.6} fill={INK} />
      <ellipse cx={230} cy={EYE_Y} rx={7.4} ry={8.6} fill={INK} />
      <circle cx={196.6} cy={EYE_Y - 3.4} r={2.7} fill="#fff" />
      <circle cx={232.6} cy={EYE_Y - 3.4} r={2.7} fill="#fff" />
      <circle cx={192} cy={EYE_Y + 3.2} r={1.2} fill="#fff" />
      <circle cx={228} cy={EYE_Y + 3.2} r={1.2} fill="#fff" />
    </>
  );
}

type Props = {
  pose?: PoseName;
  facing?: "left" | "right";
  label?: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * Teddy drawn in a static pose. Every animatable part carries a `data-p`
 * attribute so a {@link PupDriver} can take over and animate it in place.
 */
export function PupSvg({ pose = "sit", facing = "right", label, className, style }: Props) {
  const f = frame(poses[pose]);
  const flip = facing === "left" ? `translate(${WIDTH} 0) scale(-1 1)` : undefined;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={className}
      style={{ overflow: "visible", ...style }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={!label || undefined}
      focusable="false"
    >
      <g data-p="root" transform={flip}>
        <ellipse
          data-p="shadow"
          {...shapes.shadow}
          fill={INK}
          opacity={f.shadowOpacity}
          transform={f.shadow}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
        <g data-p="body" transform={f.body} opacity={f.side}>
          <Leg part="bf" d={legs.backFar} length={GROUND_Y - 192} fill={FUR_SHADE} transform={f.bf} opacity={f.backLegs} />
          <Leg part="ff" d={legs.frontFar} length={GROUND_Y - 192} fill={FUR_SHADE} transform={f.ff} />
          <g data-p="tail" transform={f.tail}>
            <path d={shapes.tailStem} {...line} strokeWidth={9} />
            <path d={shapes.tailStem} stroke={FUR} strokeWidth={4} fill="none" strokeLinecap="round" />
            <path d={shapes.tail} fill={FUR} {...ink} />
          </g>
          <Leg part="bn" d={legs.back} length={GROUND_Y - 194} fill={FUR} transform={f.bn} opacity={f.backLegs} />
          <path d={shapes.body} fill={FUR} {...ink} />
          <path d={shapes.chest} fill={FUR} {...ink} />
          <Leg part="fn" d={legs.front} length={GROUND_Y - 194} fill={FUR} transform={f.fn} />
        </g>
        <g data-p="haunch" opacity={f.haunchOpacity} transform={f.haunch}>
          <path d={shapes.haunch} fill={FUR} {...ink} />
          <path d={shapes.haunchPaw} fill={FUR} {...ink} />
          <path d="M132 222v5M139 222v5" {...line} strokeWidth={2.4} />
        </g>
        <g data-p="head" transform={f.head}>
          <path d={shapes.collar} fill={COLLAR} {...ink} strokeWidth={3} />
          <path d={shapes.tag} fill={CREAM} {...ink} strokeWidth={2.4} />
          <path data-p="earL" d={shapes.earL} fill={FUR_SHADE} {...ink} transform={f.earL} />
          <path data-p="earR" d={shapes.earR} fill={FUR_SHADE} {...ink} transform={f.earR} />
          <path d={shapes.head} fill={FUR} {...ink} />
          <path d={shapes.topknot} fill={FUR} {...ink} strokeWidth={3} />
          <path d={shapes.muzzle} fill={CREAM} />
          <circle cx={181} cy={116} r={7} fill={BLUSH} opacity={0.85} />
          <circle cx={243} cy={116} r={7} fill={BLUSH} opacity={0.85} />
          <g data-p="eyes" transform={f.eyes}>
            <g data-p="open" opacity={f.openEyes}>
              <g data-p="blink" transform={f.blink}>
                <Eyes />
              </g>
            </g>
          </g>
          <path
            data-p="happy"
            d="M186.5 101 Q194 91.5 201.5 101 M222.5 101 Q230 91.5 237.5 101"
            {...line}
            opacity={f.happyEyes}
          />
          <path
            data-p="shut"
            d="M186.5 97 Q194 103.5 201.5 97 M222.5 97 Q230 103.5 237.5 97"
            {...line}
            opacity={f.shutEyes}
          />
          <path d={shapes.nose} fill={INK} />
          <path d={shapes.mouth} {...line} strokeWidth={3} />
          <path
            data-p="tongue"
            d={shapes.tongue}
            fill="#e98c8c"
            stroke={INK}
            strokeWidth={2.2}
            strokeLinejoin="round"
            opacity={f.tongue}
          />
          <g data-p="mouth" opacity={f.mouth}>
            <path d={shapes.mouthOpen} fill="#6b2a1c" {...ink} strokeWidth={2.6} />
            <path d="M206.5 133.5 Q212 130 217.5 133.5 Q215 138 212 138 Q209 138 206.5 133.5 Z" fill="#e98c8c" />
          </g>
        </g>
        <g data-p="ledge" opacity={f.ledge}>
          <path d={shapes.ledgePaws} fill={FUR} {...ink} />
          <path d={shapes.ledgeToes} {...line} strokeWidth={2.4} />
        </g>
      </g>
    </svg>
  );
}
