import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Palette } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BuyBox } from "@/components/BuyBox";
import { ExpandableText } from "@/components/ExpandableText";
import { Gallery } from "@/components/Gallery";
import { Rail } from "@/components/Rail";
import { getAllProducts, getProduct, toCard } from "@/lib/catalog";
import { SITE, slugify, thumb } from "@/lib/format";

export const revalidate = 600;
// Pages are rendered on first visit and then served from cache (ISR) — keeps builds fast with 790+ products.
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  return {
    title: p.name,
    description: (p.shortDescription || p.description).slice(0, 160),
    openGraph: { title: p.name, images: p.images[0] ? [{ url: thumb(p.images[0]) }] : [] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();
  const all = await getAllProducts();
  const related = all.filter((x) => x.subcategory === p.subcategory && x.id !== p.id).slice(0, 10);
  const fromBrand = all.filter((x) => x.brand === p.brand && x.subcategory !== p.subcategory).slice(0, 10);
  const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  // Only show a separate description block when it adds something beyond the summary under the title.
  const showDescription = Boolean(p.description) && !norm(p.description).startsWith((norm(p.shortDescription) || "~"));
  const inside = /hamper|box|tin|tray|set|tote|chest|collection/i.test(p.name) && p.highlights.length > 2;
  const price = p.price ?? (p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : null);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    brand: { "@type": "Brand", name: p.brand },
    sku: p.sku ?? p.id,
    image: p.images.map((i) => SITE.url + i),
    description: p.description,
    ...(price != null && {
      offers: { "@type": "Offer", priceCurrency: "INR", price, availability: "https://schema.org/InStock", url: `${SITE.url}/product/${p.slug}` },
    }),
  };

  return (
    <div className="container-x pb-10 pt-4 sm:pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs items={[["Home", "/"], [p.category, `/category/${slugify(p.category)}`], [p.subcategory, `/category/${slugify(p.category)}?sub=${slugify(p.subcategory)}`], [p.name]]} />
      <div className="mt-4 grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        <Gallery images={p.images} alt={p.name} />
        <div>
          <Link href={`/brand/${slugify(p.brand)}`} className="eyebrow hover:underline">
            {p.brand}
          </Link>
          <h1 className="h-display mt-2 text-[27px] font-semibold leading-[1.15] tracking-tight sm:text-[36px]">{p.name}</h1>
          <p className="mt-2 text-[12.5px] tracking-wide text-muted">
            {p.subcategory}
            {p.sku && <> · Code {p.sku}</>}
          </p>
          {p.shortDescription && norm(p.shortDescription) !== norm(p.name) && (
            <div className="mt-4">
              <ExpandableText text={p.shortDescription} lines={3} className="text-[15.5px] leading-[1.7] text-ink-soft" />
            </div>
          )}
          <div className="mt-6">
            <BuyBox p={p} />
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-10 border-t border-line pt-10 lg:mt-16 lg:grid-cols-[1fr_400px] lg:gap-16">
        <div className="space-y-10">
          {showDescription && (
            <section>
              <h2 className="section-label">About this product</h2>
              <p className="mt-4 max-w-[62ch] whitespace-pre-line text-[16px] leading-[1.8] text-ink-soft">{p.description}</p>
            </section>
          )}
          {p.highlights.length > 0 && (
            <section>
              <h2 className="section-label">{inside ? "What's inside" : "Key features"}</h2>
              <ul className="mt-4 grid gap-x-10 sm:grid-cols-2">
                {p.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-3 border-b border-line/70 py-3 text-[15px] leading-snug text-ink">
                    <span className="mt-[7px] size-1.5 shrink-0 rotate-45 bg-gold" aria-hidden />
                    {h}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {!showDescription && !p.highlights.length && <p className="text-[16px] leading-[1.8] text-ink-soft">{p.description || p.shortDescription}</p>}
        </div>

        <aside className="space-y-6">
          <section>
            <h2 className="section-label">Specifications</h2>
            <dl className="mt-4 overflow-hidden rounded-lg border border-line bg-white">
              {[["Brand", p.brand], ...p.specs.map((s) => [s.label, s.value])].map(([k, v], i) => (
                <div key={k + i} className={`grid grid-cols-[42%_1fr] gap-4 px-5 py-3.5 text-[14px] ${i % 2 ? "bg-cream/60" : ""}`}>
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="rounded-lg border-l-4 border-gold bg-white px-5 py-5">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold">
              <Palette size={17} className="text-gold" /> Add your company logo
            </h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-muted">Laser engraving, screen, UV or DTF printing and custom sleeves for employee and client gifting.</p>
            <Link href="/corporate-gifting" className="mt-3 inline-block text-sm font-semibold text-maroon">
              Request a bulk quote →
            </Link>
          </section>
        </aside>
      </div>

      <Rail eyebrow="You may also like" title="Similar products" href={`/category/${slugify(p.category)}?sub=${slugify(p.subcategory)}`} items={related.map(toCard)} />
      <Rail eyebrow={p.brand} title={`More from ${p.brand}`} href={`/brand/${slugify(p.brand)}`} items={fromBrand.map(toCard)} />
    </div>
  );
}
