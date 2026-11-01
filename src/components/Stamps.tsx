import type { CSSProperties, ReactNode } from "react";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export type Stamp = {
  title: string;
  text: string;
  shape: "round" | "ticket" | "oval" | "scallop";
  ink: string;
  tilt: number;
  icon: ReactNode;
};

/** The four reasons families trust TeddyPups, as passport stamps. */
export const TRUST_STAMPS: Stamp[] = [
  {
    title: "Vet-checked & healthy",
    text: "Every puppy comes vaccinated, dewormed, and with a verified health certificate.",
    shape: "round",
    ink: "#a24a1a",
    tilt: -8,
    icon: (
      <>
        <path d="M32 54C16 43 8 34 8 24c0-7 5.4-12 12-12 5 0 9 3 12 7 3-4 7-7 12-7 6.6 0 12 5 12 12 0 10-8 19-24 30z" {...stroke} />
        <path d="M22 30h7l3-7 4 13 3-6h7" {...stroke} />
      </>
    ),
  },
  {
    title: "Korea to Dubai, safely",
    text: "Trusted breeders, safe travel, and premium care from start to finish.",
    shape: "ticket",
    ink: "#1f6b45",
    tilt: 5,
    icon: (
      <>
        <path d="M6 36l22-3 12-17h6l-6 17 12-1 6-7h3l-2 10 2 10h-3l-6-7-12-1 6 17h-6L28 37 6 36z" {...stroke} />
        <path d="M8 50c10 4 20 4 30 0" {...stroke} strokeDasharray="2 7" />
      </>
    ),
  },
  {
    title: "Support 24/7",
    text: "Always here to help, from choosing your puppy to post-delivery support.",
    shape: "oval",
    ink: "#5a3a28",
    tilt: -4,
    icon: (
      <>
        <path d="M10 14h44v28H30l-12 10v-10h-8z" {...stroke} />
        <path d="M22 28h0M32 28h0M42 28h0" {...stroke} strokeWidth={5} />
      </>
    ),
  },
  {
    title: "Trusted by families worldwide",
    text: "Puppies delivered to loving homes all around the world.",
    shape: "scallop",
    ink: "#c2622b",
    tilt: 7,
    icon: (
      <>
        <circle cx="32" cy="32" r="22" {...stroke} />
        <path d="M10 32h44M32 10c-8 8-8 36 0 44M32 10c8 8 8 36 0 44" {...stroke} />
      </>
    ),
  },
];

/** One inked stamp with its caption. */
export function StampEntry({ stamp, index }: { stamp: Stamp; index: number }) {
  return (
    <li className="tp-entry" style={{ "--ink-stamp": stamp.ink, "--tilt": `${stamp.tilt}deg`, "--i": index } as CSSProperties}>
      <span className={`tp-stamp tp-stamp--${stamp.shape}`}>
        <svg viewBox="0 0 64 64" className="tp-stamp__icon" aria-hidden="true">
          {stamp.icon}
        </svg>
        <span className="tp-stamp__title font-plush">{stamp.title}</span>
      </span>
      <p className="tp-entry__text">{stamp.text}</p>
    </li>
  );
}
