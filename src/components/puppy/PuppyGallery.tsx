"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MediaImage } from "@/components/MediaImage";
import { PrefetchNeighbours, ViewerImage } from "@/components/PhotoViewer";
import type { Media } from "@/lib/content";

const SIZES = "(min-width: 1024px) 55vw, 92vw";

/**
 * A puppy's photos and videos as pages of a storybook: each new photo is
 * revealed like a turning page. Thumbnails below, and a full-screen viewer
 * with swipe and arrow-key navigation.
 */
export function PuppyGallery({ name, media }: { name: string; media: Media[] }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [viewing, setViewing] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const count = media.length;
  const current = media[index];

  const go = useCallback(
    (i: number) => {
      setDirection(i > index ? 1 : -1);
      setIndex(((i % count) + count) % count);
    },
    [index, count],
  );

  useEffect(() => {
    if (!viewing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [viewing, index, go]);

  if (!current) return null;
  const describe = (i: number) => `${name}, ${media[i].kind === "video" ? "video" : "photo"} ${i + 1} of ${count}`;

  return (
    <div>
      <div className="tp-storypage relative aspect-[4/5] md:aspect-[5/6]">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.button
            key={current.id}
            type="button"
            custom={direction}
            className="absolute inset-0 block size-full"
            initial={{
              clipPath: direction > 0 ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)",
              rotateY: -14 * direction,
              transformPerspective: 1400,
            }}
            animate={{ clipPath: "inset(0% 0% 0% 0%)", rotateY: 0 }}
            exit={{ opacity: 0.4, scale: 0.97 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: direction > 0 ? "0% 50%" : "100% 50%" }}
            onClick={() => {
              dialogRef.current?.showModal();
              setViewing(true);
            }}
            aria-label={`Open ${describe(index)} full screen`}
          >
            {current.kind === "video" ? (
              <video
                src={current.url}
                poster={current.poster?.url}
                className="size-full object-cover"
                muted
                loop
                playsInline
                autoPlay
                aria-label={current.alt}
              />
            ) : (
              <MediaImage media={current} sizes={SIZES} preload={index === 0} quality={85} />
            )}
          </motion.button>
        </AnimatePresence>
        {count > 1 && (
          <div className="absolute inset-x-4 bottom-4 flex justify-between">
            <button
              type="button"
              onClick={() => go(index - 1)}
              className="grid size-12 place-items-center rounded-full border-2 border-cocoa bg-milk/95 text-xl font-bold"
              aria-label="Previous photo"
            >
              ‹
            </button>
            <span className="self-center rounded-full bg-cocoa/80 px-3 py-1 text-sm font-semibold text-milk">
              {index + 1} / {count}
            </span>
            <button
              type="button"
              onClick={() => go(index + 1)}
              className="grid size-12 place-items-center rounded-full border-2 border-cocoa bg-milk/95 text-xl font-bold"
              aria-label="Next photo"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {count > 1 && (
        <ul className="mt-3 flex gap-3 overflow-x-auto px-1 pb-2 pt-2 [scrollbar-width:thin]" aria-label={`All photos of ${name}`}>
          {media.map((m, i) => {
            const thumb = m.kind === "video" ? m.poster : m;
            return (
              <li key={m.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-label={describe(i)}
                  aria-current={i === index}
                  className={`relative block h-24 w-20 overflow-hidden rounded-[0.9rem] border-[3px] transition-transform duration-300 md:h-28 md:w-24 ${
                    i === index ? "-rotate-3 -translate-y-1 border-toffee-deep" : "border-cocoa/30 hover:-rotate-2 hover:border-cocoa"
                  }`}
                >
                  {thumb && <MediaImage media={thumb} sizes="96px" alt="" />}
                  {m.kind === "video" && (
                    <span className="absolute inset-0 grid place-items-center bg-cocoa/30 text-lg text-milk">▶</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <dialog
        ref={dialogRef}
        aria-label={`${name} photos`}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-cocoa/95 p-0 text-milk backdrop:bg-cocoa/70"
        onClose={() => setViewing(false)}
        onClick={(e) => e.target === dialogRef.current && dialogRef.current?.close()}
        data-lenis-prevent
      >
        {viewing && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <p className="font-scrawl text-lg">{describe(index)}</p>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="h-11 rounded-full bg-milk px-5 font-semibold text-cocoa"
              >
                Close
              </button>
            </div>
            <div className="relative flex-1 touch-pan-y">
              <motion.div
                key={current.id}
                className="absolute inset-0"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80) go(index + 1);
                  else if (info.offset.x > 80) go(index - 1);
                }}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {current.kind === "video" ? (
                  <video src={current.url} poster={current.poster?.url} controls autoPlay playsInline className="size-full object-contain" />
                ) : (
                  <ViewerImage media={current} pageSizes={SIZES} quality={85} />
                )}
              </motion.div>
              <PrefetchNeighbours photos={media} at={index} quality={85} />
            </div>
            {count > 1 && (
              <div className="flex justify-center gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
                <button type="button" onClick={() => go(index - 1)} className="h-12 rounded-full border-2 border-milk px-6 font-semibold">
                  Previous
                </button>
                <button type="button" onClick={() => go(index + 1)} className="h-12 rounded-full bg-honey px-6 font-semibold text-cocoa">
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}
