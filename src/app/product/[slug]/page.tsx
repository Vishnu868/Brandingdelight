import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Palette } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BuyBox } from "@/components/BuyBox";
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
          <h1 className="h-display mt-2 text-[26px] font-semibold leading-tight sm:text-[34px]">{p.name}</h1>
          <p className="mt-2 text-xs text-muted">
            {p.sku && <>SKU: {p.sku} · </>}
            {p.subcategory}
          </p>
          {p.shortDescription && p.shortDescription !== p.name && <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{p.shortDescription}</p>}
          <div className="mt-6">
            <BuyBox p={p} />
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-5 sm:p-8">
          <h2 className="h-display text-2xl font-semibold">Product details</h2>
          <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">{p.description}</p>
          {p.highlights.length > 0 && (
            <>
              <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted">{/hamper|box|tin|tray|set/i.test(p.name) ? "What's inside" : "Highlights"}</h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {p.highlights.map((h) => (
                  <li key={h} className="flex gap-2 text-[14px]">
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-success" /> {h}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
        <div className="space-y-6">
          {p.specs.length > 0 && (
            <section className="card p-5 sm:p-6">
              <h2 className="h-display text-xl font-semibold">Specifications</h2>
              <dl className="mt-3 divide-y divide-line text-sm">
                {[["Brand", p.brand], ["Category", p.subcategory], ...p.specs.map((s) => [s.label, s.value])].map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[40%_1fr] gap-3 py-2.5">
                    <dt className="text-muted">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          <section className="card !bg-gold-soft p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Palette size={18} className="text-gold" /> Custom branding available
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              Add your company logo by laser engraving, screen printing, UV / DTF printing or custom sleeves. Ideal for employee gifts, client hampers and events.
            </p>
            <Link href="/corporate-gifting" className="mt-3 inline-block text-sm font-semibold text-maroon">
              Request a bulk quote →
            </Link>
          </section>
        </div>
      </div>

      <Rail eyebrow="You may also like" title="Similar products" href={`/category/${slugify(p.category)}?sub=${slugify(p.subcategory)}`} items={related.map(toCard)} />
      <Rail eyebrow={p.brand} title={`More from ${p.brand}`} href={`/brand/${slugify(p.brand)}`} items={fromBrand.map(toCard)} />
    </div>
  );
}
