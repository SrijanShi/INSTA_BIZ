import Link from "next/link";
import { SparkleIcon, Twinkles } from "@/components/icons";
import { PupStop } from "@/components/mascot/PupStop";
import { Scene, tones } from "@/components/Scene";
import type { Faq } from "@/lib/content";

const STARS: [number, number, number][] = [
  [8, 12, 16.2],
  [22, 30, 9],
  [41, 8, 12.6],
  [57, 22, 8.1],
  [72, 6, 14.4],
  [88, 18, 10.8],
  [95, 42, 9],
  [4, 58, 10.8],
  [34, 70, 7.2],
  [63, 84, 9.9],
  [83, 66, 12.6],
];

/** Night falls: the first few FAQs under the stars, with a puzzled Teddy. */
export function Night({ faqs }: { faqs: Faq[] }) {
  return (
    <Scene tone={tones.night} className="tp-night" aria-labelledby="questions-title">
      <Twinkles stars={STARS} className="pointer-events-none tp-night__stars" />
      <div className="tp-night__grid gutter">
        <div className="tp-night__intro">
          <h2 id="questions-title" className="font-plush text-huge">
            Questions, answered
          </h2>
          <Link className="btn btn-ghost tp-night__cta" href="/faq">
            Read all questions
          </Link>
          <div className="tp-night__pup">
            <span aria-hidden="true" className="tp-night__wonder font-plush">
              ?
            </span>
            <PupStop pose="sit" act="tilt" className="tp-night__teddy" />
          </div>
        </div>
        <dl className="tp-night__list">
          {faqs.map((faq, i) => (
            <div key={faq.id} className="tp-qa" data-pup-look={i < 2 ? "" : undefined}>
              <dt className="font-plush tp-qa__q">
                <SparkleIcon className="tp-qa__star" />
                {faq.question}
              </dt>
              <dd className="tp-qa__a">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Scene>
  );
}
