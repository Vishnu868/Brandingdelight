import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getCategories, imagePosition } from "@/lib/catalog";

export const revalidate = 600;
export const metadata: Metadata = { title: "All categories" };

/** Mosaic rhythm: a wide feature tile, then pairs — repeats every 5 tiles. */
const isWide = (i: number) => i % 5 === 0;

export default async function CategoriesPage() {
  const cats = await getCategories();
  return (
    <>
      <section className="container-x pb-6 pt-8 sm:pt-12">
        <p className="eyebrow">Shop by category</p>
        <h1 className="h-display mt-2 text-[34px] font-semibold leading-[1.1] sm:text-5xl">What are you gifting?</h1>
        <p className="mt-3 max-w-lg text-[15px] text-muted">From festive hampers to copper, kitchen and travel — browse every collection.</p>
      </section>

      <div className="container-x grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cats.map((c, i) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className={`group relative overflow-hidden rounded-2xl bg-ink ${isWide(i) ? "col-span-2 aspect-[16/10] lg:col-span-2 lg:aspect-auto lg:row-span-2" : "aspect-[4/5]"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.image}
              alt=""
              loading={i < 4 ? "eager" : "lazy"}
              decoding="async"
              style={{ objectPosition: imagePosition(c.image) }}
              className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 sm:p-5">
              <span>
                <span className={`h-display block font-semibold leading-tight text-white ${isWide(i) ? "text-[23px] sm:text-[32px]" : "text-[18px] sm:text-[21px]"}`}>{c.name}</span>
                {isWide(i) && (
                  <span className="mt-1.5 line-clamp-1 block text-[12.5px] text-white/70">{c.subcategories.slice(0, 3).map((s) => s.name).join(" · ")}</span>
                )}
              </span>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition group-hover:bg-white group-hover:text-ink">
                <ArrowUpRight size={17} />
              </span>
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
