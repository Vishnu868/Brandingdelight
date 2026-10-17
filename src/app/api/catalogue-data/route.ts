import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

/** Details for the products currently shown in a listing, in the same order, for the downloadable PDF catalogue. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const slugs: unknown = body?.slugs;
  if (!Array.isArray(slugs) || slugs.length === 0 || slugs.length > 5000 || !slugs.every((s) => typeof s === "string")) {
    return NextResponse.json({ error: "Send the product slugs to include" }, { status: 400 });
  }
  const bySlug = new Map((await getAllProducts()).map((p) => [p.slug, p]));
  const items = (slugs as string[]).flatMap((slug) => {
    const p = bySlug.get(slug);
    if (!p || p.active === false) return [];
    const from = p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : null;
    const price = p.price ?? from;
    return [
      {
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        sku: p.sku,
        price: p.priceOnRequest && from == null ? null : price,
        from: p.price == null && from != null,
        short: p.shortDescription,
        highlights: p.highlights.slice(0, 4),
        image: p.images[0] ?? null,
      },
    ];
  });
  return NextResponse.json({ items });
}
