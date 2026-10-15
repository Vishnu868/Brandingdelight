import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BRAND_META, BRAND_ORDER } from "@/lib/brands";
import { thumb } from "@/lib/format";
import type { Brand } from "@/lib/types";

export type BrandTile = Brand & { tagline: string; image: string; pos?: string };

/** Attach artwork + tagline to brands and sort by the curated order. */
export function toBrandTiles(brands: Brand[], fallbackImage: (name: string) => string | undefined): BrandTile[] {
  const rank = (n: string) => (BRAND_ORDER.includes(n) ? BRAND_ORDER.indexOf(n) : 999);
  return [...brands]
    .sort((a, b) => rank(a.name) - rank(b.name))
    .map((b) => {
      const m = BRAND_META[b.name];
      return { ...b, tagline: m?.tagline ?? "Shop the collection", image: m?.image ?? thumb(fallbackImage(b.name) ?? "/placeholder.svg"), pos: m?.pos };
    });
}

export function BrandCard({ b, className = "" }: { b: BrandTile; className?: string }) {
  return (
    <Link href={`/brand/${b.slug}`} className={`group relative block overflow-hidden rounded-2xl bg-ink ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={b.image}
        alt=""
        loading="lazy"
        decoding="async"
        style={{ objectPosition: b.pos ?? "50% 50%" }}
        className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      <span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
        <ArrowUpRight size={16} />
      </span>
      <span className="absolute inset-x-0 bottom-0 p-4">
        <span className="h-display block text-[19px] font-semibold leading-tight text-white sm:text-[22px]">{b.name}</span>
        <span className="mt-1 block text-[12px] text-white/70">{b.tagline}</span>
      </span>
    </Link>
  );
}

/** Dark "brand wall" used on the home page: swipe row on phones, grid on desktop. */
export function BrandShowcase({ tiles }: { tiles: BrandTile[] }) {
  return (
    <section className="-mb-16 mt-16 border-b border-white/10 bg-ink py-12 text-white sm:mt-20 sm:py-16">
      <div className="container-x">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Our brands</p>
            <h2 className="h-display mt-2 text-[28px] font-semibold leading-tight sm:text-[38px]">Genuine brands, curated for gifting</h2>
          </div>
          <Link href="/brands" className="hidden shrink-0 text-sm font-semibold text-[#e2c385] sm:block">
            All brands →
          </Link>
        </div>
        <div className="no-scrollbar -mx-4 mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-5">
          {tiles.map((b) => (
            <BrandCard key={b.slug} b={b} className="aspect-[3/4] w-[62%] shrink-0 snap-start sm:w-auto" />
          ))}
        </div>
        <Link href="/brands" className="mt-6 block text-center text-sm font-semibold text-[#e2c385] sm:hidden">
          View all brands →
        </Link>
      </div>
    </section>
  );
}
