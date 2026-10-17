import "server-only";
import { unstable_cache } from "next/cache";
import seed from "@/data/catalog.json";
import { slugify } from "./format";
import { supabaseAdmin } from "./supabase/server";
import type { Brand, Category, Product, ProductCard } from "./types";

export const PRODUCTS_TAG = "products";

type Row = Record<string, unknown>;

export function rowToProduct(r: Row): Product {
  return {
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    brand: String(r.brand ?? ""),
    category: String(r.category ?? ""),
    subcategory: String(r.subcategory ?? ""),
    price: r.price == null ? null : Number(r.price),
    mrp: r.mrp == null ? null : Number(r.mrp),
    sku: (r.sku as string) ?? null,
    shortDescription: String(r.short_description ?? ""),
    description: String(r.description ?? ""),
    highlights: (r.highlights as string[]) ?? [],
    specs: (r.specs as Product["specs"]) ?? [],
    variants: (r.variants as Product["variants"]) ?? [],
    images: (r.images as string[]) ?? [],
    tags: (r.tags as string[]) ?? [],
    catalog: String(r.catalog ?? ""),
    stock: Number(r.stock ?? 0),
    priceOnRequest: Boolean(r.price_on_request),
    featured: Boolean(r.featured),
    active: r.active !== false,
  };
}

export function productToRow(p: Product): Row {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category: p.category,
    subcategory: p.subcategory,
    price: p.price,
    mrp: p.mrp,
    sku: p.sku,
    short_description: p.shortDescription,
    description: p.description,
    highlights: p.highlights,
    specs: p.specs,
    variants: p.variants,
    images: p.images,
    tags: p.tags,
    catalog: p.catalog,
    stock: p.stock,
    price_on_request: p.priceOnRequest,
    featured: p.featured ?? false,
    active: p.active ?? true,
  };
}

const seedProducts = (seed as { products: Product[] }).products;

const PAGE = 1000; // PostgREST default limit; also keeps each cache entry under Next's 2 MB data-cache cap

/** One 1000-row page of active products, cached on its own (the full catalogue is too big for a single cache entry). */
const loadPage = unstable_cache(
  async (from: number): Promise<Product[] | null> => {
    const db = supabaseAdmin();
    if (!db) return null;
    const { data, error } = await db
      .from("products")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) {
      console.error("[catalog] Supabase read failed, using bundled catalogue:", error.message);
      return null;
    }
    return (data ?? []).map(rowToProduct);
  },
  ["products-page"],
  { tags: [PRODUCTS_TAG], revalidate: 600 },
);

const seedIds = new Set(seedProducts.map((p) => p.id));

export async function getAllProducts(): Promise<Product[]> {
  if (!supabaseAdmin()) return seedProducts;
  const all: Product[] = [];
  for (let from = 0; ; from += PAGE) {
    const rows = await loadPage(from);
    if (!rows) return seedProducts;
    all.push(...rows);
    if (rows.length < PAGE) break;
  }
  // Until "Import catalogue" has been run, the table only holds products added in the admin panel:
  // show those alongside the bundled catalogue instead of hiding the whole catalogue.
  if (!all.some((p) => seedIds.has(p.id))) {
    const own = new Set(all.map((p) => p.id));
    return [...seedProducts.filter((p) => !own.has(p.id)), ...all];
  }
  return all;
}

export async function getProduct(slug: string) {
  return (await getAllProducts()).find((p) => p.slug === slug) ?? null;
}

export function toCard(p: Product): ProductCard {
  const variantMin = p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : null;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category: p.category,
    subcategory: p.subcategory,
    price: p.price ?? variantMin,
    mrp: p.mrp,
    priceOnRequest: p.priceOnRequest && !variantMin,
    image: p.images[0] ?? "/placeholder.svg",
    hasVariants: p.variants.length > 0,
    inStock: p.stock > 0,
  };
}

export async function getCards() {
  return (await getAllProducts()).map(toCard);
}

