import type { Metadata } from "next";
import { BrandCard, toBrandTiles } from "@/components/BrandTiles";
import { getBrands, getCards } from "@/lib/catalog";

export const revalidate = 600;
export const metadata: Metadata = { title: "Brands" };

export default async function BrandsPage() {
  const [brands, cards] = await Promise.all([getBrands(), getCards()]);
  const tiles = toBrandTiles(brands, (n) => cards.find((c) => c.brand === n)?.image);
  return (
    <>
      <section className="bg-ink text-white">
        <div className="container-x py-12 sm:py-16">
          <p className="eyebrow">Our brands</p>
          <h1 className="h-display mt-2 max-w-2xl text-[34px] font-semibold leading-tight sm:text-5xl">Genuine brands, sourced directly</h1>
          <p className="mt-3 max-w-xl text-[15px] text-white/65">Every product comes straight from the brand with full warranty — and most can carry your company logo.</p>
        </div>
      </section>
      <div className="container-x -mt-6 grid grid-cols-2 gap-3 pb-6 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {tiles.map((b, i) => (
          <BrandCard key={b.slug} b={b} className={i === 0 ? "col-span-2 aspect-[16/10] sm:aspect-[3/4] sm:col-span-1" : "aspect-[3/4]"} />
        ))}
      </div>
    </>
  );
}
