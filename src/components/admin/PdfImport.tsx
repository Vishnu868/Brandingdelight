"use client";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, FileUp, ImageOff, Loader2, ScanText, Trash2 } from "lucide-react";
import { Select } from "@/components/Select";
import { useAdminData, useAdminMutation } from "@/lib/use-admin";
import { useToast } from "@/lib/store";
import type { Product } from "@/lib/types";

import { closeOcr, extractPage, type Box } from "@/lib/pdf-extract";
type Draft = {
  key: string;
  page: number;
  include: boolean;
  dupe: string | null;
  image: string | null; // cropped JPEG data URL
  name: string;
  brand: string;
  code: string;
  price: string;
  category: string;
  description: string;
  features: string;
};
type PageState = { page: number; status: "waiting" | "reading" | "done" | "empty" | "error"; note?: string };

const RENDER_PX = 2200; // long edge of the rendered page (photos are cropped from it)
const CROP_PX = 1000; // long edge of saved product photos

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  return pdfjs;
}

function cropBox(canvas: HTMLCanvasElement, b: Box): string | null {
  const x0 = Math.max(0, Math.min(b.x0, b.x1)), x1 = Math.min(1, Math.max(b.x0, b.x1));
  const y0 = Math.max(0, Math.min(b.y0, b.y1)), y1 = Math.min(1, Math.max(b.y0, b.y1));
  if (x1 - x0 < 0.03 || y1 - y0 < 0.03) return null;
  const pad = 0.01;
  const sx = Math.max(0, x0 - pad) * canvas.width, sy = Math.max(0, y0 - pad) * canvas.height;
  const sw = Math.min(1, x1 + pad) * canvas.width - sx, sh = Math.min(1, y1 + pad) * canvas.height - sy;
  const scale = Math.min(1, CROP_PX / Math.max(sw, sh));
  const out = document.createElement("canvas");
  out.width = Math.round(sw * scale);
  out.height = Math.round(sh * scale);
  const ctx = out.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, out.width, out.height);
  return out.toDataURL("image/jpeg", 0.9);
}

