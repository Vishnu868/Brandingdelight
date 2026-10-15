"use client";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { thumb } from "@/lib/format";
import { useAdminData, useAdminMutation } from "@/lib/use-admin";
import { useToast } from "@/lib/store";
import type { Product, Spec, Variant } from "@/lib/types";

const BLANK: Product = {
  id: "", slug: "", name: "", brand: "", category: "", subcategory: "", price: null, mrp: null, sku: null, shortDescription: "", description: "",
  highlights: [], specs: [], variants: [], images: [], tags: [], catalog: "", stock: 100, priceOnRequest: false, featured: false, active: true,
};

/** `initial` edits an existing product; `copyOf` pre-fills a NEW product from an existing one. */
export function ProductForm({ initial, copyOf }: { initial?: Product; copyOf?: Product }) {
  const router = useRouter();
  const mutate = useAdminMutation();
  const toast = useToast((s) => s.push);
  const { data } = useAdminData<{ products: Product[] }>("/api/admin/products");
  const seed = initial ?? (copyOf ? { ...copyOf, id: "", slug: "", sku: null, name: `${copyOf.name} (copy)` } : BLANK);
  const [p, setP] = useState<Product>(seed);
  const [highlights, setHighlights] = useState(seed.highlights.join("\n"));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const opts = useMemo(() => {
    const all = data?.products ?? [];
    const uniq = (f: (x: Product) => string) => [...new Set(all.map(f).filter(Boolean))].sort();
    return {
      brands: uniq((x) => x.brand),
      categories: uniq((x) => x.category),
      subs: uniq((x) => (p.category && x.category !== p.category ? "" : x.subcategory)),
    };
  }, [data, p.category]);

  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((s) => ({ ...s, [k]: v }));

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    for (const f of Array.from(files)) {
      setUploading((n) => n + 1);
      try {
        const fd = new FormData();
        fd.append("file", f);
        const r = await mutate("/api/admin/upload", "POST", fd);
        setP((s) => ({ ...s, images: [...s.images, r.url] }));
      } catch (e) {
        toast((e as Error).message, "error");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const moveImg = (i: number, d: number) =>
    setP((s) => {
      const im = [...s.images];
      const j = i + d;
      if (j < 0 || j >= im.length) return s;
      [im[i], im[j]] = [im[j], im[i]];
      return { ...s, images: im };
    });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const body = { ...p, highlights: highlights.split("\n").map((x) => x.trim()).filter(Boolean) };
    try {
      if (initial) await mutate(`/api/admin/products/${encodeURIComponent(initial.id)}`, "PUT", body);
      else await mutate("/api/admin/products", "POST", body);
      toast(initial ? "Product updated — live on the store" : "Product added — live on the store");
      router.push("/admin/products");
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
      <datalist id="brands">{opts.brands.map((b) => <option key={b} value={b} />)}</datalist>
      <datalist id="cats">{opts.categories.map((b) => <option key={b} value={b} />)}</datalist>
      <datalist id="subs">{opts.subs.map((b) => <option key={b} value={b} />)}</datalist>

      <div className="space-y-5">
        <Section title="Basic details">
          <F label="Product name *">
            <input className="input" value={p.name} onChange={(e) => set("name", e.target.value)} required maxLength={200} />
          </F>
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Brand">
              <input className="input" list="brands" value={p.brand} onChange={(e) => set("brand", e.target.value)} placeholder="e.g. Lifelong" />
            </F>
            <F label="SKU / model code">
              <input className="input" value={p.sku ?? ""} onChange={(e) => set("sku", e.target.value)} />
            </F>
            <F label="Category * (pick or type a new one)">
              <input className="input" list="cats" value={p.category} onChange={(e) => set("category", e.target.value)} required />
            </F>
            <F label="Sub-category">
              <input className="input" list="subs" value={p.subcategory} onChange={(e) => set("subcategory", e.target.value)} />
            </F>
          </div>
          <F label="Short description (shown near the price)">
            <textarea className="input" rows={2} value={p.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} maxLength={400} />
          </F>
          <F label="Full description">
            <textarea className="input" rows={6} value={p.description} onChange={(e) => set("description", e.target.value)} maxLength={5000} />
          </F>
          <F label="Highlights / what's inside (one per line)">
            <textarea className="input" rows={5} value={highlights} onChange={(e) => setHighlights(e.target.value)} />
          </F>
        </Section>

        <Section title="Images">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {p.images.map((src, i) => (
              <div key={src + i} className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-[#f6f1ea]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumb(src)} alt="" className="size-full object-contain" />
                {i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-maroon px-1.5 py-0.5 text-[10px] font-bold text-white">MAIN</span>}
                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/50 p-1">
                  <button type="button" className="rounded p-1 text-white" onClick={() => moveImg(i, -1)} aria-label="Move left">
                    <ArrowUp size={14} className="-rotate-90" />
                  </button>
                  <button type="button" className="rounded p-1 text-white" onClick={() => moveImg(i, 1)} aria-label="Move right">
                    <ArrowDown size={14} className="-rotate-90" />
                  </button>
                  <button type="button" className="rounded p-1 text-white" onClick={() => set("images", p.images.filter((_, k) => k !== i))} aria-label="Remove">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => fileRef.current?.click()} className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-line text-muted hover:border-maroon hover:text-maroon">
              {uploading ? <Loader2 className="animate-spin" /> : (
                <span className="text-center text-xs font-medium">
                  <ImagePlus className="mx-auto mb-1" /> Upload
                </span>
              )}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => (upload(e.target.files), (e.target.value = ""))} />
          <div className="flex gap-2">
            <input className="input" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="…or paste an image URL (https://…)" />
            <button
              type="button"
              className="btn-outline"
              onClick={() => {
                if (/^https:\/\/|^\//.test(urlInput)) {
                  set("images", [...p.images, urlInput.trim()]);
                  setUrlInput("");
                }
              }}
            >
              Add
            </button>
          </div>
          <p className="text-xs text-muted">Photos are converted to high-quality WebP (up to 1600px) automatically. The first image is the main photo.</p>
        </Section>

        <Section title="Specifications">
          <RowsEditor<Spec>
            rows={p.specs}
            onChange={(v) => set("specs", v)}
            blank={{ label: "", value: "" }}
            cols={[
              ["label", "Label (e.g. Capacity)"],
              ["value", "Value (e.g. 950 ml)"],
            ]}
          />
        </Section>
      </div>

      <div className="space-y-5">
        <Section title="Pricing">
          <div className="grid grid-cols-2 gap-4">
            <F label="Selling price (₹, incl. GST)">
              <input className="input" type="number" min={0} step="0.01" value={p.price ?? ""} onChange={(e) => set("price", e.target.value === "" ? null : Number(e.target.value))} />
            </F>
            <F label="MRP (₹)">
              <input className="input" type="number" min={0} step="0.01" value={p.mrp ?? ""} onChange={(e) => set("mrp", e.target.value === "" ? null : Number(e.target.value))} />
            </F>
          </div>
          <Toggle label="Price on request (show “Get a quote” instead of Buy)" on={p.priceOnRequest} set={(v) => set("priceOnRequest", v)} />
          <div>
            <p className="label">Options / variants (each with its own price)</p>
            <RowsEditor<Variant>
              rows={p.variants}
              onChange={(v) => set("variants", v)}
              blank={{ id: "", label: "", price: 0 }}
              cols={[
                ["label", "Option (e.g. Box of 9)"],
                ["price", "Price ₹"],
              ]}
            />
          </div>
        </Section>
        <Section title="Inventory & visibility">
          <F label="Stock quantity">
            <input className="input" type="number" min={0} value={p.stock} onChange={(e) => set("stock", Number(e.target.value))} />
          </F>
          <Toggle label="Visible on store" on={p.active !== false} set={(v) => set("active", v)} />
          <Toggle label="Featured product" on={Boolean(p.featured)} set={(v) => set("featured", v)} />
          <F label="Source catalogue / collection">
            <input className="input" value={p.catalog} onChange={(e) => set("catalog", e.target.value)} />
          </F>
        </Section>
        <div className="sticky bottom-4 flex gap-3 rounded-2xl bg-white/90 p-3 shadow-[var(--shadow-pop)] backdrop-blur">
          <button type="button" className="btn-outline" onClick={() => router.back()}>
            Cancel
          </button>
          <button className="btn-primary flex-1" disabled={saving || uploading > 0}>
            {saving && <Loader2 size={16} className="animate-spin" />} {initial ? "Save changes" : "Publish product"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-4 p-5">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, on, set }: { label: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
      {label}
      <button type="button" role="switch" aria-checked={on} onClick={() => set(!on)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-maroon" : "bg-line"}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </label>
  );
}

function RowsEditor<T extends Record<string, unknown>>({ rows, onChange, blank, cols }: { rows: T[]; onChange: (v: T[]) => void; blank: T; cols: [keyof T & string, string][] }) {
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2">
          {cols.map(([k, ph]) => (
            <input
              key={k}
              className="input !py-2"
              placeholder={ph}
              type={typeof blank[k] === "number" ? "number" : "text"}
              value={String(r[k] ?? "")}
              onChange={(e) => onChange(rows.map((x, j) => (j === i ? { ...x, [k]: typeof blank[k] === "number" ? Number(e.target.value) : e.target.value } : x)))}
            />
          ))}
          <button type="button" className="rounded-full p-2 text-danger hover:bg-red-50" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label="Remove row">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button type="button" className="flex items-center gap-1 text-sm font-semibold text-maroon" onClick={() => onChange([...rows, { ...blank }])}>
        <Plus size={15} /> Add row
      </button>
    </div>
  );
}
