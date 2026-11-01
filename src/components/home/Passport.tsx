import { PupStop } from "@/components/mascot/PupStop";
import { Scene, tones } from "@/components/Scene";
import { StampEntry, TRUST_STAMPS } from "@/components/Stamps";

/** "Why families trust TeddyPups" as an open puppy passport at sunset. */
export function Passport() {
  return (
    <Scene tone={tones.passport} className="tp-passport" aria-labelledby="trust-title">
      <div className="gutter mx-auto max-w-[96rem]">
        <div className="tp-book">
          <div className="tp-book__page tp-book__page--left">
            <p aria-hidden="true" className="tp-book__kicker font-scrawl">
              puppy passport
            </p>
            <h2 id="trust-title" className="font-plush tp-book__title">
              Why families trust TeddyPups
            </h2>
            <PupStop pose="sit" className="tp-book__teddy" />
          </div>
          <ul className="tp-book__page tp-book__page--right">
            {TRUST_STAMPS.map((stamp, i) => (
              <StampEntry key={stamp.title} stamp={stamp} index={i} />
            ))}
          </ul>
        </div>
      </div>
    </Scene>
  );
}
