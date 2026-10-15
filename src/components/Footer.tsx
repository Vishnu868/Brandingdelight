"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { PaymentBadges } from "./PaymentBadges";
import { SITE, whatsappLink } from "@/lib/format";
import type { Category } from "@/lib/types";

export function Footer({ categories }: { categories: Category[] }) {
  const path = usePathname();
  if (path.startsWith("/admin")) return null;
  return (
    <footer className="mt-16 bg-ink text-white/70">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">
            India&apos;s premium gifting marketplace — curated brands, festive hampers and corporate merchandise with custom branding, delivered
            pan-India from Hyderabad.
          </p>
          <ul className="mt-5 space-y-2 text-sm">
            <li>
              <a href={`tel:${SITE.phoneRaw}`} className="flex items-center gap-2 hover:text-white">
                <Phone size={15} /> {SITE.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${SITE.email}`} className="flex items-center gap-2 hover:text-white">
                <Mail size={15} /> {SITE.email}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={15} /> {SITE.address}
            </li>
          </ul>
          <a href={whatsappLink("Hi BrandingDelight, I have a query.")} target="_blank" rel="noreferrer" className="btn mt-5 bg-[#25D366] text-white">
            Chat on WhatsApp
          </a>
        </div>
        <FooterCol title="Shop" links={categories.slice(0, 8).map((c) => [c.name, `/category/${c.slug}`])} />
        <FooterCol
          title="Help"
          links={[
            ["My Account", "/account"],
            ["Track Order", "/account"],
            ["Shipping Policy", "/policies/shipping"],
            ["Returns & Refunds", "/policies/returns"],
            ["FAQs", "/faq"],
            ["Contact Us", "/contact"],
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            ["About Us", "/about"],
            ["Corporate Gifting", "/corporate-gifting"],
            ["All Brands", "/brands"],
            ["Privacy Policy", "/policies/privacy"],
            ["Terms & Conditions", "/policies/terms"],
          ]}
        />
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-4 py-6 text-xs md:flex-row">
          <p>© {new Date().getFullYear()} BrandingDelight. All rights reserved. Made with care in Hyderabad.</p>
          <PaymentBadges dark />
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[][] }) {
  return (
    <div>
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold">{title}</p>
      <ul className="space-y-2.5 text-sm">
        {links.map(([l, h]) => (
          <li key={l}>
            <Link href={h} className="hover:text-white">
              {l}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
