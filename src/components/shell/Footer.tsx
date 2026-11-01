import Image from "next/image";
import Link from "next/link";
import { Twinkles } from "@/components/icons";
import { PupStop } from "@/components/mascot/PupStop";
import { site, whatsappHref } from "@/lib/site";

const EXPLORE = [
  { href: "/puppies", label: "Available puppies" },
  { href: "/gone-home", label: "Gone home" },
  { href: "/happy-families", label: "Happy families" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/how-it-works#delivery", label: "Delivery & collection" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Visit & contact" },
];

// Evaluated at build time; the site is statically generated.
const YEAR = new Date().getFullYear();

const STARS: [number, number, number][] = [
  [6, 18, 12.6],
  [14, 42, 8.4],
  [23, 12, 9.8],
  [31, 30, 7],
  [44, 9, 11.2],
  [52, 36, 7.7],
  [63, 15, 10.5],
  [71, 40, 7],
  [92, 33, 8.4],
];

/** Teddy tucked into a wicker basket under the night sky. */
function Basket() {
  return (
    <div className="tp-basket">
      <svg aria-hidden="true" viewBox="0 0 300 240" className="tp-basket__back">
        <ellipse cx="212" cy="145" rx="96" ry="12" className="tp-basket__hollow" />
        <path d="M116 145 A96 12 0 0 1 308 145" className="tp-basket__rim-line" />
        <path d="M116 145 A96 12 0 0 1 308 145" className="tp-basket__rim" />
      </svg>
      <PupStop
        pose="snug"
        act="basket"
        behind
        lane
        label="Teddy, sitting snug in his basket"
        className="tp-basket__pup"
      />
      <svg aria-hidden="true" viewBox="0 0 300 240" className="tp-basket__front">
        <path
          d="M116 145 C118 180 126 214 138 232 L286 232 C298 214 306 180 308 145 A96 12 0 0 1 116 145 Z"
          className="tp-basket__body"
        />
        <path d="M121 178 Q212 197 303 178 M127 206 Q212 223 297 206" className="tp-basket__weave" />
        <path
          d="M150 164 L158 230 M182 168 L185 232 M212 169 V232 M242 168 L239 232 M274 164 L266 230"
          className="tp-basket__weave tp-basket__weave--stakes"
        />
        <path d="M116 145 A96 12 0 0 0 308 145" className="tp-basket__rim-line" />
        <path d="M116 145 A96 12 0 0 0 308 145" className="tp-basket__rim" />
      </svg>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="tp-footer relative pb-[calc(var(--bar-h)+2rem)] text-milk md:pb-10">
      <svg aria-hidden="true" viewBox="0 0 1440 80" preserveAspectRatio="none" className="tp-footer__hill">
        <path d="M0 80V44c120-30 240-44 360-30s240 46 360 34 240-58 360-46 240 40 360 26v52z" />
      </svg>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-6 h-64 overflow-hidden">
        <Twinkles stars={STARS} />
        <span className="tp-moon" />
      </div>

      <div className="gutter relative mx-auto grid max-w-[110rem] gap-12 pt-20 md:grid-cols-12 md:gap-x-12 md:gap-y-6 md:pt-28">
        <div className="md:col-span-5">
          <p className="font-plush text-big text-honey-soft">Home, at last.</p>
          <p className="mt-5 max-w-md text-milk/80">{site.about}</p>
        </div>
        <div className="order-last md:order-none md:col-span-5 md:col-start-1 md:row-start-2">
          <Basket />
        </div>
        <nav aria-label="Footer" className="md:col-span-3 md:col-start-7 md:row-span-2 md:row-start-1">
          <h2 className="font-scrawl text-lg text-honey">Explore</h2>
          <ul className="mt-4 space-y-2.5">
            {EXPLORE.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="font-semibold text-milk/90 underline-offset-4 hover:text-honey hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="md:col-span-3 md:row-span-2 md:row-start-1">
          <h2 className="font-scrawl text-lg text-honey">Say hello</h2>
          <ul className="mt-4 space-y-2.5 text-milk/90">
            <li>
              <a className="font-semibold hover:text-honey" href={whatsappHref()} target="_blank" rel="noopener noreferrer">
                WhatsApp {site.phone}
              </a>
            </li>
            <li>
              <a className="break-all hover:text-honey" href={`mailto:${site.email}`}>
                {site.email}
              </a>
            </li>
            <li>{site.address}</li>
          </ul>
          <ul className="mt-6 flex flex-wrap gap-3" aria-label="Social media">
            {site.socials.map((s) => (
              <li key={s.name}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center rounded-full border-2 border-milk/30 px-4 text-sm font-semibold hover:border-honey hover:text-honey"
                >
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="gutter relative mx-auto mt-16 flex max-w-[110rem] flex-col items-start justify-between gap-4 border-t border-milk/15 pt-6 text-sm text-milk/60 md:flex-row md:items-center">
        <span className="flex items-center gap-3">
          <Image src="/brand/logo.png" alt="" width={36} height={36} className="size-9" />© {YEAR}{" "}
          {site.name}
        </span>
        <span className="font-scrawl text-base text-honey/80">{site.tagline}</span>
      </div>
    </footer>
  );
}

/** Sticky WhatsApp / Call bar on phones. */
export function MobileBar() {
  return (
    <div
      data-whatsapp-bar="true"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-cocoa bg-milk px-3 pb-[calc(0.6rem+env(safe-area-inset-bottom))] pt-2.5 md:hidden"
    >
      <div className="mx-auto flex max-w-md gap-2">
        <a
          href={whatsappHref()}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-whatsapp !min-h-12 flex-1 !shadow-none"
        >
          WhatsApp us
        </a>
        <a href={site.phoneHref} className="btn btn-ghost !min-h-12 !px-5">
          Call
        </a>
      </div>
    </div>
  );
}
