import { NextResponse } from "next/server";
import seed from "@/data/catalog.json";
import { adminRoute, refreshStorefront } from "@/lib/admin-api";
import { productToRow } from "@/lib/catalog";
import type { Product } from "@/lib/types";

/**
 * One-time import of the 790+ catalogue products bundled with the site into Supabase.
 * Existing products with the same id are left untouched unless `overwrite` is true.
 */
export const POST = adminRoute(async (req, { db }) => {
  const { overwrite = false } = await req.json().catch(() => ({}));
  const rows = (seed as { products: Product[] }).products.map(productToRow);
  let done = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    const { error } = await db.from("products").upsert(chunk, { onConflict: "id", ignoreDuplicates: !overwrite });
    if (error) return NextResponse.json({ error: error.message, imported: done }, { status: 400 });
    done += chunk.length;
  }
  refreshStorefront();
  return NextResponse.json({ imported: done });
});