/** Display order for top-level categories; anything new added by admins is appended. */
const CATEGORY_ORDER = [
  "Festive Hampers & Gift Boxes",
  "Corporate Gift Sets",
  "Gourmet & Chocolates",
  "Dry Fruits & Nuts",
  "Home & Kitchen Appliances",
  "Cookware & Kitchen Tools",
  "Drinkware & Bottles",
  "Copper Collection",
  "Brass Decor & Pooja",
  "Mobile & Tech Accessories",
  "Audio & Smart Gadgets",
  "Desk & Office",
  "Travel & Luggage",
  "Health & Wellness",
  "Fitness & Sports",
  "Personal Care & Grooming",
  "Home Improvement & Safes",
  "Stationery & Notebooks",
];

export const CATEGORY_IMAGES: Record<string, string> = {
  "Festive Hampers & Gift Boxes": "/thumbs/unwrap/unwrap-p13-2.webp",
  "Gourmet & Chocolates": "/thumbs/smoor/smoor-p16.webp",
  "Dry Fruits & Nuts": "/thumbs/dryfruits/dry-p1.webp",
  "Home & Kitchen Appliances": "/thumbs/lifelong-banners/llb-p3.webp",
  "Cookware & Kitchen Tools": "/thumbs/lifelong/llcic002.webp",
  "Drinkware & Bottles": "/thumbs/bottles/bottle-p2.webp",
  "Copper Collection": "/thumbs/tamta-banners/tamb-p19.webp",
  "Mobile & Tech Accessories": "/thumbs/lifelong/llpbvm52.webp",
  "Audio & Smart Gadgets": "/thumbs/fuzo/fuzo-p2.webp",
  "Desk & Office": "/thumbs/eo/eo-p1a.webp",
  "Travel & Luggage": "/thumbs/hrx/hrx-p13.webp",
  "Health & Wellness": "/thumbs/lifelong-banners/llb-p34.webp",
  "Fitness & Sports": "/thumbs/lifelong-banners/llb-p42.webp",
  "Personal Care & Grooming": "/thumbs/lifelong-banners/llb-p40.webp",
  "Home Improvement & Safes": "/thumbs/lifelong-banners/llb-p29.webp",
  "Stationery & Notebooks": "/thumbs/organizers/org-or1013.webp",
  "Corporate Gift Sets": "/thumbs/gift-combos/gc-gs1008.webp",
  "Brass Decor & Pooja": "/thumbs/popli/popli-fv-15te.webp",
};

/** Focal point for landscape artwork when cropped into tiles (Lifelong banners keep the photo on the right). */
export const imagePosition = (src: string) => (src.includes("lifelong-banners") ? "80% 50%" : src.includes("/hrx/") ? "70% 50%" : "50% 50%");

export async function getCategories(): Promise<Category[]> {
  const products = await getAllProducts();
  const map = new Map<string, Category>();
  for (const p of products) {
    let c = map.get(p.category);
    if (!c) {
      c = { name: p.category, slug: slugify(p.category), count: 0, image: CATEGORY_IMAGES[p.category] ?? p.images[0], subcategories: [] };
      map.set(p.category, c);
    }
    c.count++;
    const s = c.subcategories.find((x) => x.name === p.subcategory);
    if (s) s.count++;
    else if (p.subcategory) c.subcategories.push({ name: p.subcategory, slug: slugify(p.subcategory), count: 1 });
  }
  const rank = (n: string) => {
    const i = CATEGORY_ORDER.indexOf(n);
    return i === -1 ? 999 : i;
  };
  return [...map.values()].sort((a, b) => rank(a.name) - rank(b.name));
}

export async function getBrands(): Promise<Brand[]> {
  const products = await getAllProducts();
  const map = new Map<string, Brand>();
  for (const p of products) {
    const b = map.get(p.brand) ?? { name: p.brand, slug: slugify(p.brand), count: 0 };
    b.count++;
    map.set(p.brand, b);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

/** Server-side price lookup used by checkout: never trust prices sent by the browser. */
export async function priceFor(productId: string, variantId?: string) {
  const p = (await getAllProducts()).find((x) => x.id === productId);
  if (!p) return null;
  if (variantId) {
    const v = p.variants.find((x) => x.id === variantId);
    return v ? { product: p, price: v.price, label: v.label } : null;
  }
  if (p.price == null) return null;
  return { product: p, price: p.price, label: undefined };
}
