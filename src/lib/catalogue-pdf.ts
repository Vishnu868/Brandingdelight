/**
 * Builds a downloadable PDF catalogue of the products currently shown in a listing.
 * Browser-only and loaded on demand (jsPDF + fonts are fetched when the user taps "Download"),
 * so it adds nothing to normal page loads. Prices are whatever the store shows right now.
 */
import { thumb, SITE } from "./format";

export type CatalogueItem = {
  slug: string;
  name: string;
  brand: string;
  sku: string | null;
  price: number | null;
  from: boolean;
  short: string;
  highlights: string[];
  image: string | null;
};

export type CatalogueRequest = { title: string; subtitle?: string; slugs: string[] };
type Progress = (done: number, total: number, stage: "data" | "images" | "pages") => void;

const MM = { w: 210, h: 297, m: 14 };
const MAROON: [number, number, number] = [123, 30, 43];
const GOLD: [number, number, number] = [176, 137, 74];
const INK: [number, number, number] = [33, 27, 24];
const MUTED: [number, number, number] = [112, 104, 98];
const LINE: [number, number, number] = [232, 224, 214];
const ROW_H = 46;

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

async function fontBase64(path: string) {
  const buf = await (await fetch(path)).arrayBuffer();
  let s = "";
  const b = new Uint8Array(buf);
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}

/** Small JPEG data URL (keeps a 500-product PDF to a few MB). Returns null if the image can't be loaded. */
async function imageData(src: string, px = 360): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const res = await fetch(thumb(src), { mode: "cors" });
    if (!res.ok) return null;
    const bmp = await createImageBitmap(await res.blob());
    const scale = Math.min(1, px / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    return { data: c.toDataURL("image/jpeg", 0.78), w, h };
  } catch {
    return null;
  }
}

