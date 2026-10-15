import { NextResponse } from "next/server";
import { adminRoute, refreshStorefront } from "@/lib/admin-api";
import { productToRow, rowToProduct } from "@/lib/catalog";
import { slugify } from "@/lib/format";
import { cleanProduct } from "@/lib/product-input";

export const GET = adminRoute(async (_req, { db }) => {
  const all = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("products").select("*").order("created_at", { ascending: false }).range(from, from + 999);
    if (error) throw error;
    all.push(...(data ?? []).map(rowToProduct));
    if (!data || data.length < 1000) break;
  }
  return NextResponse.json({ products: all });
});

export const POST = adminRoute(async (req, { db }) => {
  const p = cleanProduct(await req.json());
  if ("error" in p) return NextResponse.json({ error: p.error }, { status: 400 });
  // ensure unique slug / id
  let slug = p.slug || slugify(`${p.brand} ${p.name}`);
  for (let n = 2; ; n++) {
    const { data } = await db.from("products").select("id").eq("slug", slug).maybeSingle();
    if (!data) break;
    slug = `${slugify(`${p.brand} ${p.name}`)}-${n}`;
  }
  const row = productToRow({ ...p, id: slug, slug });
  const { data, error } = await db.from("products").insert(row).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  refreshStorefront();
  return NextResponse.json({ product: rowToProduct(data) });
});
