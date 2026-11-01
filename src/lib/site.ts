/** Business details shared by the header, footer, contact page and metadata. */
export const site = {
  name: "TeddyPups U.A.E.",
  shortName: "TeddyPups",
  tagline: "every puppy is family",
  title: "TeddyPups U.A.E. — Premium teacup puppies in Dubai",
  description:
    "Teddy bear and teacup puppies in Dubai. Meet local puppies in our Downtown Dubai showroom or bring home a rare breed imported from trusted breeders.",
  about:
    "TeddyPups U.A.E. is a Dubai-based brand specializing in miniature puppies, offering premium services and worldwide shipping.",
  phone: "+971 54 167 6733",
  phoneHref: "tel:+971541676733",
  whatsappNumber: "971541676733",
  whatsappGreeting: "Hi TeddyPups! I'd love to know more about your puppies.",
  email: "teddypupsadmin@gmail.com",
  address: "Downtown Dubai, United Arab Emirates",
  socials: [
    { name: "Instagram", href: "https://www.instagram.com/teddypups.worldwide/" },
    { name: "TikTok", href: "https://www.tiktok.com/@teddypupsuae" },
    { name: "Facebook", href: "https://www.facebook.com/profile.php?id=61567496944539" },
  ],
} as const;

/** Featured on the home page and the happy families wall. */
export const testimonial = {
  quote:
    "TeddyPups truly made our dream a reality. They supported us at every step of the import journey. Our Maltipoo arrived healthy, cheerful, and absolutely perfect. Having 24/7 support throughout the process gave us complete peace of mind.",
  author: "Sarah M.",
  location: "Dubai, UAE",
};

export const nav = [
  { href: "/", label: "Home" },
  { href: "/puppies", label: "Puppies" },
  { href: "/happy-families", label: "Happy families" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Visit & contact" },
] as const;

/** A wa.me link that opens WhatsApp with a pre-written message. */
export function whatsappHref(message: string = site.whatsappGreeting) {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

/** Absolute origin used for canonical URLs, Open Graph and the sitemap. */
export function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}
