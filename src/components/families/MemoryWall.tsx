"use client";

import type { CSSProperties } from "react";
import { PawIcon } from "@/components/icons";
import { usePhotoViewer } from "@/components/PhotoViewer";
import { Polaroid } from "@/components/Polaroid";
import { RevealScope } from "@/components/RevealScope";
import type { Media } from "@/lib/content";

const SIZES = "(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 45vw";

/** Every family photo pinned up as a polaroid; tap one to see it large. */
export function MemoryWall({ photos }: { photos: Media[] }) {
  const { open, viewer } = usePhotoViewer(photos, SIZES);
  return (
    <>
      <RevealScope>
        <ul className="tp-wall" aria-label="Photos from TeddyPups families">
          {photos.map((photo, i) => (
            <li key={photo.id} className="tp-wall__item" data-reveal style={{ "--d": `${(i % 4) * 60}ms` } as CSSProperties}>
              <button
                type="button"
                className="tp-wall__print"
                onClick={() => open(i)}
                aria-label={`Open photo ${i + 1} of ${photos.length}${photo.caption ? `: ${photo.caption}` : ""}`}
              >
                <Polaroid media={photo} order={i} sizes={SIZES} preload={i < 2} />
                <PawIcon className="tp-wall__paw" />
              </button>
            </li>
          ))}
        </ul>
      </RevealScope>
      {viewer}
    </>
  );
}
