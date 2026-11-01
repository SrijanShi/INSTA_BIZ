import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { PawIcon } from "@/components/icons";
import { PupBuddy } from "@/components/mascot/PupBuddy";
import { MediaImage } from "@/components/MediaImage";
import { PuppyGallery } from "@/components/puppy/PuppyGallery";
import { StoryRibbon } from "@/components/puppy/StoryRibbon";
import { RevealScope } from "@/components/RevealScope";
import { enquiryLabel, getAllPuppies, getPuppy, hasVideo, whereLabel, type Puppy } from "@/lib/content";
import { siteUrl, whatsappHref } from "@/lib/site";

export function generateStaticParams() {
  return getAllPuppies().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/puppies/[slug]">): Promise<Metadata> {
  const pup = getPuppy((await params).slug);
  if (!pup) return {};
  const origin = pup.origin?.slug === "local" ? "in our Dubai showroom" : "imported";
  return {
    title: `${pup.displayName}, ${pup.breed} puppy`,
    description:
      pup.seoDescription ||
      `Meet ${pup.displayName}: ${pup.name ? `${pup.breed}, ` : ""}${pup.genderLabel.toLowerCase()}, ${pup.age} old, ${origin}. Real photos${hasVideo(pup) ? " and video" : ""} from TeddyPups U.A.E.`,
    alternates: { canonical: `/puppies/${pup.slug}` },
    openGraph: { images: [pup.cover.url] },
  };
}

const PROMISES = [
  "Vaccinated",
  "Dewormed",
  "Verified health certificate from licensed vets",
  "Thoroughly checked before joining your family",
];

/** How an imported or a showroom puppy comes home. */
const WAY_HOME = {
  imported: {
    title: "Coming home from abroad",
    steps: [
      ["Reserve your puppy", "Tell us which puppy has captured your heart."],
      ["Personalized consultation", "We finalize details with you and share updates on your puppy's journey."],
      ["Import and arrival", "We manage health checks, travel arrangements, and documentation."],
      ["Welcome home", "We help your new puppy settle in and ensure a smooth transition into your home."],
    ],
  },
  local: {
    title: "Coming home from our showroom",
    steps: [
      ["Visit our showroom", "Come and meet the puppy in Downtown Dubai — spend time bonding before you decide."],
      ["Ask us anything", "Our team shares health records and answers every question on the spot or on WhatsApp."],
      ["Take them home", "Local puppies are available immediately, so you can go home together the same day."],
      ["Welcome home", "We help your new puppy settle in and ensure a smooth transition into your home."],
    ],
  },
} as const;

function Chapter({ n, children }: { n: number; children: ReactNode }) {
  return (
    <p className="tp-chapter">
      <span aria-hidden="true" className="tp-chapter__n font-plush">
        {n}
      </span>
      <span className="font-scrawl">{children}</span>
    </p>
  );
}

/** Previous / next puppy in the same list (available or gone home). */
function Neighbours({ pup }: { pup: Puppy }) {
  const list = getAllPuppies().filter((p) => p.status === pup.status);
  if (list.length < 2) return null;
  const i = list.findIndex((p) => p.slug === pup.slug);
  const links = [
    { label: "Previous pup", p: list[(i - 1 + list.length) % list.length] },
    { label: "Next pup", p: list[(i + 1) % list.length] },
  ];
  return (
    <nav aria-label="More puppies" className="mt-16 grid gap-4 sm:grid-cols-2">
      {links.map(({ label, p }) => (
        <Link
          key={label}
          href={`/puppies/${p.slug}`}
          className="group flex items-center gap-5 rounded-[2rem] border-[3px] border-cocoa bg-milk p-4 transition-transform duration-500 hover:-rotate-1 sm:last:flex-row-reverse sm:last:text-right"
        >
          <span className="relative h-24 w-20 shrink-0 overflow-hidden rounded-[999px_999px_0.6rem_0.6rem] border-[3px] border-cocoa bg-honey-soft">
            <MediaImage media={p.cover} sizes="80px" />
          </span>
          <span>
            <span className="font-scrawl block text-sm text-cocoa-soft">{label}</span>
            <span className="font-plush text-[1.6rem]">{p.displayName}</span>
          </span>
        </Link>
      ))}
    </nav>
  );
}