export function PdfImport({ categories }: { categories: string[] }) {
  const mutate = useAdminMutation();
  const toast = useToast((s) => s.push);
  const { data: existing } = useAdminData<{ products: Product[] }>("/api/admin/products");
  const fileRef = useRef<HTMLInputElement>(null);
  const cancel = useRef(false);

  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [from, setFrom] = useState("1");
  const [to, setTo] = useState("");
  const [brand, setBrand] = useState("");
  const [catalogName, setCatalogName] = useState("");
  const [defaultCat, setDefaultCat] = useState("");
  const [pages, setPages] = useState<PageState[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [reading, setReading] = useState(false);
  const [publishing, setPublishing] = useState<null | { done: number; total: number }>(null);
  const [published, setPublished] = useState<number | null>(null);

  const known = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of existing?.products ?? []) {
      if (p.sku) m.set(`${norm(p.brand)}|${norm(p.sku)}`, p.name);
      m.set(`${norm(p.brand)}|${norm(p.name)}`, p.name);
    }
    return m;
  }, [existing]);

  const pick = async (f: File | null) => {
    setFile(f);
    setPages([]);
    setDrafts([]);
    setPublished(null);
    if (!f) return;
    setCatalogName(f.name.replace(/\.pdf$/i, ""));
    const pdfjs = await loadPdfjs();
    const task = pdfjs.getDocument({ data: await f.arrayBuffer() });
    const doc = await task.promise;
    setPageCount(doc.numPages);
    setFrom("1");
    setTo(String(doc.numPages));
    task.destroy();
  };

  const read = async () => {
    if (!file) return;
    const a = Math.max(1, Number(from) || 1);
    const b = Math.min(pageCount, Number(to) || pageCount);
    if (a > b) return toast("Check the page range", "error");
    cancel.current = false;
    setReading(true);
    setPublished(null);
    const list = Array.from({ length: b - a + 1 }, (_, i) => a + i);
    setPages(list.map((page) => ({ page, status: "waiting" })));
    const mark = (page: number, s: Partial<PageState>) => setPages((ps) => ps.map((p) => (p.page === page ? { ...p, ...s } : p)));

    const pdfjs = await loadPdfjs();
    const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
    const doc = await task.promise;
    const seenHeaders = new Map<string, number>();
    for (const pn of list) {
      if (cancel.current) break;
      mark(pn, { status: "reading" });
      try {
        const page = await doc.getPage(pn);
        const vp1 = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: RENDER_PX / Math.max(vp1.width, vp1.height) });
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(vp.width);
        canvas.height = Math.round(vp.height);
        // "print" intent renders without requestAnimationFrame, so a long import keeps going in a background tab
        await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp, intent: "print" }).promise;
        const { products: items, ocr } = await extractPage(pdfjs, page, vp, canvas, { brand, categories, seenHeaders });
        if (!items.length) {
          mark(pn, { status: "empty", note: "no products" });
          continue;
        }
        const add: Draft[] = items.map((it, k) => {
          const br = (it.brand || brand).trim();
          const dupe = (it.code && known.get(`${norm(br)}|${norm(it.code)}`)) || known.get(`${norm(br)}|${norm(it.name)}`) || null;
          return {
            key: `${pn}-${k}`,
            page: pn,
            include: !dupe,
            dupe,
            image: it.photo ? cropBox(canvas, it.photo) : null,
            name: it.name.trim(),
            brand: br,
            code: it.code.trim(),
            price: it.price != null && it.price > 0 ? String(Math.round(it.price)) : "",
            category: defaultCat || (categories.includes(it.category) ? it.category : ""),
            description: it.description.trim(),
            features: it.features.map((f) => f.trim()).filter(Boolean).join("\n"),
          };
        });
        setDrafts((d) => [...d, ...add]);
        mark(pn, { status: "done", note: `${items.length} product${items.length === 1 ? "" : "s"}${ocr ? " (OCR)" : ""}` });
      } catch (e) {
        mark(pn, { status: "error", note: (e as Error).message });
      }
    }
    await closeOcr();
    task.destroy();
    setReading(false);
  };

  const edit = (key: string, patch: Partial<Draft>) => setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  const chosen = drafts.filter((d) => d.include);
  const missingCat = chosen.filter((d) => !d.category).length;

  const publish = async () => {
    if (!chosen.length) return;
    if (missingCat) return toast(`Pick a category for ${missingCat} product${missingCat === 1 ? "" : "s"}`, "error");
    setPublishing({ done: 0, total: chosen.length });
    let ok = 0;
    for (const d of chosen) {
      try {
        let images: string[] = [];
        if (d.image) {
          const blob = await (await fetch(d.image)).blob();
          const fd = new FormData();
          fd.append("file", new File([blob], `${d.key}.jpg`, { type: "image/jpeg" }));
          images = [(await mutate("/api/admin/upload", "POST", fd)).url];
        }
        const features = d.features.split("\n").map((s) => s.trim()).filter(Boolean);
        const price = d.price.trim() ? Number(d.price) : null;
        await mutate("/api/admin/products", "POST", {
          name: d.name,
          brand: d.brand,
          sku: d.code,
          price,
          mrp: price,
          category: d.category,
          subcategory: d.category,
          shortDescription: d.description.split(/(?<=\.)\s/)[0] || features[0] || "",
          description: d.description,
          highlights: features,
          images,
          catalog: catalogName,
          stock: 100,
        });
        ok++;
        setDrafts((ds) => ds.filter((x) => x.key !== d.key));
      } catch (e) {
        toast(`${d.name}: ${(e as Error).message}`, "error");
      }
      setPublishing((p) => p && { ...p, done: p.done + 1 });
    }
    setPublishing(null);
    setPublished(ok);
    toast(`${ok} product${ok === 1 ? "" : "s"} added to the store`);
  };

  const pageStats = { done: pages.filter((p) => p.status === "done" || p.status === "empty" || p.status === "error").length, total: pages.length };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="h-display text-[28px] font-semibold">Import from a PDF catalogue</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Upload a supplier catalogue. Product names, codes, prices, details and photos are read straight from the PDF in your browser (free; scanned pages use free OCR). Nothing goes live until you review it and press
        <b> Add to store</b>. Products without a printed price get the “Get a quote” button.
      </p>

      <div className="card mt-6 grid gap-4 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={(e) => pick(e.target.files?.[0] ?? null)} />
          <button className="btn-outline w-full justify-center !py-4" onClick={() => fileRef.current?.click()} disabled={reading}>
            <FileUp size={18} /> {file ? `${file.name} · ${pageCount} pages` : "Choose a PDF catalogue"}
          </button>
        </div>
        <label className="text-sm">
          <span className="label">Brand / company (optional)</span>
          <input className="input" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Portronics" />
        </label>
        <label className="text-sm">
          <span className="label">Catalogue name</span>
          <input className="input" value={catalogName} onChange={(e) => setCatalogName(e.target.value)} placeholder="e.g. Portronics June 2026" />
        </label>
        <div className="text-sm">
          <span className="label">Category for all products</span>
          <Select value={defaultCat} onChange={setDefaultCat} options={[{ value: "", label: "Suggest per product" }, ...categories]} />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <label>
            <span className="label">From page</span>
            <input className="input" inputMode="numeric" value={from} onChange={(e) => setFrom(e.target.value.replace(/\D/g, ""))} />
          </label>
          <label>
            <span className="label">To page</span>
            <input className="input" inputMode="numeric" value={to} onChange={(e) => setTo(e.target.value.replace(/\D/g, ""))} />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          {!reading ? (
            <button className="btn-primary" onClick={read} disabled={!file}>
              <ScanText size={17} /> Read catalogue
            </button>
          ) : (
            <button className="btn-outline" onClick={() => (cancel.current = true)}>
              Stop after this page
            </button>
          )}
          <p className="text-xs text-muted">Text PDFs read instantly; scanned pages take a few seconds each. Keep this tab open while it reads.</p>
        </div>
      </div>

      {pages.length > 0 && (
        <div className="card mt-4 p-5">
          <div className="flex items-center justify-between text-sm">
            <p className="font-semibold">
              Pages read: {pageStats.done} / {pageStats.total}
            </p>
            {reading && <Loader2 size={16} className="animate-spin text-maroon" />}
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-sand">
            <div className="h-full rounded-full bg-maroon transition-[width]" style={{ width: `${(pageStats.done / Math.max(1, pageStats.total)) * 100}%` }} />
          </div>
          <div className="no-scrollbar mt-3 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto text-[11px]">
            {pages.map((p) => (
              <span
                key={p.page}
                title={p.note}
                className={`rounded px-2 py-1 ${p.status === "done" ? "bg-green-50 text-green-700" : p.status === "error" ? "bg-red-50 text-red-700" : p.status === "reading" ? "bg-gold-soft text-gold" : "bg-sand text-muted"}`}
              >
                p{p.page} {p.status === "done" ? `· ${p.note}` : p.status === "empty" ? "· skipped" : p.status === "error" ? "· failed" : p.status === "reading" ? "· reading…" : ""}
              </span>
            ))}
          </div>
          {pages.some((p) => p.status === "error") && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-red-700">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {pages.find((p) => p.status === "error")?.note}
            </p>
          )}
        </div>
      )}

      {published != null && (
        <div className="card mt-4 flex items-center gap-3 p-5 text-sm">
          <CheckCircle2 className="text-green-600" /> {published} products added.{" "}
          <Link href="/admin/products" className="font-semibold text-maroon underline">
            View products
          </Link>
        </div>
      )}

      {drafts.length > 0 && (
        <>
          <div className="sticky top-14 z-20 mt-6 flex flex-wrap items-center gap-3 rounded-md border border-line bg-white/95 p-3 backdrop-blur lg:top-2">
            <p className="text-sm font-semibold">
              {chosen.length} of {drafts.length} selected
            </p>
            <button className="text-xs font-semibold text-maroon" onClick={() => setDrafts((ds) => ds.map((d) => ({ ...d, include: true })))}>
              Select all
            </button>
            <button className="text-xs font-semibold text-muted" onClick={() => setDrafts((ds) => ds.map((d) => ({ ...d, include: false })))}>
              Clear
            </button>
            <button className="btn-primary ml-auto" onClick={publish} disabled={!chosen.length || !!publishing || reading}>
              {publishing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {publishing ? `Adding ${publishing.done}/${publishing.total}…` : `Add ${chosen.length} to store`}
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {drafts.map((d) => (
              <div key={d.key} className={`card grid gap-4 p-4 sm:grid-cols-[150px_1fr] ${d.include ? "" : "opacity-60"}`}>
                <div>
                  <div className="grid aspect-square place-items-center overflow-hidden rounded-md bg-[#f6f1ea]">
                    {d.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.image} alt="" className="size-full object-contain" />
                    ) : (
                      <ImageOff className="text-muted" />
                    )}
                  </div>
                  <label className="mt-2 flex items-center gap-2 text-sm font-medium">
                    <input type="checkbox" checked={d.include} onChange={(e) => edit(d.key, { include: e.target.checked })} className="size-4 accent-maroon" /> Add
                  </label>
                  <p className="mt-1 text-[11px] text-muted">Page {d.page}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {d.dupe && (
                    <p className="flex items-center gap-1.5 rounded bg-gold-soft px-2.5 py-1.5 text-xs text-gold sm:col-span-2">
                      <AlertTriangle size={14} /> Looks like “{d.dupe}”, already in the store
                    </p>
                  )}
                  <label className="text-sm sm:col-span-2">
                    <span className="label">Name</span>
                    <input className="input" value={d.name} onChange={(e) => edit(d.key, { name: e.target.value })} />
                  </label>
                  <label className="text-sm">
                    <span className="label">Brand</span>
                    <input className="input" value={d.brand} onChange={(e) => edit(d.key, { brand: e.target.value })} />
                  </label>
                  <label className="text-sm">
                    <span className="label">Code / SKU</span>
                    <input className="input" value={d.code} onChange={(e) => edit(d.key, { code: e.target.value })} />
                  </label>
                  <label className="text-sm">
                    <span className="label">Price ₹ (empty = Get a quote)</span>
                    <input className="input" inputMode="numeric" value={d.price} onChange={(e) => edit(d.key, { price: e.target.value.replace(/[^\d.]/g, "") })} />
                  </label>
                  <div className="text-sm">
                    <span className="label">Category</span>
                    <Select value={d.category} onChange={(v) => edit(d.key, { category: v })} options={[{ value: "", label: "Choose…" }, ...categories]} />
                  </div>
                  <label className="text-sm sm:col-span-2">
                    <span className="label">Description</span>
                    <textarea className="input min-h-16" value={d.description} onChange={(e) => edit(d.key, { description: e.target.value })} />
                  </label>
                  <label className="text-sm sm:col-span-2">
                    <span className="label">Features (one per line)</span>
                    <textarea className="input min-h-24" value={d.features} onChange={(e) => edit(d.key, { features: e.target.value })} />
                  </label>
                  <button className="justify-self-start text-xs font-semibold text-muted hover:text-red-700 sm:col-span-2" onClick={() => setDrafts((ds) => ds.filter((x) => x.key !== d.key))}>
                    <Trash2 size={13} className="mr-1 inline" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
