import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PupBuddy } from "@/components/mascot/PupBuddy";
import { PuppyBrowser } from "@/components/puppies/PuppyBrowser";
import { SketchCard } from "@/components/puppies/SketchCard";
import { RevealScope } from "@/components/RevealScope";
import { getAvailablePuppies, getBreeds, getGoneHomePuppies } from "@/lib/content";

export const metadata: Metadata = {
  title: "Available puppies",
  description:
    "Teacup and teddy bear puppies available now in Dubai and imported from trusted breeders — every listing shows real photos of the puppy.",
  alternates: { canonical: "/puppies" },
};

export default function PuppiesPage() {
  const puppies = getAvailablePuppies();
  const gone = getGoneHomePuppies().slice(0, 5);

  return (
    <RevealScope data-page="pups" className="tp-page">
      <section aria-labelledby="pups-title" className="tp-sketchbook">
        <div className="gutter mx-auto max-w-[110rem] pb-24 pt-10 md:pt-16">
          <div className="tp-sketchbook__head">
            <div className="tp-sketchbook__words">
              <p className="font-scrawl text-lg text-toffee-ink" data-reveal>
                from Teddy&apos;s sketchbook
              </p>
              <h1 id="pups-title" className="font-plush text-giant tp-sketchbook__title" data-reveal>
                Available puppies
                <svg aria-hidden="true" viewBox="0 0 400 24" preserveAspectRatio="none" className="tp-sketchbook__underline">
                  <path d="M4 15c40-9 70 5 112-2s70-9 112 0 74 8 116-1 38-4 52 1" pathLength={1} />
                </svg>
              </h1>
              <p className="tp-sketchbook__lede text-lede mt-6 max-w-[46ch] text-cocoa-soft" data-reveal>
                Every listing shows real photos of the actual puppy. Open a profile to see them all, then ask us about
                them on WhatsApp.
              </p>
            </div>
            <div className="tp-sketchbook__self" data-reveal>
              <PupBuddy pose="sit" facing="left" label="Teddy, the TeddyPups puppy" />
              <span className="font-scrawl tp-sketchbook__caption">self-portrait</span>
            </div>
          </div>
          <div className="mt-12">
            {/* Filters read the URL on the client; until then show every puppy. */}
            <Suspense
              fallback={
                <ul className="tp-sketches mt-20">
                  {puppies.map((pup, i) => (
                    <li key={pup.id}>
                      <SketchCard pup={pup} index={i} preload={i < 3} />
                    </li>
                  ))}
                </ul>
              }
            >
              <PuppyBrowser puppies={puppies} breeds={getBreeds()} />
            </Suspense>
          </div>
        </div>
      </section>

      {gone.length > 0 && (
        <section aria-labelledby="gone-title" className="tp-gone-strip">
          <div className="gutter mx-auto flex max-w-[110rem] flex-col gap-10 md:flex-row md:items-center">
            <div className="md:w-1/3" data-reveal>
              <h2 id="gone-title" className="font-plush text-big">
                Already gone home
              </h2>
              <p className="mt-3 text-cocoa-soft">These puppies have found their families.</p>
              <Link className="btn btn-primary mt-6" href="/gone-home">
                See the puppies who&apos;ve gone home
              </Link>
            </div>
            <ul className="tp-gone-strip__row" aria-label="Some puppies who have gone home">
              {gone.map((pup, i) => (
                <li key={pup.id}>
                  <SketchCard pup={pup} index={i} small sizes="9rem" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </RevealScope>
  );
}
