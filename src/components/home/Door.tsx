import Link from "next/link";
import type { CSSProperties } from "react";
import { PawIcon } from "@/components/icons";
import { MediaImage } from "@/components/MediaImage";
import { hasVideo, type Puppy } from "@/lib/content";

const STATUS = { available: "Available", "gone-home": "Gone home" } as const;
const DOOR_COLOURS = ["#a24a1a", "#5a3a28", "#d4893f", "#b8644a", "#7a4a2e"];

/** A puppy behind an arched door that swings open, with a name plate above. */
export function Door({ pup, index, sizes }: { pup: Puppy; index: number; sizes: string }) {
  return (
    <Link
      href={`/puppies/${pup.slug}`}
      className="tp-door__link"
      style={{ "--door": DOOR_COLOURS[index % DOOR_COLOURS.length] } as CSSProperties}
    >
      <span className="tp-door__plate">
        <span className="font-plush tp-door__name">{pup.displayName}</span>
        <span className="tp-door__meta">
          {pup.name ? `${pup.breed}, ` : ""}
          {pup.genderLabel.toLowerCase()}
          {pup.age ? `, ${pup.age}` : ""}
          {hasVideo(pup) ? ", with video" : ""}
        </span>
      </span>
      <span className="tp-door__frame">
        <span className="tp-door__room">{pup.cover && <MediaImage media={pup.cover} sizes={sizes} />}</span>
        <span aria-hidden="true" className="tp-door__way">
          <span className="tp-door__leaf">
            <PawIcon className="tp-door__peephole" />
            <span className="tp-door__knob" />
          </span>
        </span>
        <span className="tp-door__tag font-scrawl">{STATUS[pup.status]}</span>
      </span>
    </Link>
  );
}
