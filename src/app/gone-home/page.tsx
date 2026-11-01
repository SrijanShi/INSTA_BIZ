import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { PupBuddy } from "@/components/mascot/PupBuddy";
import { MediaImage } from "@/components/MediaImage";
import { RevealScope } from "@/components/RevealScope";
import { getGoneHomePuppies } from "@/lib/content";

export const metadata: Metadata = {
  title: "Gone home",
  description: "TeddyPups puppies who have already joined their families.",
  alternates: { canonical: "/gone-home" },
};

const TILTS = [-1.4, 1.1, -0.6, 1.6, -1.1, 0.8];

export default function GoneHomePage() {
  const puppies = getGoneHomePuppies();
  return (
    <RevealScope data-page="gone" className="tp-page">
      <div className="gutter mx-auto max-w-[110rem] pb-24 pt-10 md:pt-16">
        <header className="tp-boothhead">
          <div className="max-w-3xl">
            <h1 className="font-plush text-giant">
              Gone home
              <svg viewBox="0 0 48 44" className="ml-3 inline-block w-[0.45em] -translate-y-[0.15em] text-toffee" aria-hidden="true">
                <path
                  d="M24 40C10 30 4 22 4 14.5 4 8.7 8.6 4 14.3 4c4.1 0 7.6 2.4 9.7 6 2.1-3.6 5.6-6 9.7-6C39.4 4 44 8.7 44 14.5 44 22 38 30 24 40z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </h1>
            <p className="text-lede mt-6 text-cocoa-soft">
              Every puppy here has already joined a loving family. Looking for one just like them? Tell us — we&apos;ll help
              you find your match.
            </p>
            <Link className="btn btn-primary mt-8" href="/puppies">
              See available puppies
            </Link>
          </div>
          {/* A ticket booth with Teddy peeking over the counter. */}
          <div aria-hidden="true" className="tp-booth">
            <PupBuddy pose="peek" className="tp-booth__teddy" />
            <div className="tp-booth__counter">
              <span className="font-plush">tickets home</span>
            </div>
          </div>
        </header>
        <ul className="tp-tickets" aria-label="Puppies who have gone home">
          {puppies.map((pup, i) => (
            <li
              key={pup.id}
              className="tp-ticket"
              data-reveal
              style={{ "--tilt": `${TILTS[i % TILTS.length]}deg`, "--i": i } as CSSProperties}
            >
              <Link className="tp-ticket__link" href={`/puppies/${pup.slug}`}>
                <span className="tp-ticket__main">
                  <span className="tp-ticket__photo">
                    <MediaImage media={pup.cover} sizes="7rem" />
                  </span>
                  <span className="tp-ticket__body">
                    <span className="font-scrawl tp-ticket__kicker">one ticket home</span>
                    <span className="font-plush tp-ticket__name">{pup.displayName}</span>
                    <span className="tp-ticket__meta">
                      {pup.name ? `${pup.breed}, ${pup.genderLabel.toLowerCase()}` : pup.genderLabel}
                    </span>
                    <span className="tp-ticket__route">
                      <span>{pup.wentHomeFrom ?? "TeddyPups"}</span>
                      <svg viewBox="0 0 60 12" aria-hidden="true">
                        <path d="M2 6h46" />
                        <path d="M44 2l6 4-6 4" />
                      </svg>
                      <span>home ♥</span>
                    </span>
                  </span>
                </span>
                <span aria-hidden="true" className="tp-ticket__stub">
                  <span className="font-plush">admit one</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </RevealScope>
  );
}
