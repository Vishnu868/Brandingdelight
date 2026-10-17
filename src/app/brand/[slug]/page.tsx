import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Listing } from "@/components/Listing";
import { packCards } from "@/lib/pack";
import { ListingSkeleton } from "@/components/ListingSkeleton";
import { getBrands, getCards } from "@/lib/catalog";

export const revalidate = 600;

export async function generateStaticParams() {
  return (await getBrands()).map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const b = (await getBrands()).find((x) => x.slug === slug);
  return b ? { title: `${b.name} products`, description: `Shop ${b.count} genuine ${b.name} products at BrandingDelight.` } : {};
}

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = (await getBrands()).find((b) => b.slug === slug);
  if (!brand) notFound();
  const cards = (await getCards()).filter((c) => c.brand === brand.name);
  return (
    <div className="container-x py-6 sm:py-8">
      <Breadcrumbs items={[["Home", "/"], ["Brands", "/brands"], [brand.name]]} />
      <h1 className="h-display mt-3 text-3xl font-semibold sm:text-4xl">{brand.name}</h1>
      <p className="mb-6 mt-1 text-sm text-muted">{brand.count} products</p>
      <Suspense fallback={<ListingSkeleton title={false} />}>
        <Listing data={packCards(cards)} />
      </Suspense>
    </div>
  );
}
