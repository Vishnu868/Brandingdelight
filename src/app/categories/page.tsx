import type { Metadata } from "next";
import Link from "next/link";
import { getCategories } from "@/lib/catalog";

export const revalidate = 600;
export const metadata: Metadata = { title: "All categories" };

export default async function CategoriesPage() {
  const cats = await getCategories();
  return (
    <div className="container-x py-8">
      <h1 className="h-display text-3xl font-semibold sm:text-4xl">All categories</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cats.map((c) => (
          <div key={c.slug} className="card flex gap-4 p-4">
            <Link href={`/category/${c.slug}`} className="size-24 shrink-0 overflow-hidden rounded-xl bg-sand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.image} alt="" loading="lazy" className="size-full object-cover" />
            </Link>
            <div className="min-w-0">
              <Link href={`/category/${c.slug}`} className="h-display text-lg font-semibold hover:text-maroon">
                {c.name}
              </Link>
              <p className="text-xs text-muted">{c.count} products</p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {c.subcategories.slice(0, 5).map((s) => (
                  <Link key={s.slug} href={`/category/${c.slug}?sub=${s.slug}`} className="text-[12.5px] text-ink-soft hover:text-maroon">
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
