import Link from "next/link";
import { MediaImage } from "@/components/MediaImage";
import { PupStop } from "@/components/mascot/PupStop";
import { Scene, tones } from "@/components/Scene";
import type { Puppy } from "@/lib/content";
import { whatsappHref } from "@/lib/site";

/** "Welcome home": a lit doorway with a puppy waiting inside. */
export function HomeCta({ waiting }: { waiting: Puppy }) {
  return (
    <Scene tone={tones.home} className="tp-home" aria-labelledby="cta-title">
      <div className="tp-home__copy gutter">
        <h2 id="cta-title" className="font-plush text-huge">
          Ready to meet your new best friend?
        </h2>
        <p className="tp-home__lede">
          Bring home a healthy, happy teacup or designer puppy with expert guidance every step of the way. We help you
          find the right match and ensure a smooth, safe delivery across the UAE.
        </p>
      </div>
      <div className="tp-house">
        <span aria-hidden="true" className="tp-house__plant tp-house__plant--left" />
        <span aria-hidden="true" className="tp-house__lamp" />
        <div className="tp-house__doorway">
          <span className="tp-house__inside">
            <MediaImage media={waiting.cover} sizes="16rem" alt={`${waiting.displayName}, waiting inside`} />
          </span>
          <span aria-hidden="true" className="tp-house__door">
            <span className="tp-house__peep" />
            <span className="tp-house__knob" />
          </span>
        </div>
        <span aria-hidden="true" className="tp-house__plant tp-house__plant--right" />
        <span aria-hidden="true" className="tp-house__mat font-scrawl">
          welcome home
        </span>
        <PupStop pose="bow" className="tp-house__teddy" />
      </div>
      <div className="tp-home__actions gutter">
        <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
          Enquire on WhatsApp
        </a>
        <Link className="btn btn-ghost tp-home__ghost" href="/contact">
          Visit &amp; contact
        </Link>
      </div>
    </Scene>
  );
}
