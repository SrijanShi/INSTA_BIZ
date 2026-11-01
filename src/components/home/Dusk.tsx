"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { PupStop } from "@/components/mascot/PupStop";
import { usePhotoViewer } from "@/components/PhotoViewer";
import { Polaroid } from "@/components/Polaroid";
import { RevealScope } from "@/components/RevealScope";
import { Scene, tones } from "@/components/Scene";
import type { Media, Section } from "@/lib/content";

export type Testimonial = { quote: string; author: string; location?: string };

const SIZES = "(min-width: 1024px) 18vw, (min-width: 640px) 28vw, 42vw";
/** Order in which the prints pop onto the wall (staggered, not left-to-right). */
const POP_ORDER = [3, 0, 5, 1, 6, 2, 7, 4];

/** Dusk falls: a testimonial and a wall of family photos outside the shop. */
export function Dusk({ section, photos, testimonial }: { section: Section; photos: Media[]; testimonial: Testimonial }) {
  const prints = photos.slice(0, 8);
  const { open, viewer } = usePhotoViewer(photos, SIZES);
  if (!photos.length) return null;

  return (
    <Scene tone={tones.dusk} aria-labelledby="dusk-title" className="tp-dusk">
      <div className="tp-dusk__sky gutter">
        <div className="tp-dusk__head">
          <h2 id="dusk-title" className="font-plush text-huge">
            {section.heading}
          </h2>
          {section.body && <p className="text-lede mt-5 max-w-[50ch] text-[var(--ink-soft)]">{section.body}</p>}
        </div>
        <figure className="tp-dusk__note">
          <blockquote className="font-plush-text">“{testimonial.quote}”</blockquote>
          <figcaption className="font-scrawl">
            {testimonial.author}
            {testimonial.location ? `, ${testimonial.location}` : ""}
          </figcaption>
        </figure>
      </div>
      <div className="tp-photowall">
        <RevealScope className="tp-photowall__wall">
          <ul className="tp-photowall__prints" aria-label="Photos from TeddyPups families">
            {prints.map((photo, i) => (
              <li
                key={photo.id}
                data-reveal
                data-pup-look={i === 1 || i === 4 ? "" : undefined}
                style={{ "--d": `${POP_ORDER[i] * 110}ms` } as CSSProperties}
              >
                <button
                  type="button"
                  className="tp-photowall__print"
                  onClick={() => open(i)}
                  aria-label={`Open photo ${i + 1} of ${photos.length}${photo.caption ? `: ${photo.caption}` : ""}`}
                >
                  <Polaroid media={photo} order={i} sizes={SIZES} />
                </button>
              </li>
            ))}
          </ul>
          <div className="tp-facade__ground">
            <span aria-hidden="true" className="tp-facade__door" />
            <span aria-hidden="true" className="tp-lamp">
              <span className="tp-lamp__light" />
            </span>
            {typeof section.data.ctaLabel === "string" && (
              <Link href={(section.data.ctaHref as string) ?? "/happy-families"} className="btn btn-primary tp-facade__cta">
                {section.data.ctaLabel}
              </Link>
            )}
            <PupStop pose="sit" className="tp-dusk__teddy" />
          </div>
        </RevealScope>
        <div aria-hidden="true" className="tp-street__pavement" />
      </div>
      {viewer}
    </Scene>
  );
}