export default async function PuppyPage({ params }: PageProps<"/puppies/[slug]">) {
  const pup = getPuppy((await params).slug);
  if (!pup) notFound();

  const gone = pup.status === "gone-home";
  const url = `${siteUrl()}/puppies/${pup.slug}`;
  const named = !!pup.name;
  const ask = gone
    ? whatsappHref(`Hi TeddyPups! I loved ${pup.displayName} (${url}). Do you have a puppy like them?`)
    : whatsappHref(
        named
          ? `Hi TeddyPups! I'm interested in ${pup.displayName}, the ${pup.breed}: ${url}`
          : `Hi TeddyPups! I'm interested in the ${pup.displayName} (${pup.genderLabel.toLowerCase()}): ${url}`,
      );
  const askLabel = gone ? "Ask about a puppy like this" : named ? `Ask about ${pup.displayName} on WhatsApp` : "Ask about this puppy on WhatsApp";
  const letterTitle = gone ? "Looking for a puppy like this?" : named ? `Ask about ${pup.displayName}` : "Ask about this puppy";
  const wayHome = WAY_HOME[pup.origin?.slug === "local" ? "local" : "imported"];
  const facts = [
    ["Breed", pup.breed],
    ["Boy or girl", pup.genderLabel],
    ["Age", pup.age],
    ["Colour", pup.colour],
    ["Where", whereLabel(pup)],
  ].filter(([, value]) => value);

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Puppies", item: `${siteUrl()}/puppies` },
      { "@type": "ListItem", position: 2, name: pup.displayName, item: url },
    ],
  };

  return (
    <RevealScope data-page="pup" className="tp-page">
      <article
        className="tp-storybook"
        style={{ background: `linear-gradient(180deg, color-mix(in oklab, ${pup.cover.color} 24%, var(--color-milk)) 0, var(--color-milk) 85%)` }}
      >
        <StoryRibbon />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
        <div className="gutter mx-auto max-w-[110rem] pb-20 pt-8 md:pt-12">
          <nav aria-label="Breadcrumb" className="text-[0.95rem] font-semibold text-cocoa-soft">
            <Link href={gone ? "/gone-home" : "/puppies"} className="link-ink">
              {gone ? "Gone home" : "Available puppies"}
            </Link>
            <span aria-hidden="true"> / </span>
            <span aria-current="page">{pup.displayName}</span>
          </nav>
          <Chapter n={1}>{gone ? "the day they went home" : "hello, it's me"}</Chapter>

          <div className="mt-4 grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="min-w-0 lg:col-span-7">
              <PuppyGallery name={pup.displayName} media={pup.media} />
            </div>
            <div className="min-w-0 lg:col-span-5">
              <div className="lg:sticky lg:top-[calc(var(--header-h)+5.5rem)]">
                <div className="tp-tag tp-board mt-16 !rounded-[2.2rem_2.2rem_2.2rem_0.6rem] !p-7 md:!p-9 lg:mt-20" data-reveal>
                  <span aria-hidden="true" className="tp-tag__ring" />
                  <PupBuddy
                    pose="peek"
                    className="absolute -top-[4.8rem] right-6 w-[9.5rem]"
                    label={`Teddy, peeking over ${pup.displayName}'s tag`}
                  />
                  {gone ? (
                    <span className="inline-grid place-items-center rounded-full border-[3px] border-current px-3 py-1 font-scrawl text-sm uppercase tracking-wide -rotate-6 text-toffee-deep">
                      Gone home ♥
                    </span>
                  ) : (
                    <span className="chip">
                      <PawIcon className="size-4 text-toffee" />
                      Available
                    </span>
                  )}
                  <h1 className="font-plush mt-4 text-[clamp(2.6rem,5vw,4.6rem)]">{pup.displayName}</h1>
                  {named && <p className="mt-2 text-lg font-semibold text-cocoa-soft">{pup.breed}</p>}
                  <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4">
                    {facts.map(([label, value]) => (
                      <div key={label}>
                        <dt className="font-scrawl text-sm text-cocoa-soft">{label}</dt>
                        <dd className="mt-0.5 text-[1.05rem] font-semibold">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  {pup.description && <p className="mt-6 whitespace-pre-line text-cocoa-soft">{pup.description}</p>}
                  <div className="mt-8 flex flex-col gap-3">
                    <a href={ask} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                      {askLabel}
                    </a>
                    <a href={`#enquire-${pup.slug}`} className="btn btn-ghost">
                      Send an enquiry
                    </a>
                  </div>
                </div>
                <div className="tp-paper mt-8 -rotate-1">
                  <Chapter n={2}>what comes with {named ? pup.displayName : `this ${pup.displayName}`}</Chapter>
                  <h2 className="font-plush mt-1 text-[1.9rem]">Every Teddy Pup comes</h2>
                  <ul className="mt-4 space-y-2.5">
                    {PROMISES.map((promise) => (
                      <li key={promise} className="flex items-start gap-3 font-semibold">
                        <svg viewBox="0 0 32 32" className="mt-0.5 size-6 shrink-0 text-toffee-deep" aria-hidden="true">
                          <path d="M5 17l7 7L27 8" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {promise}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {!gone && (
            <section aria-labelledby={`home-steps-${pup.slug}`} className="mt-20">
              <Chapter n={3}>the way home</Chapter>
              <h2 id={`home-steps-${pup.slug}`} className="font-plush text-big mt-3">
                {wayHome.title}
              </h2>
              <ol className="tp-trail tp-trail--row tp-trail--paws mt-10">
                {wayHome.steps.map(([title, text], i) => (
                  <li key={title}>
                    <span aria-hidden="true" className="tp-trail__num font-plush">
                      {i + 1}
                    </span>
                    <h3 className="font-plush-text text-xl font-bold leading-tight">{title}</h3>
                    <p className="mt-2 max-w-[38ch] text-cocoa-soft">{text}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section
            id={`enquire-${pup.slug}`}
            aria-labelledby={`enquire-title-${pup.slug}`}
            className="tp-letter mt-20 grid gap-10 lg:grid-cols-12"
          >
            <span aria-hidden="true" className="tp-letter__stamp">
              <PawIcon className="size-9" />
            </span>
            <div className="lg:col-span-4">
              <Chapter n={gone ? 3 : 4}>dear TeddyPups…</Chapter>
              <h2 id={`enquire-title-${pup.slug}`} className="font-plush text-big mt-2">
                {letterTitle}
              </h2>
              <p className="mt-4 text-cocoa-soft">
                Leave your details and our team will get back to you promptly — or message us on WhatsApp for the quickest
                reply.
              </p>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <EnquiryForm puppy={{ id: pup.id, label: enquiryLabel(pup) }} whatsappHref={ask} />
            </div>
          </section>

          <Neighbours pup={pup} />
        </div>
      </article>
    </RevealScope>
  );
}
