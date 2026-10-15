import type { Metadata } from "next";
import Link from "next/link";
import { getBrands } from "@/lib/catalog";

export const revalidate = 600;
export const metadata: Metadata = { title: "Brands" };

export default async function BrandsPage() {
  const brands = await getBrands();
  return (
    <div className="container-x py-8">
      <h1 className="h-display text-3xl font-semibold sm:text-4xl">Our brands</h1>
      <p className="mt-1 text-sm text-muted">100% genuine products sourced directly from brand partners.</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {brands.map((b) => (
          <Link
            key={b.slug}
            href={`/brand/${b.slug}`}
            className="card grid aspect-[3/2] place-items-center p-4 text-center transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]"
          >
            <span>
              <span className="h-display block text-lg font-semibold">{b.name}</span>
              <span className="text-xs text-muted">{b.count} products</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
