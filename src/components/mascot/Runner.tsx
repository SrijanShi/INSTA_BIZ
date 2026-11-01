import { BLUSH, COLLAR, CREAM, FUR, FUR_SHADE, GROUND_Y, HEIGHT, INK, WIDTH, joints, legs, shapes, toes } from "./rig";

const ink = { stroke: INK, strokeWidth: 3.4, strokeLinejoin: "round", strokeLinecap: "round" } as const;
const line = { ...ink, fill: "none" } as const;

function Leg({ cls, at, d, length, fill }: { cls: string; at: [number, number]; d: string; length: number; fill: string }) {
  return (
    <g className={`tp-runner__leg ${cls}`} style={{ transformOrigin: `${at[0]}px ${at[1]}px` }}>
      <g transform={`translate(${at[0]} ${at[1]})`}>
        <path d={`${d}Z`} fill={fill} />
        <path d={d} {...line} />
        <path d={toes(length)} {...line} strokeWidth={2.4} />
      </g>
    </g>
  );
}

/** Teddy mid-gallop. The legs, ears and tail are animated purely in CSS. */
export function Runner({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={`tp-runner ${className}`}
      aria-hidden="true"
      focusable="false"
      style={{ overflow: "visible" }}
    >
      <ellipse cx={150} cy={GROUND_Y + 2} rx={86} ry={7} fill={INK} opacity={0.12} className="tp-runner__shadow" />
      <g className="tp-runner__body">
        <Leg cls="tp-runner__leg--bf" at={joints.hipFar} d={legs.backFar} length={GROUND_Y - 192} fill={FUR_SHADE} />
        <Leg cls="tp-runner__leg--ff" at={joints.shoulderFar} d={legs.frontFar} length={GROUND_Y - 192} fill={FUR_SHADE} />
        <g className="tp-runner__tail" style={{ transformOrigin: `${joints.tailBase[0]}px ${joints.tailBase[1]}px` }}>
          <path d={shapes.tailStem} {...line} strokeWidth={9} />
          <path d={shapes.tailStem} stroke={FUR} strokeWidth={4} fill="none" strokeLinecap="round" />
          <path d={shapes.tail} fill={FUR} {...ink} />
        </g>
        <Leg cls="tp-runner__leg--bn" at={joints.hipNear} d={legs.back} length={GROUND_Y - 194} fill={FUR} />
        <path d={shapes.body} fill={FUR} {...ink} />
        <path d={shapes.chest} fill={FUR} {...ink} />
        <Leg cls="tp-runner__leg--fn" at={joints.shoulderNear} d={legs.front} length={GROUND_Y - 194} fill={FUR} />
        <g className="tp-runner__head">
          <path d={shapes.collar} fill={COLLAR} {...ink} strokeWidth={3} />
          <path d={shapes.tag} fill={CREAM} {...ink} strokeWidth={2.4} />
          <path d={shapes.earL} fill={FUR_SHADE} {...ink} className="tp-runner__ear" style={{ transformOrigin: "174px 82px" }} />
          <path
            d={shapes.earR}
            fill={FUR_SHADE}
            {...ink}
            className="tp-runner__ear tp-runner__ear--r"
            style={{ transformOrigin: "250px 82px" }}
          />
          <path d={shapes.head} fill={FUR} {...ink} />
          <path d={shapes.topknot} fill={FUR} {...ink} strokeWidth={3} />
          <path d={shapes.muzzle} fill={CREAM} />
          <circle cx={181} cy={116} r={7} fill={BLUSH} opacity={0.85} />
          <circle cx={243} cy={116} r={7} fill={BLUSH} opacity={0.85} />
          <path d="M186.5 101 Q194 91.5 201.5 101 M222.5 101 Q230 91.5 237.5 101" {...line} />
          <path d={shapes.nose} fill={INK} />
          <path d={shapes.mouth} {...line} strokeWidth={3} />
          <path d={shapes.tongue} fill="#e98c8c" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
}
