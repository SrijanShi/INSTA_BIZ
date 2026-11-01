import { Chat } from "@/components/home/Chat";
import { Dusk } from "@/components/home/Dusk";
import { Hero } from "@/components/home/Hero";
import { HomeCta } from "@/components/home/HomeCta";
import { Meet } from "@/components/home/Meet";
import { Night } from "@/components/home/Night";
import { Passport } from "@/components/home/Passport";
import { Paths } from "@/components/home/Paths";
import { PupJourney } from "@/components/home/PupJourney";
import { RevealScope } from "@/components/RevealScope";
import { getAvailableBreeds, getAvailablePuppies, getFamilyPhotos, getFaqs, getSection } from "@/lib/content";
import { site, siteUrl, testimonial } from "@/lib/site";

function StoreJsonLd() {
  const url = siteUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "PetStore",
    name: site.name,
    description: site.about,
    url,
    logo: `${url}/brand/logo.png`,
    image: `${url}/brand/logo.png`,
    telephone: site.phoneHref.replace("tel:", ""),
    email: site.email,
    address: { "@type": "PostalAddress", streetAddress: site.address, addressLocality: "Dubai", addressCountry: "AE" },
    sameAs: site.socials.map((s) => s.href),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function HomePage() {
  const puppies = getAvailablePuppies();
  const journey = getSection("journey");
  const imported = puppies.find((p) => p.collections.some((c) => c.slug === "korean-teacup")) ?? puppies[0];
  // Captioned family photos lead the home page wall.
  const photos = getFamilyPhotos();
  const wallPhotos = [...photos.filter((p) => p.caption), ...photos.filter((p) => !p.caption)];

  return (
    <RevealScope data-page="home" className="tp-page">
      <StoreJsonLd />
      <Hero friends={puppies} />
      <Meet section={getSection("meet")} puppies={puppies} />
      <Paths showroom={journey.media[0]} imported={imported} />
      <Chat section={journey} breeds={getAvailableBreeds()} />
      <Passport />
      <Dusk section={getSection("families")} photos={wallPhotos} testimonial={testimonial} />
      <Night faqs={getFaqs().slice(0, 3)} />
      <HomeCta waiting={puppies[0]} />
      <PupJourney />
    </RevealScope>
  );
}
