import Link from "next/link";
import { BadgeCheck, Building2, CreditCard, Gift, Palette, Truck } from "lucide-react";
import { HeroCarousel, type Slide } from "@/components/HeroCarousel";
import { Rail } from "@/components/Rail";
import { getBrands, getCards, getCategories } from "@/lib/catalog";
import { whatsappLink } from "@/lib/format";
import type { ProductCard } from "@/lib/types";

export const revalidate = 600;

const SLIDES: Slide[] = [
  {
    image: "/catalog/smoor/smoor-p1.webp",
    eyebrow: "Diwali 2026 · SMOOR",
    title: "United Diwali, beautifully gifted",
    text: "Couverture pralines, baklava, truffles and luxe hampers from SMOOR's festive collection.",
    cta: "Shop SMOOR Diwali",
    href: "/brand/smoor",
    tone: "bg-[#f4e6cf] text-ink",
  },
  {
    image: "/catalog/unwrap-banners/unwb-p1.webp",
    eyebrow: "Corporate & luxury hampers",
    title: "Gather, gift, celebrate",
    text: "40+ curated hampers and gift boxes from Unwrap Happiness — customisable with your brand.",
    cta: "Explore hampers",
    href: "/category/festive-hampers-gift-boxes",
    tone: "bg-[#ece6d6] text-ink",
  },
  {
    image: "/catalog/lifelong-banners/llb-p1.webp",
    eyebrow: "Lifelong · 240+ products",
    title: "Built for better living",
    text: "Air fryers, mixers, cast-iron cookware, massagers, treadmills and more — with brand warranty.",
    cta: "Shop appliances",
    href: "/brand/lifelong",
    tone: "bg-[#f1e4dc] text-ink",
  },
  {
    image: "/catalog/tamta-banners/tamb-p31.webp",
    eyebrow: "Tamta · 99% pure copper",
    title: "Copper. Care. Class.",
    text: "Hand-crafted, hammered, etched and Meena copper bottles, surais and combo gift sets.",
    cta: "Shop copper",
    href: "/category/copper-collection",
    tone: "bg-[#f3e2c9] text-ink",
  },
  {
    image: "/catalog/hrx/hrx-p2.webp",
    eyebrow: "HRX · SNITCH · Swiss Military",
    title: "Travel gear that moves bold",
    text: "Unbreakable 8-wheel trolleys with 5-year warranty, laptop cabins and duffles.",
    cta: "Shop luggage",
    href: "/category/travel-luggage",
    tone: "bg-[#e9edf1] text-ink",
  },
];

const pick = (cards: ProductCard[], f: (c: ProductCard) => boolean, n = 10) => cards.filter(f).slice(0, n);

