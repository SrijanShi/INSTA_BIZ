import type { Metadata, Viewport } from "next";
import { Footer, MobileBar } from "@/components/shell/Footer";
import { Header } from "@/components/shell/Header";
import { PawTrail } from "@/components/shell/PawTrail";
import { RouteCurtain } from "@/components/shell/RouteCurtain";
import { SmoothScroll } from "@/components/shell/SmoothScroll";
import { fontVariables } from "@/lib/fonts";
import { site, siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: site.title, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    title: site.title,
    description: site.description,
    images: ["/brand/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
    images: ["/brand/logo.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fffdf8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <RouteCurtain />
        <a
          href="#main"
          className="sr-only-focusable fixed left-4 top-4 z-[100] rounded-full bg-cocoa px-5 py-3 font-semibold text-milk"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" tabIndex={-1} className="relative pt-[var(--header-h)] outline-none">
          {children}
        </main>
        <Footer />
        <MobileBar />
        <PawTrail />
        <SmoothScroll />
      </body>
    </html>
  );
}
