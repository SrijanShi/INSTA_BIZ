import Link from "next/link";
import type { CSSProperties } from "react";
import { PAW_PATH } from "@/components/icons";
import { MediaImage } from "@/components/MediaImage";
import { hasVideo, type Puppy } from "@/lib/content";
import { maskUrl, sketchFor, type Doodle } from "./sketch";

const STATUS = { available: "Available", "gone-home": "Gone home" } as const;

export const SKETCH_SIZES = "(min-width: 1536px) 17rem, (min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw";

function DoodleMark({ d }: { d: Doodle }) {
  const line = { fill: "none", stroke: d.ink, strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <g transform={`translate(${d.x.toFixed(1)} ${d.y.toFixed(1)}) rotate(${d.rot.toFixed(0)}) scale(${d.size.toFixed(2)})`}>
      <g className="tp-sketch__doodle">
        {d.kind === "sparkle" && (
          <path d="M0 -6c.6 3.6 2.4 5.4 6 6-3.6.6-5.4 2.4-6 6-.6-3.6-2.4-5.4-6-6 3.6-.6 5.4-2.4 6-6z" fill={d.ink} />
        )}
        {d.kind === "heart" && (
          <path
            d="M0 5C-4.6 1.8-6.4-.8-6.4-3.2c0-1.9 1.5-3.3 3.3-3.3 1.3 0 2.4.7 3.1 1.9.7-1.2 1.8-1.9 3.1-1.9 1.8 0 3.3 1.4 3.3 3.3C6.4-.8 4.6 1.8 0 5z"
            {...line}
          />
        )}
        {d.kind === "dashes" && <path d="M-5 -5l4 2M-6 0h5M-5 5l4 -2" {...line} />}
        {d.kind === "swirl" && <path d="M0 0c1.6-.6 2.4 1.4.8 2.6-2 1.4-4.6-.4-4-3 .7-3 4.8-3.8 6.8-1.2 2.4 3-0.2 7.4-3.8 7.2" {...line} />}
        {d.kind === "dots" && (
          <g fill={d.ink}>
            <circle cx="-4" cy="1" r="1.2" />
            <circle cx="0" cy="-2" r="1.2" />
            <circle cx="4" cy="1" r="1.2" />
          </g>
        )}
        {d.kind === "paw" && <path d={PAW_PATH} transform="scale(.17) translate(-32 -34)" fill={d.ink} opacity={0.85} />}
      </g>
    </g>
  );
}

/** A puppy drawn into Teddy's sketchbook: wobbly ink frame, wash and doodles. */
export function SketchCard({
  pup,
  index = 0,
  sizes = SKETCH_SIZES,
  preload = false,
  small = false,
}: {
  pup: Puppy;
  index?: number;
  sizes?: string;
  preload?: boolean;
  /** Compact version used for the "gone home" strip. */
  small?: boolean;
}) {
  const s = sketchFor(pup.slug);
  const mask = maskUrl(s.mask);
  const label = `${pup.displayName}${pup.name ? `, ${pup.breed}` : ""}, ${pup.genderLabel.toLowerCase()}${pup.age ? `, ${pup.age}` : ""}, ${STATUS[pup.status].toLowerCase()}`;

  return (
    <Link
      href={`/puppies/${pup.slug}`}
      className={`tp-sketch${small ? " tp-sketch--small" : ""}`}
      data-reveal
      style={{ "--tilt": `${s.tilt.toFixed(2)}deg`, "--d": `${(index % 8) * 70}ms`, "--wash": s.wash.color } as CSSProperties}
      aria-label={label}
    >
      <span className="tp-sketch__frame">
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          className="tp-sketch__wash"
          style={{ translate: `${s.wash.dx.toFixed(1)}% ${s.wash.dy.toFixed(1)}%` }}
        >
          <path d={s.wash.d} />
        </svg>
        <span className="tp-sketch__photo" style={{ maskImage: mask, WebkitMaskImage: mask }}>
          {pup.cover && <MediaImage media={pup.cover} sizes={sizes} preload={preload} alt="" />}
        </span>
        <svg aria-hidden="true" viewBox="0 0 100 100" className="tp-sketch__ink">
          <path d={s.outline} pathLength={1} className="tp-sketch__line" />
          <path d={s.retrace} pathLength={1} className="tp-sketch__line tp-sketch__line--retrace" />
          {s.doodles.map((d, i) => (
            <DoodleMark key={i} d={d} />
          ))}
        </svg>
        {!small && <span className="tp-sketch__sticker font-scrawl">{STATUS[pup.status]}</span>}
        {!small && hasVideo(pup) && <span className="tp-sketch__video">▶ video</span>}
        {small && <span className="tp-sketch__sticker tp-sketch__sticker--home font-scrawl">gone home ♥</span>}
      </span>
      <span className="tp-sketch__name font-plush">{pup.displayName}</span>
      {!small && (
        <span className="tp-sketch__meta">
          {pup.name ? `${pup.breed} · ` : ""}
          {pup.genderLabel.toLowerCase()}
          {pup.age ? ` · ${pup.age}` : ""}
        </span>
      )}
    </Link>
  );
}
