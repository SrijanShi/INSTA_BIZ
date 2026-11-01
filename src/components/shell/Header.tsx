import Image from "next/image";
import Link from "next/link";
import { nav, site, whatsappHref } from "@/lib/site";
import { HeaderBehavior } from "./HeaderBehavior";
import { MobileMenu } from "./MobileMenu";
import { NavLink } from "./NavLink";

export function Header() {
  return (
    <HeaderBehavior>
      <div className="tp-header__bar gutter">
        <Link href="/" className="tp-header__brand" aria-label={`${site.name} — home`}>
          <Image src="/brand/logo.png" alt="" width={56} height={56} className="tp-header__logo" preload />
          <span className="font-plush tp-header__name">{site.shortName}</span>
        </Link>
        <nav aria-label="Main" className="tp-header__nav">
          <ul>
            {nav.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href} label={item.label} className="tp-nav-link" />
              </li>
            ))}
          </ul>
        </nav>
        <div className="tp-header__end">
          <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp tp-header__wa">
            WhatsApp us
          </a>
          <MobileMenu />
        </div>
      </div>
      {/* Scalloped hem along the bottom edge, like a pet bed. */}
      <svg aria-hidden="true" className="tp-header__hem" width="100%" height="14" preserveAspectRatio="none">
        <defs>
          <pattern id="tp-hem" width="44" height="14" patternUnits="userSpaceOnUse">
            <path d="M0 0H44V2A22 11 0 0 1 0 2Z" className="tp-header__hem-fill" />
            <path d="M0 2A22 11 0 0 0 44 2" className="tp-header__hem-line" />
          </pattern>
        </defs>
        <rect width="100%" height="14" fill="url(#tp-hem)" />
      </svg>
    </HeaderBehavior>
  );
}
