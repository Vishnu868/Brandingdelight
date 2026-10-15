import { slugify } from "./format";
import type { Product } from "./types";

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown) => (v === "" || v == null ? null : Number.isFinite(Number(v)) && Number(v) >= 0 ? Math.round(Number(v) * 100) / 100 : NaN);
const strList = (v: unknown, max = 40) => (Array.isArray(v) ? v.map((x) => str(x, 300)).filter(Boolean).slice(0, max) : []);

/** Validates & normalises a product payload coming from the admin editor. */
export function cleanProduct(b: Record<string, unknown>): Product | { error: string } {
  const name = str(b.name, 200);
  if (!name) return { error: "Product name is required" };
  const category = str(b.category, 80);
  if (!category) return { error: "Category is required" };
  const price = num(b.price);
  if (Number.isNaN(price)) return { error: "Price must be a positive number" };
  const mrp = num(b.mrp);
  const variants = Array.isArray(b.variants)
    ? (b.variants as Record<string, unknown>[])
        .map((v) => ({ id: slugify(str(v.label, 80)) || slugify(str(v.id, 80)), label: str(v.label, 80), price: Number(v.price) }))
        .filter((v) => v.label && Number.isFinite(v.price) && v.price > 0)
    : [];
  const specs = Array.isArray(b.specs)
    ? (b.specs as Record<string, unknown>[]).map((s) => ({ label: str(s.label, 80), value: str(s.value, 300) })).filter((s) => s.label && s.value)
    : [];
  const images = strList(b.images, 12).filter((u) => u.startsWith("/") || u.startsWith("https://"));
  const priceOnRequest = Boolean(b.priceOnRequest) || (price == null && !variants.length);
  return {
    id: str(b.id, 100),
    slug: slugify(str(b.slug, 100)),
    name,
    brand: str(b.brand, 80) || "BrandingDelight",
    category,
    subcategory: str(b.subcategory, 80) || category,
    price,
    mrp: Number.isNaN(mrp) ? null : (mrp ?? price),
    sku: str(b.sku, 60) || null,
    shortDescription: str(b.shortDescription, 400),
    description: str(b.description, 5000),
    highlights: strList(b.highlights),
    specs,
    variants,
    images,
    tags: strList(b.tags, 20),
    catalog: str(b.catalog, 120),
    stock: Math.max(0, Math.floor(Number(b.stock ?? 100)) || 0),
    priceOnRequest,
    featured: Boolean(b.featured),
    active: b.active !== false,
  };
}
