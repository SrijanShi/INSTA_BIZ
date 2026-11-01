"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Media } from "@/lib/content";
import { MediaImage } from "./MediaImage";

/** Pixel width a photo will occupy when fitted into the viewer. */
const fittedWidth = (m: Media) => Math.ceil(Math.min(innerWidth, Math.max(1, innerHeight - 150) * (m.width / m.height)));

/**
 * Shows the small (already cached) grid image instantly, then cross-fades
 * to a sharp copy sized for the screen once it has decoded.
 */
export function ViewerImage({ media, pageSizes, quality = 75 }: { media: Media; pageSizes: string; quality?: number }) {
  const [sharp, setSharp] = useState(false);
  return (
    <>
      <MediaImage
        media={media}
        sizes={pageSizes}
        quality={quality}
        alt=""
        eager
        className={sharp ? "tp-viewer__first tp-viewer__first--done" : "tp-viewer__first"}
        style={{ objectFit: "contain", objectPosition: "50% 50%", backgroundColor: "transparent" }}
      />
      <Image
        src={media.url}
        alt={media.alt}
        fill
        sizes={`${fittedWidth(media)}px`}
        quality={quality}
        loading="eager"
        className="tp-viewer__sharp object-contain"
        data-sharp={sharp || undefined}
        onLoad={(e) => {
          e.currentTarget
            .decode()
            .catch(() => {})
            .then(() => setSharp(true));
        }}
      />
    </>
  );
}

/** Warms the cache with the previous and next photos. */
export function PrefetchNeighbours({ photos, at, quality = 75 }: { photos: Media[]; at: number; quality?: number }) {
  const n = photos.length;
  if (n < 2) return null;
  const around = [...new Set([(at - 1 + n) % n, (at + 1) % n])].filter((i) => photos[i].kind === "image");
  return (
    <span aria-hidden="true" className="sr-only">
      {around.map((i) => (
        <Image
          key={photos[i].id}
          src={photos[i].url}
          alt=""
          fill
          sizes={`${fittedWidth(photos[i])}px`}
          quality={quality}
          loading="eager"
        />
      ))}
    </span>
  );
}

const slide: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: 70 * dir, rotate: 5 * dir, scale: 0.92 }),
  center: { opacity: 1, x: 0, rotate: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 26 } },
  exit: (dir: number) => ({ opacity: 0, x: -70 * dir, rotate: -5 * dir, scale: 0.92, transition: { duration: 0.22 } }),
};

/**
 * Full-screen photo viewer. Returns `open(index)` and the `<dialog>` to
 * render. Swipe, arrow keys or the buttons move between photos.
 */
export function usePhotoViewer(photos: Media[], pageSizes: string) {
  const ref = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState(1);
  const count = photos.length;
  const wrap = useCallback((i: number) => ((i % count) + count) % count, [count]);
  const go = useCallback(
    (i: number, dir: number) => {
      setDirection(dir);
      setIndex(wrap(i));
    },
    [wrap],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(index + 1, 1);
      if (e.key === "ArrowLeft") go(index - 1, -1);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [index, go]);

  const photo = index === null ? null : photos[index];
  const close = () => ref.current?.close();

  const viewer = (
    <dialog
      ref={ref}
      aria-label="Photo viewer"
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-cocoa/95 p-0 text-milk backdrop:bg-cocoa/70"
      onClose={() => setIndex(null)}
      onClick={(e) => e.target === ref.current && close()}
      data-lenis-prevent
    >
      {photo && index !== null && (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <p className="font-scrawl text-lg">
              {index + 1} / {count}
              {photo.caption ? ` — ${photo.caption}` : ""}
            </p>
            <button type="button" onClick={close} className="h-11 rounded-full bg-milk px-5 font-semibold text-cocoa">
              Close
            </button>
          </div>
          <div className="relative flex-1 overflow-hidden">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={photo.id}
                custom={direction}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 touch-pan-y"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80) go(index + 1, 1);
                  else if (info.offset.x > 80) go(index - 1, -1);
                }}
              >
                <ViewerImage media={photo} pageSizes={pageSizes} />
              </motion.div>
            </AnimatePresence>
            <PrefetchNeighbours photos={photos} at={index} />
          </div>
          <div className="flex justify-center gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
            <button type="button" onClick={() => go(index - 1, -1)} className="h-12 rounded-full border-2 border-milk px-6 font-semibold">
              Previous
            </button>
            <button type="button" onClick={() => go(index + 1, 1)} className="h-12 rounded-full bg-honey px-6 font-semibold text-cocoa">
              Next
            </button>
          </div>
        </div>
      )}
    </dialog>
  );

  return {
    open: (i: number) => {
      setDirection(1);
      setIndex(i);
      ref.current?.showModal();
    },
    viewer,
  };
}
