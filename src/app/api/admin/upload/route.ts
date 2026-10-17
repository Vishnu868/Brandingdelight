import { NextResponse } from "next/server";
import crypto from "node:crypto";
import sharp from "sharp";
import { adminRoute } from "@/lib/admin-api";
import { PRODUCT_BUCKET } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Uploads a product photo: converts to high-quality WebP (max 1600px) plus a 640px grid thumbnail (`_640.webp`, see thumb()) in Supabase Storage. */
export const POST = adminRoute(async (req, { db }) => {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: "Image must be under 15 MB" }, { status: 400 });
  if (!/^image\/(jpeg|png|webp|avif|gif)$/.test(file.type)) return NextResponse.json({ error: "Upload a JPG, PNG, WebP or AVIF image" }, { status: 400 });

  const input = Buffer.from(await file.arrayBuffer());
  const img = sharp(input).rotate();
  const out = await img.clone().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
  const small = await img.clone().resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  const path = `p/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.webp`;
  const opts = { contentType: "image/webp", cacheControl: "31536000", upsert: false };
  const { error } = await db.storage.from(PRODUCT_BUCKET).upload(path, out, opts);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const { error: tErr } = await db.storage.from(PRODUCT_BUCKET).upload(path.replace(/\.webp$/, "_640.webp"), small, opts);
  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 400 });
  const { data } = db.storage.from(PRODUCT_BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
});
