import { NextResponse } from "next/server";
import { adminRoute, refreshStorefront } from "@/lib/admin-api";
import { productToRow, rowToProduct } from "@/lib/catalog";
import { cleanProduct } from "@/lib/product-input";

type P = { id: string };

export const PUT = adminRoute<P>(async (req, { db }, { id }) => {
  const p = cleanProduct(await req.json());
  if ("error" in p) return NextResponse.json({ error: p.error }, { status: 400 });
  const { data: existing } = await db.from("products").select("slug").eq("id", id).maybeSingle();
  if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  const row = productToRow({ ...p, id, slug: existing.slug });
  const { data, error } = await db.from("products").update(row).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  refreshStorefront();
  return NextResponse.json({ product: rowToProduct(data) });
});

/** Quick toggles from the product table (active / featured / stock / price). */
export const PATCH = adminRoute<P>(async (req, { db }, { id }) => {
  const b = await req.json();
  const patch: Record<string, unknown> = {};
  if (typeof b.active === "boolean") patch.active = b.active;
  if (typeof b.featured === "boolean") patch.featured = b.featured;
  if (Number.isFinite(b.stock)) patch.stock = Math.max(0, Math.floor(b.stock));
  if (b.price === null || (Number.isFinite(b.price) && b.price >= 0)) patch.price = b.price;
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  const { data, error } = await db.from("products").update(patch).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  refreshStorefront();
  return NextResponse.json({ product: rowToProduct(data) });
});

export const DELETE = adminRoute<P>(async (_req, { db }, { id }) => {
  const { error } = await db.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  refreshStorefront();
  return NextResponse.json({ ok: true });
});
