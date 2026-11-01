import type { CSSProperties } from "react";
import type { Media } from "@/lib/content";
import { MediaImage } from "./MediaImage";

const TILTS = [-2.2, 1.6, -0.9, 2.4, -1.5, 0.8, -2.6, 1.2];
const TAPE_SPOTS = ["center", "left", "right", "corners", "center", "right", "left", "center"] as const;
const TAPE_COLOURS = ["#f6d79a", "#f9cdbf", "#cfe5f6", "#f6d79a", "#e9dcc4"];

/** A taped-up instant photo. Tilt and tape vary with its position on the wall. */
export function Polaroid({
  media,
  order,
  sizes,
  caption,
  preload = false,
}: {
  media: Media;
  order: number;
  sizes: string;
  caption?: string;
  preload?: boolean;
}) {
  const spot = TAPE_SPOTS[order % TAPE_SPOTS.length];
  const style = {
    "--tilt": `${TILTS[order % TILTS.length]}deg`,
    "--tape": TAPE_COLOURS[order % TAPE_COLOURS.length],
    "--i": order,
  } as CSSProperties;
  return (
    <span className="tp-polaroid" style={style}>
      {spot === "corners" ? (
        <>
          <span aria-hidden="true" className="tp-tape tp-tape--tl" />
          <span aria-hidden="true" className="tp-tape tp-tape--tr" />
        </>
      ) : (
        <span aria-hidden="true" className={`tp-tape tp-tape--${spot}`} />
      )}
      <span className="tp-polaroid__photo">
        <MediaImage media={media} layout="natural" sizes={sizes} preload={preload} />
      </span>
      <span className="tp-polaroid__caption font-scrawl">{caption ?? media.caption}</span>
    </span>
  );
}
