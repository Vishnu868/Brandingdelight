"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Copy, Eye, EyeOff, Pencil, PlusCircle, Search, Star, Trash2 } from "lucide-react";
import { Select } from "@/components/Select";
import { formatINR, thumb } from "@/lib/format";
import { useAdminData, useAdminMutation } from "@/lib/use-admin";
import { useToast } from "@/lib/store";
import type { Product } from "@/lib/types";

export default function AdminProducts() {
  const { data, error, loading, setData } = useAdminData<{ products: Product[] }>("/api/admin/products");
  const mutate = useAdminMutation();
  const toast = useToast((s) => s.push);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [show, setShow] = useState(60);

  const products = useMemo(() => data?.products ?? [], [data]);
  const cats = useMemo(() => [...new Set(products.map((p) => p.category))].sort(), [products]);
  const list = useMemo(() => {
    const t = q.toLowerCase();
    return products.filter((p) => (cat === "all" || p.category === cat) && (!t || `${p.name} ${p.brand} ${p.sku ?? ""}`.toLowerCase().includes(t)));
  }, [products, q, cat]);

  const patch = async (p: Product, body: Partial<Product>) => {
    try {
      const r = await mutate(`/api/admin/products/${encodeURIComponent(p.id)}`, "PATCH", body);
      setData((d) => (d ? { products: d.products.map((x) => (x.id === p.id ? r.product : x)) } : d));
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="h-display text-3xl font-semibold">Products</h1>
          <p className="text-sm text-muted">{loading ? "Loading…" : `${list.length} of ${products.length} products`}</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          <PlusCircle size={17} /> Add product
        </Link>
      </div>

      {error && <p className="mt-4 rounded-md bg-amber-50 p-4 text-sm text-amber-800">{error}</p>}
      {!loading && !error && products.length === 0 && (
        <p className="mt-4 rounded-md bg-gold-soft p-4 text-sm">
          No products in Supabase yet. Go to the <Link href="/admin" className="font-semibold text-maroon underline">Dashboard</Link> and click <b>Import catalogue</b> to load all catalogue products.
        </p>
      )}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <label className="flex flex-1 items-center gap-2 rounded-md border border-line bg-white px-3">
          <Search size={17} className="text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, brand or SKU" className="h-11 w-full bg-transparent outline-none" />
        </label>
        <Select value={cat} onChange={setCat} options={[{ value: "all", label: "All categories" }, ...cats]} label="Filter by category" className="sm:w-64" />
      </div>

      <div className="mt-4 space-y-2">
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-md" />
          ))}
        {list.slice(0, show).map((p) => (
          <div key={p.id} className={`card flex items-center gap-3 p-3 ${p.active === false ? "opacity-55" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb(p.images[0] ?? "/placeholder.svg")} alt="" className="size-16 shrink-0 rounded-lg bg-[#f6f1ea] object-contain" loading="lazy" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{p.name}</p>
              <p className="truncate text-xs text-muted">
                {p.brand} · {p.category} › {p.subcategory}
                {p.sku && ` · ${p.sku}`}
              </p>
              <p className="flex flex-wrap items-center gap-x-3 text-sm font-bold">
                {p.price != null ? formatINR(p.price) : p.variants.length ? `${p.variants.length} options` : <span className="font-medium text-maroon">On request</span>}
                <span className={`text-xs font-semibold ${p.stock <= 0 ? "text-danger" : p.stock <= 5 ? "text-amber-700" : "text-muted"}`}>
                  {p.stock <= 0 ? "Out of stock" : `Stock: ${p.stock}`}
                </span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <IconBtn title={p.featured ? "Unfeature" : "Feature"} onClick={() => patch(p, { featured: !p.featured })}>
                <Star size={17} className={p.featured ? "fill-gold text-gold" : ""} />
              </IconBtn>
              <IconBtn title={p.active === false ? "Show on store" : "Hide from store"} onClick={() => patch(p, { active: p.active === false })}>
                {p.active === false ? <EyeOff size={17} /> : <Eye size={17} />}
              </IconBtn>
              <Link href={`/admin/products/new?from=${encodeURIComponent(p.id)}`} className="rounded-full p-2 hover:bg-sand" title="Duplicate as new product">
                <Copy size={17} />
              </Link>
              <Link href={`/admin/products/${encodeURIComponent(p.id)}`} className="rounded-full p-2 hover:bg-sand" title="Edit">
                <Pencil size={17} />
              </Link>
              <IconBtn
                title="Delete"
                onClick={async () => {
                  if (!confirm(`Delete "${p.name}" permanently?`)) return;
                  try {
                    await mutate(`/api/admin/products/${encodeURIComponent(p.id)}`, "DELETE");
                    setData((d) => (d ? { products: d.products.filter((x) => x.id !== p.id) } : d));
                    toast("Product deleted");
                  } catch (e) {
                    toast((e as Error).message, "error");
                  }
                }}
              >
                <Trash2 size={17} className="text-danger" />
              </IconBtn>
            </div>
          </div>
        ))}
        {show < list.length && (
          <button className="btn-outline w-full" onClick={() => setShow((n) => n + 60)}>
            Show more ({list.length - show} remaining)
          </button>
        )}
      </div>
    </div>
  );
}

function IconBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button title={title} aria-label={title} onClick={onClick} className="rounded-full p-2 hover:bg-sand">
      {children}
    </button>
  );
}
