import breedsData from "@/content/breeds.json";
import faqsData from "@/content/faqs.json";
import familiesData from "@/content/families.json";
import puppiesData from "@/content/puppies.json";
import sectionsData from "@/content/sections.json";

/** A photo or video, with the focal point and blur placeholder from the CMS. */
export type Media = {
  id: string;
  url: string;
  kind: "image" | "video";
  width: number;
  height: number;
  alt: string;
  caption: string;
  /** 0–1, used as object-position so crops keep the puppy in frame. */
  focalX: number;
  focalY: number;
  /** Dominant colour, shown while the image loads. */
  color: string;
  blurDataUrl: string | null;
  durationS: number | null;
  poster: Media | null;
};

export type Taxon = { slug: string; name: string };

export type Gender = "male" | "female" | "male-female";

export type Puppy = {
  id: string;
  slug: string;
  /** Pet name, empty when the puppy is listed by breed only. */
  name: string;
  displayName: string;
  breed: string;
  gender: Gender;
  genderLabel: string;
  age: string;
  colour: string;
  description: string;
  records: string[];
  status: "available" | "gone-home";
  featured: boolean;
  seoDescription: string;
  cover: Media;
  media: Media[];
  origin: Taxon | null;
  collections: Taxon[];
  breeds: Taxon[];
  /** Gone-home only: where the ticket home was issued. */
  wentHomeFrom?: string;
};

export type Faq = { id: string; question: string; answer: string };

export type Section = {
  key: string;
  heading: string;
  body: string;
  data: Record<string, unknown>;
  media: Media[];
};

const puppies = puppiesData as Puppy[];

export const getAvailablePuppies = () => puppies.filter((p) => p.status === "available");

export const getGoneHomePuppies = () => puppies.filter((p) => p.status === "gone-home");

export const getAllPuppies = () => puppies;

export const getPuppy = (slug: string) => puppies.find((p) => p.slug === slug);

/** Breeds offered as filters, in the CMS order. */
export const getBreeds = () => breedsData as Taxon[];

export const getFamilyPhotos = () => familiesData as Media[];

export const getFaqs = () => faqsData as Faq[];

export const getSection = (key: string) => (sectionsData as Record<string, Section>)[key];

/** CSS object-position for a media item's focal point. */
export const focalPosition = (m: Pick<Media, "focalX" | "focalY">) =>
  `${+(m.focalX * 100).toFixed(1)}% ${+(m.focalY * 100).toFixed(1)}%`;

/** "Maltipoo, boy, 3 months" style summary used in labels and cards. */
export function puppySummary(p: Puppy) {
  return [p.name ? p.breed : null, p.genderLabel.toLowerCase(), p.age].filter(Boolean).join(", ");
}

export const hasVideo = (p: Puppy) => p.media.some((m) => m.kind === "video");