export default async function Home() {
  const [cards, categories, brands] = await Promise.all([getCards(), getCategories(), getBrands()]);
  const spread = (f: (c: ProductCard) => boolean, n = 10) => {
    const list = cards.filter(f);
    const step = Math.max(1, Math.floor(list.length / n));
    return list.filter((_, i) => i % step === 0).slice(0, n);
  };

  return (
    <>
      <HeroCarousel slides={SLIDES} />

      {/* trust strip */}
      <div className="border-y border-line bg-white">
        <div className="container-x no-scrollbar flex gap-6 overflow-x-auto py-4 text-[12.5px] font-medium text-ink-soft lg:justify-between">
          {[
            [Truck, "Pan-India delivery"],
            [CreditCard, "UPI · Cards · Amex · EMI"],
            [BadgeCheck, "100% genuine brands"],
            [Palette, "Logo branding available"],
            [Gift, "Gift wrap & message"],
          ].map(([Icon, t]) => {
            const I = Icon as typeof Truck;
            return (
              <span key={t as string} className="flex shrink-0 items-center gap-2">
                <I size={18} className="text-gold" /> {t as string}
              </span>
            );
          })}
        </div>
      </div>

      {/* categories */}
      <section className="container-x mt-10 sm:mt-14">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="eyebrow">Shop by category</p>
            <h2 className="h-display mt-1 text-[26px] font-semibold sm:text-[32px]">Find the perfect gift</h2>
          </div>
          <Link href="/categories" className="text-sm font-semibold text-maroon">
            All categories →
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-x-3 gap-y-5 sm:grid-cols-6 lg:grid-cols-8">
          {categories.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="group text-center">
              <span className="mx-auto block aspect-square w-full max-w-[110px] overflow-hidden rounded-full border-2 border-white bg-white shadow-[var(--shadow-card)] transition group-hover:border-gold">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.image} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-110" />
              </span>
              <span className="mt-2 line-clamp-2 block text-[11.5px] font-medium leading-tight text-ink-soft sm:text-[13px]">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <Rail
        eyebrow="Festive season"
        title="Diwali hampers & gift boxes"
        href="/category/festive-hampers-gift-boxes"
        items={spread((c) => c.category === "Festive Hampers & Gift Boxes" && !!c.price)}
      />

      {/* promo tiles */}
      <section className="container-x mt-12 grid gap-4 sm:mt-16 md:grid-cols-3">
        {[
          { img: "/thumbs/loyka/loyka-p1.webp", t: "LOYKA Diwali", s: "Almond brittles & festive boxes from ₹190", h: "/brand/loyka" },
          { img: "/thumbs/fuzo/fuzo-p1.webp", t: "FUZO Gadgets", s: "Utility turned into identity", h: "/brand/fuzo" },
          { img: "/thumbs/tamta-banners/tamb-p1.webp", t: "Tamta Copper", s: "111 handcrafted pieces", h: "/brand/tamta" },
        ].map((b) => (
          <Link key={b.t} href={b.h} className="group relative flex h-56 items-end overflow-hidden rounded-2xl bg-ink sm:h-72">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.img} alt="" loading="lazy" className="absolute inset-0 size-full object-cover opacity-80 transition duration-700 group-hover:scale-105" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10" />
            <span className="relative p-5 text-white">
              <span className="h-display block text-2xl font-semibold">{b.t}</span>
              <span className="text-sm text-white/80">{b.s}</span>
            </span>
          </Link>
        ))}
      </section>

      <Rail eyebrow="Artisanal" title="Chocolates & gourmet treats" href="/category/gourmet-chocolates" items={spread((c) => c.category === "Gourmet & Chocolates")} />
      <Rail eyebrow="Lifelong" title="Kitchen & home appliances" href="/category/home-kitchen-appliances" items={spread((c) => c.category === "Home & Kitchen Appliances")} />
      <Rail eyebrow="Tamta" title="Pure copper collection" href="/category/copper-collection" items={spread((c) => c.category === "Copper Collection")} />
      <Rail eyebrow="On the go" title="Power banks, chargers & tech" href="/category/mobile-tech-accessories" items={spread((c) => c.category === "Mobile & Tech Accessories" && !!c.price)} />

      {/* corporate */}
      <section className="container-x mt-14 sm:mt-20">
        <div className="relative overflow-hidden rounded-3xl bg-maroon px-6 py-10 text-white sm:px-12 sm:py-14">
          <div className="absolute -right-16 -top-16 size-64 rounded-full border border-white/10" />
          <div className="absolute -bottom-24 right-24 size-72 rounded-full border border-white/10" />
          <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="eyebrow !text-[#e9c98b]">For businesses</p>
              <h2 className="h-display mt-2 text-3xl font-semibold leading-tight sm:text-[42px]">Corporate gifting with your logo, at scale</h2>
              <p className="mt-4 max-w-xl text-white/80">
                Employee welcome kits, Diwali hampers, client gifts and event merchandise. Laser engraving, screen printing, DTF, embroidery and
                custom packaging — with GST invoices and multi-address delivery.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/corporate-gifting" className="btn bg-white text-maroon">
                  <Building2 size={17} /> Request bulk quote
                </Link>
                <a href={whatsappLink("Hi, I'd like a corporate gifting quote.")} target="_blank" rel="noreferrer" className="btn border border-white/30 text-white">
                  WhatsApp us
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              {[
                ["790+", "Products"],
                ["15+", "Premium brands"],
                ["6+", "Print techniques"],
                ["Pan-India", "Delivery"],
              ].map(([a, b]) => (
                <div key={b} className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="h-display text-2xl font-semibold">{a}</p>
                  <p className="text-xs text-white/70">{b}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Rail eyebrow="Workspace" title="Desk gadgets & organisers" href="/category/desk-office" items={spread((c) => c.category === "Desk & Office" && !!c.price)} />
      <Rail eyebrow="Travel" title="Luggage & travel gear" href="/category/travel-luggage" items={pick(cards, (c) => c.category === "Travel & Luggage")} />
      <Rail eyebrow="Stay fit" title="Wellness & fitness" href="/category/health-wellness" items={spread((c) => c.category === "Health & Wellness" || c.category === "Fitness & Sports")} />

      {/* brands */}
      <section className="container-x mt-14 sm:mt-20">
        <p className="eyebrow text-center">Our brands</p>
        <h2 className="h-display mt-1 text-center text-[26px] font-semibold sm:text-[32px]">Genuine products from brands you trust</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          {brands.map((b) => (
            <Link key={b.slug} href={`/brand/${b.slug}`} className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold transition hover:border-maroon hover:text-maroon">
              {b.name} <span className="ml-1 text-xs font-normal text-muted">{b.count}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
