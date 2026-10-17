import type { ProductCard } from "./types";

/**
 * Compact wire format for product grids. With 3,000+ products, sending one JSON object per card
 * repeats every key, brand and category name thousands of times; shared tables + row arrays cut
 * the page payload by more than half. Safe to import from both server and client components.
 */
export type PackedCards = {
  t: string[]; // shared strings: brands, categories, subcategories, image folders
  r: [slug: string, name: string, brand: number, cat: number, sub: number, price: number | null, mrp: number | null, flags: number, image: string, id?: string][];
};

const ON_REQUEST = 1,
  VARIANTS = 2,
  IN_STOCK = 4;

export function packCards(cards: ProductCard[]): PackedCards {
  const t: string[] = [];
  const idx = new Map<string, number>();
  const s = (v: string) => {
    let i = idx.get(v);
    if (i === undefined) idx.set(v, (i = t.push(v) - 1));
    return i;
  };
  return {
    t,
    r: cards.map((c) => {
      const flags = (c.priceOnRequest ? ON_REQUEST : 0) | (c.hasVariants ? VARIANTS : 0) | (c.inStock ? IN_STOCK : 0);
      const row: PackedCards["r"][number] = [c.slug, c.name, s(c.brand), s(c.category), s(c.subcategory), c.price, c.mrp === c.price ? null : c.mrp, flags, c.image];
      if (c.id !== c.slug) row.push(c.id);
      return row;
    }),
  };
}

export function unpackCards({ t, r }: PackedCards): ProductCard[] {
  return r.map(([slug, name, b, c, s, price, mrp, flags, image, id]) => ({
    id: id ?? slug,
    slug,
    name,
    brand: t[b],
    category: t[c],
    subcategory: t[s],
    price,
    mrp: mrp ?? price,
    priceOnRequest: (flags & ON_REQUEST) > 0,
    hasVariants: (flags & VARIANTS) > 0,
    inStock: (flags & IN_STOCK) > 0,
    image,
  }));
}
