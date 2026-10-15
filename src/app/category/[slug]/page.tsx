import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Listing } from "@/components/Listing";
import { ListingSkeleton } from "@/components/ListingSkeleton";
import { getCards, getCategories } from "@/lib/catalog";

export const revalidate = 600;

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = (await getCategories()).find((x) => x.slug === slug);
  return c ? { title: c.name, description: `Shop ${c.count} ${c.name.toLowerCase()} at BrandingDelight — genuine brands, custom branding, pan-India delivery.` } : {};
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = (await getCategories()).find((c) => c.slug === slug);
  if (!cat) notFound();
  const cards = (await getCards()).filter((c) => c.category === cat.name);
  return (
    <>
      <div className="relative overflow-hidden bg-sand">
        <div className="container-x relative z-10 py-8 sm:py-12">
          <Breadcrumbs items={[["Home", "/"], ["Categories", "/categories"], [cat.name]]} />
          <h1 className="h-display mt-3 max-w-[70%] text-3xl font-semibold sm:text-[44px]">{cat.name}</h1>
          <p className="mt-1 text-sm text-muted">{cat.count} products</p>
          <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 md:max-w-[70%] md:flex-wrap">
            {cat.subcategories.map((s) => (
              <Link key={s.slug} href={`/category/${cat.slug}?sub=${s.slug}`} className="chip shrink-0" scroll={false}>
                {s.name} <span className="text-muted">{s.count}</span>
              </Link>
            ))}
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cat.image}
          alt=""
          className="absolute right-6 top-1/2 hidden aspect-square h-[85%] -translate-y-1/2 rounded-full border-4 border-white object-cover shadow-[var(--shadow-pop)] md:block"
        />
      </div>
      <div className="container-x py-6">
        <Suspense fallback={<ListingSkeleton title={false} />}>
          <Listing cards={cards} facetBy="subcategory" />
        </Suspense>
      </div>
    </>
  );
}
