"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { PupBuddy } from "@/components/mascot/PupBuddy";
import { RevealScope } from "@/components/RevealScope";
import type { Puppy, Taxon } from "@/lib/content";
import { whatsappHref } from "@/lib/site";
import { SKETCH_SIZES, SketchCard } from "./SketchCard";

const FILTER_KEYS = ["origin", "breed", "gender", "collection"] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className="tp-sticker-chip">
      {children}
    </button>
  );
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-scrawl mr-1 w-full shrink-0 text-cocoa-soft sm:w-28">{label}</span>
      {children}
    </div>
  );
}

/**
 * Filterable puppy grid. Filters live in the URL (?origin=, ?breed=,
 * ?gender=, ?collection=) so they can be shared and survive reloads; they
 * update with history.replaceState, which Next.js keeps in sync with
 * useSearchParams without a server round trip.
 */
export function PuppyBrowser({ puppies, breeds }: { puppies: Puppy[]; breeds: Taxon[] }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const filters = {
    origin: params.get("origin") ?? "",
    breed: params.get("breed") ?? "",
    gender: params.get("gender") ?? "",
    collection: params.get("collection") ?? "",
  };

  // Clicking the active chip again clears that filter.
  const toggle = (key: FilterKey, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value && filters[key] !== value) next.set(key, value);
    else next.delete(key);
    const query = next.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  };
  const clear = () => window.history.replaceState(null, "", pathname);

  const shown = useMemo(
    () =>
      puppies.filter(
        (p) =>
          (!filters.origin || p.origin?.slug === filters.origin) &&
          (!filters.breed || p.breeds.some((b) => b.slug === filters.breed)) &&
          (!filters.gender || p.gender === filters.gender || p.gender === "male-female") &&
          (!filters.collection || p.collections.some((c) => c.slug === filters.collection)),
      ),
    [puppies, filters.origin, filters.breed, filters.gender, filters.collection],
  );

  const filtering = FILTER_KEYS.some((k) => filters[k]);
  const breedChoices = breeds.filter((b) => puppies.some((p) => p.breeds.some((pb) => pb.slug === b.slug)));
  const hasKorean = puppies.some((p) => p.collections.some((c) => c.slug === "korean-teacup"));
  const hasLocal = puppies.some((p) => p.origin?.slug === "local");

  return (
    <div>
      <div role="group" aria-label="Filter puppies" className="tp-sketchpad flex flex-col gap-4">
        <FilterRow label="where">
          <Chip active={!filters.origin && !filters.collection} onClick={clear}>
            Everywhere
          </Chip>
          {hasLocal && (
            <Chip active={filters.origin === "local"} onClick={() => toggle("origin", "local")}>
              In Dubai
            </Chip>
          )}
          <Chip active={filters.origin === "imported"} onClick={() => toggle("origin", "imported")}>
            Imported
          </Chip>
          {hasKorean && (
            <Chip active={filters.collection === "korean-teacup"} onClick={() => toggle("collection", "korean-teacup")}>
              Korean Teacup
            </Chip>
          )}
        </FilterRow>
        <FilterRow label="breed">
          {breedChoices.map((b) => (
            <Chip key={b.slug} active={filters.breed === b.slug} onClick={() => toggle("breed", b.slug)}>
              {b.name}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="boy or girl">
          <Chip active={filters.gender === "male"} onClick={() => toggle("gender", "male")}>
            Boys
          </Chip>
          <Chip active={filters.gender === "female"} onClick={() => toggle("gender", "female")}>
            Girls
          </Chip>
          {filtering && (
            <button type="button" onClick={clear} className="link-ink ml-auto text-[0.95rem] font-semibold">
              Clear filters
            </button>
          )}
        </FilterRow>
      </div>

      <p className="font-scrawl mt-10 text-lg text-[var(--ink-soft)]" aria-live="polite">
        {shown.length === 1 ? "1 puppy" : `${shown.length} puppies`} {filtering ? "match" : "looking for a home"}
      </p>

      {shown.length ? (
        <RevealScope>
          <motion.ul layout className="tp-sketches mt-8">
            <AnimatePresence mode="popLayout">
              {shown.map((pup, i) => (
                <motion.li
                  key={pup.id}
                  layout
                  initial={{ opacity: 0, scale: 0.86 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.86, transition: { duration: 0.2 } }}
                  transition={{ type: "spring", stiffness: 260, damping: 26 }}
                >
                  <SketchCard pup={pup} index={i} sizes={SKETCH_SIZES} preload={i < 3} />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        </RevealScope>
      ) : (
        <div className="tp-sketchpad mt-10 grid items-center gap-6 md:grid-cols-[auto_1fr] md:gap-10">
          <PupBuddy pose="sit" act="tilt" className="mx-auto w-44 md:w-52" label="Teddy, tilting his head" />
          <div>
            <p className="font-plush text-big">No puppies match just now.</p>
            <p className="mt-3 max-w-[48ch] text-cocoa-soft">
              Tell us what you&apos;re hoping for and we&apos;ll let you know what&apos;s in our showroom or what we can bring
              in for you.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                Ask on WhatsApp
              </a>
              <button type="button" onClick={clear} className="btn btn-ghost">
                Show all puppies
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
