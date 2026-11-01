import type { MetadataRoute } from "next";
import { getAllPuppies } from "@/lib/content";
import { siteUrl } from "@/lib/site";

const PAGES = ["", "/puppies", "/happy-families", "/gone-home", "/how-it-works", "/faq", "/contact"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    ...PAGES.map((path) => ({ url: `${base}${path}`, changeFrequency: "weekly" as const, priority: path ? 0.8 : 1 })),
    ...getAllPuppies().map((p) => ({
      url: `${base}/puppies/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: p.status === "available" ? 0.7 : 0.4,
    })),
  ];
}