async function loadAll<T, R>(items: T[], fn: (t: T) => Promise<R>, onEach: () => void, signal?: AbortSignal, limit = 6) {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
      const i = next++;
      out[i] = await fn(items[i]);
      onEach();
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

export async function buildCataloguePdf(req: CatalogueRequest, onProgress: Progress, signal?: AbortSignal) {
  onProgress(0, req.slugs.length, "data");
  const [{ jsPDF }, data, regular, bold, display] = await Promise.all([
    import("jspdf"),
    fetch("/api/catalogue-data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slugs: req.slugs }), signal }).then(
      (r) => r.json() as Promise<{ items?: CatalogueItem[]; error?: string }>,
    ),
    fontBase64("/fonts/Inter-Regular.ttf"),
    fontBase64("/fonts/Inter-Bold.ttf"),
    fontBase64("/fonts/Playfair-SemiBold.ttf"),
  ]);
  if (!data.items) throw new Error(data.error || "Could not load products");
  const items = data.items;
  const origin = window.location.origin;

  let done = 0;
  const logo = await imageData("/logo-horizontal.png", 900);
  const images = await loadAll(items, (it) => (it.image ? imageData(it.image) : Promise.resolve(null)), () => onProgress(++done, items.length, "images"), signal);

  onProgress(0, items.length, "pages");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  doc.addFileToVFS("Inter-Regular.ttf", regular);
  doc.addFont("Inter-Regular.ttf", "Inter", "normal");
  doc.addFileToVFS("Inter-Bold.ttf", bold);
  doc.addFont("Inter-Bold.ttf", "Inter", "bold");
  doc.addFileToVFS("Playfair-SemiBold.ttf", display);
  doc.addFont("Playfair-SemiBold.ttf", "Playfair", "normal");
  doc.setProperties({ title: `${req.title} — ${SITE.name} catalogue`, author: SITE.name, creator: SITE.name });

  const W = MM.w - MM.m * 2;
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  // ── header on the first page
  let y = MM.m;
  if (logo) {
    const lw = 62;
    doc.addImage(logo.data, "JPEG", MM.m, y, lw, (lw * logo.h) / logo.w);
  }
  doc.setFont("Inter", "normal").setFontSize(8.5).setTextColor(...MUTED);
  doc.text([SITE.phone, SITE.email, origin.replace(/^https?:\/\//, "")], MM.w - MM.m, y + 3, { align: "right", lineHeightFactor: 1.45 });
  y += 20;
  doc.setDrawColor(...GOLD).setLineWidth(0.6).line(MM.m, y, MM.w - MM.m, y);
  y += 10;
  doc.setFont("Playfair", "normal").setFontSize(22).setTextColor(...INK);
  const titleLines = doc.splitTextToSize(req.title, W) as string[];
  doc.text(titleLines, MM.m, y);
  y += titleLines.length * 8.5;
  doc.setFont("Inter", "normal").setFontSize(9.5).setTextColor(...MUTED);
  const sub = [`${items.length} product${items.length === 1 ? "" : "s"} · Prices as on ${date}`, req.subtitle].filter(Boolean).join(" · ");
  const subLines = doc.splitTextToSize(sub, W) as string[];
  doc.text(subLines, MM.m, y);
  y += subLines.length * 4.6 + 6;

  // ── product rows
  const bottom = MM.h - 18;
  items.forEach((it, i) => {
    if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
    if (y + ROW_H > bottom) {
      doc.addPage();
      y = MM.m + 2;
    }
    const url = `${origin}/product/${it.slug}`;
    // photo
    const box = 38;
    doc.setFillColor(248, 244, 238).roundedRect(MM.m, y, box, box, 2, 2, "F");
    const img = images[i];
    if (img) {
      const s = Math.min((box - 4) / img.w, (box - 4) / img.h);
      const iw = img.w * s;
      const ih = img.h * s;
      doc.addImage(img.data, "JPEG", MM.m + (box - iw) / 2, y + (box - ih) / 2, iw, ih);
    }
    doc.link(MM.m, y, box, box, { url });

    // text column
    const x = MM.m + box + 6;
    const tw = W - box - 6 - 40;
    let ty = y + 3.5;
    doc.setFont("Inter", "bold").setFontSize(7).setTextColor(...GOLD);
    doc.text(it.brand.toUpperCase(), x, ty);
    ty += 4.6;
    doc.setFont("Inter", "bold").setFontSize(10.5).setTextColor(...INK);
    const nm = (doc.splitTextToSize(it.name, tw) as string[]).slice(0, 2);
    doc.textWithLink(nm[0], x, ty, { url });
    if (nm[1]) doc.textWithLink(nm[1], x, ty + 4.6, { url });
    ty += nm.length * 4.6;
    if (it.sku) {
      doc.setFont("Inter", "normal").setFontSize(7.5).setTextColor(...MUTED);
      doc.text(`Code: ${it.sku}`, x, ty);
      ty += 3.8;
    }
    doc.setFont("Inter", "normal").setFontSize(8).setTextColor(...INK);
    const lines: string[] = [];
    const short = it.short && !it.highlights.some((h) => h.toLowerCase() === it.short.toLowerCase()) ? it.short : "";
    if (short) lines.push(...(doc.splitTextToSize(short, tw) as string[]).slice(0, 1));
    const highlights = it.highlights.filter((h) => !(it.sku && h.toLowerCase().includes(it.sku.toLowerCase())));
    for (const h of highlights) lines.push(...(doc.splitTextToSize(`•  ${h}`, tw) as string[]).slice(0, 1));
    const room = Math.max(0, Math.floor((y + box - ty) / 3.7));
    lines.slice(0, room).forEach((l, k) => doc.text(l, x, ty + 0.6 + k * 3.7));

    // price column
    const px = MM.w - MM.m;
    if (it.price != null) {
      doc.setFont("Inter", "normal").setFontSize(7).setTextColor(...MUTED);
      doc.text(it.from ? "From" : "Price", px, y + 4, { align: "right" });
      doc.setFont("Inter", "bold").setFontSize(13).setTextColor(...MAROON);
      doc.text(inr(it.price), px, y + 10, { align: "right" });
    } else {
      doc.setFont("Inter", "bold").setFontSize(9.5).setTextColor(...MAROON);
      doc.text("Price on request", px, y + 8, { align: "right" });
    }
    const quote = `https://wa.me/${SITE.phoneRaw}?text=${encodeURIComponent(`Hi ${SITE.name}, I'd like a quote for "${it.name}"${it.sku ? ` (${it.sku})` : ""}.`)}`;
    doc.setFont("Inter", "normal").setFontSize(7.5).setTextColor(...MAROON);
    doc.textWithLink(it.price != null ? "Bulk / logo quote ›" : "Get a quote ›", px, y + 16, { url: quote, align: "right" });

    y += ROW_H;
    if (i < items.length - 1 && y + ROW_H <= bottom) doc.setDrawColor(...LINE).setLineWidth(0.25).line(MM.m, y - 4, MM.w - MM.m, y - 4);
    if (i % 25 === 0) onProgress(i, items.length, "pages");
  });

  // ── footer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...LINE).setLineWidth(0.3).line(MM.m, MM.h - 12, MM.w - MM.m, MM.h - 12);
    doc.setFont("Inter", "normal").setFontSize(7.5).setTextColor(...MUTED);
    doc.text(`${SITE.name} · ${SITE.phone} · ${SITE.email}`, MM.m, MM.h - 7.5);
    doc.text(`${req.title} · Page ${p} of ${pages}`, MM.w - MM.m, MM.h - 7.5, { align: "right" });
  }

  const file = `${SITE.name}-${req.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}-catalogue.pdf`;
  doc.save(file);
  return { count: items.length, file };
}
