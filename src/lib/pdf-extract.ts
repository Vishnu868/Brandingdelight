/**
 * Free, in-browser product extraction from a catalogue PDF page — no paid service, no server.
 *
 * 1. Text: read from the PDF itself (positions + font sizes). Image-only / scanned pages fall back to
 *    Tesseract OCR (open source, runs in the browser).
 * 2. Photos: the exact boxes of the images drawn on the page, from the PDF drawing commands.
 * 3. Products: big-font lines (titles), prices and codes act as anchors; every other line and every photo
 *    goes to its nearest anchor. Results go to a review list, so the admin corrects anything that is off.
 */
import type { PDFPageProxy, PageViewport } from "pdfjs-dist";

export type Box = { x0: number; y0: number; x1: number; y1: number }; // fractions of the page
export type Extracted = { name: string; brand: string; code: string; price: number | null; description: string; features: string[]; category: string; photo: Box | null };
type Line = { text: string; x0: number; y0: number; x1: number; y1: number; size: number; conf?: number; bullet?: boolean }; // canvas px
type Pdfjs = typeof import("pdfjs-dist");

const PRICE = /(?:₹|\bRs\.?|\bINR|\bMRP)\s*[:.\-]?\s*(?:₹|Rs\.?)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i;
const PRICE_TAIL = /\b([0-9][0-9,]{2,})\s*\/-/; // "1,199/-"
const SIZE = /^[\d.,/ x×-]+\s*(?:ml|ltrs?\.?|litres?|liters?|l|pcs?\.?|pieces?|set|jars?|watts?|w|gb|tb|mah|kg|g|gm|cm|mm|inch|inches|")\b.*$/i; // "700 ML", "2 Pcs Set", "2.8 Ltrs."
const CODE_LABELLED = /\b(?:product\s*code|item\s*code|style\s*code|model\s*(?:no\.?|number)?|item\s*no\.?|art(?:icle)?\s*no\.?|sku|code)\s*[:#.\-]?\s*([A-Z0-9][A-Z0-9\-\/. ]{0,18}[A-Z0-9])/i;
const CODE_ALONE = /^(?:[A-Z]{1,5}[- ]?\d{1,5}[A-Z]{0,3}(?:[- ]\d{1,3})?|\d{3,6}[- ]?[A-Z]{1,3})$/;
const BULLET = /^\s*[•●▪■◦\-–*✓✔➤►»·]\s*/;
const JUNK = /^(www\.|https?:|page\s*\d+|\d{1,3}$)|@.+\.(com|in)|\+91|catalogue|catalog|all rights reserved|^(includes?|features?|specifications?|branding options?|model no\.?|key features|product details)\s*:?$/i;

const CATEGORY_HINTS: [RegExp, string[]][] = [
  [/hamper|gift box|chocolate|sweets|dry fruit|almond|cashew/i, ["Festive Hampers & Gift Boxes", "Gourmet & Chocolates", "Dry Fruits & Nuts"]],
  [/gift set|combo|executive kit|kit\b/i, ["Corporate Gift Sets"]],
  [/brass|idol|diya|puja|pooja|bell|urli|vase|candle stand|handicraft/i, ["Brass Decor & Pooja"]],
  // specific product types before broad words (a blender "with USB charging" is still an appliance)
  [/kettle|mixer|grinder|blender|juicer|toaster|oven|fryer|iron\b|steamer|cooktop|sandwich|chopper|\bfan\b/i, ["Home & Kitchen Appliances"]],
  [/lunch ?box|tiffin|cookware|kadai/i, ["Cookware & Kitchen Tools", "Home & Kitchen Appliances"]],
  [/copper/i, ["Copper Collection"]],
  [/bottle|flask|mug|tumbler|sipper|cup\b|glass/i, ["Drinkware & Bottles"]],
  [/notebook|diary|planner|organi[sz]er|\bpen\b|pens\b|journal/i, ["Stationery & Notebooks"]],
  [/speaker|earbud|headphone|neckband|soundbar|smart ?watch|projector/i, ["Audio & Smart Gadgets"]],
  [/backpack|bag\b|duffle|trolley|luggage|suitcase|wallet|card holder|pouch/i, ["Travel & Luggage"]],
  [/power ?bank|charger|cable|adapter|pen ?drive|usb|mouse|keyboard|mobile stand|phone holder/i, ["Mobile & Tech Accessories"]],
  [/lamp|clock|desk|calendar|planter/i, ["Desk & Office"]],
  [/massager|wellness|scale|thermometer/i, ["Health & Wellness"]],
];

/** Ligatures (ti, tt, ft…) that a PDF font doesn't map come out as U+0000: restore them from context. */
const ligatures = (s: string) =>
  s.includes("\u0000")
    ? s
        .replace(/gi\u0000/gi, (m) => m.slice(0, 2) + "ft") // Gift
        .replace(/a\u0000er/gi, (m) => m[0] + "fter") // after
        .replace(/\u0000(?=(?:le|les|er|ers|ery|ing|on)\b)/g, (m, i, str: string) => (/(?:bo|li|ba|se|le|ma|bu)$/i.test(str.slice(0, i)) ? "tt" : "ti")) // bottle, battery / edition
        .replace(/\u0000/g, "ti") // Executive, Collection, Edition
    : s;
const clean = (s: string) => ligatures(s).replace(/\s+/g, " ").replace(/­/g, "").trim();
const isCaps = (s: string) => s === s.toUpperCase() && /[A-Z]{3}/.test(s);
function titleCase(s: string) {
  if (!isCaps(s)) return s;
  const small = new Set(["and", "with", "for", "of", "in", "on", "the", "to", "a", "&"]);
  return s
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i && small.has(w) ? w : /\d/.test(w) && w.length <= 6 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ")
    .replace(/\bMah\b/g, "mAh")
    .replace(/\b(Usb|Led|Rgb|Tws|Pu|Ss|Rfid|Otg|Hd|Bt)\b/g, (m) => m.toUpperCase());
}
const parsePrice = (t: string) => {
  const m = t.match(PRICE) || t.match(PRICE_TAIL);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, "").replace(/\.$/, ""));
  return Number.isFinite(n) && n >= 10 && n < 10_000_000 ? Math.round(n) : null;
};
/** OCR reads 0 as O and 1 as I/l inside codes: fix them where they touch a digit ("BHB8OWO7" -> "BHB80W07"). */
const fixCode = (c: string) => c.replace(/(?<=\d)[Oo]|[Oo](?=\d)/g, "0").replace(/(?<=\d)[Il]|[Il](?=\d)/g, "1");
const parseCode = (t: string) => {
  const m = t.match(CODE_LABELLED);
  if (m) return fixCode(clean(m[1]).replace(/[.\-]$/, ""));
  const s = clean(t);
  return CODE_ALONE.test(fixCode(s)) && !SIZE.test(s) ? fixCode(s) : null;
};

/* ───────── text lines ───────── */

function linesFromPdf(pdfjs: Pdfjs, items: { str: string; transform: number[]; width: number }[], vp: PageViewport): Line[] {
  const frags = items
    .filter((i) => i.str.trim())
    .map((i) => {
      const t = pdfjs.Util.transform(vp.transform, i.transform);
      const size = Math.hypot(t[2], t[3]);
      const x0 = t[4];
      return { text: i.str, x0, x1: x0 + i.width * vp.scale, base: t[5], size };
    })
    .sort((a, b) => a.base - b.base || a.x0 - b.x0);
  const lines: Line[] = [];
  for (const f of frags) {
    const l = lines.find((l) => Math.abs(l.y1 - f.base) < Math.max(2, f.size * 0.35) && f.x0 - l.x1 < f.size * 1.6 && f.x0 >= l.x0 - 2);
    if (l) {
      l.text += (f.x0 - l.x1 > f.size * 0.15 && !l.text.endsWith(" ") ? " " : "") + f.text;
      l.x1 = Math.max(l.x1, f.x1);
      l.size = Math.max(l.size, f.size);
    } else lines.push({ text: f.text, x0: f.x0, x1: f.x1, y0: f.base - f.size, y1: f.base, size: f.size });
  }
  return lines.map((l) => ({ ...l, text: clean(l.text) })).filter((l) => l.text.length > 1);
}

type OcrWord = { text: string; confidence: number; bbox: Box };
type OcrWorker = { recognize: (img: HTMLCanvasElement) => Promise<{ data: { lines: (OcrWord & { words: OcrWord[] })[] } }>; terminate: () => Promise<unknown> };
let ocr: Promise<OcrWorker> | null = null;
export function getOcr() {
  ocr ??= import("tesseract.js").then((t) => t.createWorker("eng") as unknown as Promise<OcrWorker>);
  return ocr;
}
export async function closeOcr() {
  if (ocr) (await ocr).terminate();
  ocr = null;
}

/** Real words, not OCR noise read off a photo: mostly letters/digits and at least one 3-letter word. */
const wordy = (t: string) => {
  const alnum = (t.match(/[a-z0-9]/gi) ?? []).length;
  return alnum >= 3 && alnum / t.replace(/\s/g, "").length >= 0.7 && /[a-z]{3}/i.test(t);
};

/** Grayscale copy, optionally inverted: OCR misses white text on coloured banners unless it is inverted. */
function prepared(canvas: HTMLCanvasElement, invert: boolean) {
  const c = document.createElement("canvas");
  c.width = canvas.width;
  c.height = canvas.height;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.filter = `grayscale(1) contrast(1.4)${invert ? " invert(1)" : ""}`;
  ctx.drawImage(canvas, 0, 0);
  return c;
}

const OCR_BULLET = /^(?:[eo«»•*·©®|]\s+)+/; // how OCR reads round bullets: "e Built-in…", "o 360° swivel…"

async function linesFromOcr(canvas: HTMLCanvasElement): Promise<Line[]> {
  const worker = await getOcr();
  const out: Line[] = [];
  const overlaps = (a: Line, b: Line) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
  const score = (l: Line) => (l.conf ?? 0) * Math.min(l.text.length, 40);
  for (const invert of [false, true]) {
    const { data } = await worker.recognize(prepared(canvas, invert));
    // a row of grid labels ("AS-4   ASH-3   AT-2") comes back as one line: split it at wide gaps
    const segments = data.lines.flatMap((l) => {
      const h = l.bbox.y1 - l.bbox.y0;
      const groups: OcrWord[][] = [];
      for (const w of l.words ?? []) {
        const last = groups[groups.length - 1];
        if (last && w.bbox.x0 - last[last.length - 1].bbox.x1 < h * 1.5) last.push(w);
        else groups.push([w]);
      }
      if (groups.length < 2) return [l];
      return groups.map((g) => ({
        text: g.map((w) => w.text).join(" "),
        confidence: g.reduce((a, w) => a + w.confidence, 0) / g.length,
        bbox: { x0: g[0].bbox.x0, y0: Math.min(...g.map((w) => w.bbox.y0)), x1: g[g.length - 1].bbox.x1, y1: Math.max(...g.map((w) => w.bbox.y1)) },
      }));
    });
    for (const l of segments) {
      let text = clean(l.text).replace(/^[^a-z0-9₹•]+/i, "").replace(/[^a-z0-9.)%"₹/-]+$/i, "");
      const bullet = OCR_BULLET.test(text);
      text = text.replace(OCR_BULLET, "");
      const isCode = CODE_ALONE.test(fixCode(text)) && !SIZE.test(text);
      if (l.confidence < (isCode ? 35 : 60) || !(wordy(text) || isCode)) continue;
      const line: Line = { text, x0: l.bbox.x0, y0: l.bbox.y0, x1: l.bbox.x1, y1: l.bbox.y1, size: (l.bbox.y1 - l.bbox.y0) * 0.8, conf: l.confidence, bullet };
      // both passes can read the same spot: keep whichever reading is more confident
      const clash = out.findIndex((o) => overlaps(o, line));
      if (clash >= 0) {
        if (score(line) > score(out[clash])) out[clash] = line;
        continue;
      }
      out.push(line);
    }
  }
  return out;
}

/* ───────── photo boxes from the drawing commands ───────── */

async function photoBoxes(pdfjs: Pdfjs, page: PDFPageProxy, vp: PageViewport): Promise<Box[]> {
  const ops = await page.getOperatorList();
  const { OPS, Util } = pdfjs;
  let ctm = [1, 0, 0, 1, 0, 0];
  const stack: number[][] = [];
  const boxes: Box[] = [];
  const W = vp.width, H = vp.height;
  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i];
    const args = ops.argsArray[i];
    if (fn === OPS.save) stack.push(ctm);
    else if (fn === OPS.restore) ctm = stack.pop() ?? ctm;
    else if (fn === OPS.transform) ctm = Util.transform(ctm, args);
    else if (fn === OPS.paintFormXObjectBegin) {
      stack.push(ctm);
      if (Array.isArray(args?.[0]) && args[0].length === 6) ctm = Util.transform(ctm, args[0]);
    } else if (fn === OPS.paintFormXObjectEnd) ctm = stack.pop() ?? ctm;
    else if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject || fn === OPS.paintImageXObjectRepeat) {
      const m = Util.transform(vp.transform, ctm);
      const pts = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => Util.applyTransform([x, y], m));
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      const b = { x0: Math.max(0, Math.min(...xs)) / W, y0: Math.max(0, Math.min(...ys)) / H, x1: Math.min(W, Math.max(...xs)) / W, y1: Math.min(H, Math.max(...ys)) / H };
      const area = (b.x1 - b.x0) * (b.y1 - b.y0);
      const ratio = (b.x1 - b.x0) / Math.max(1e-6, b.y1 - b.y0);
      if (area > 0.012 && area < 0.8 && ratio < 5 && ratio > 0.2) boxes.push(b);
    }
  }
  // drop near-duplicates (same image drawn twice, masks)
  return boxes.filter((b, i) => !boxes.some((o, j) => j < i && Math.abs(o.x0 - b.x0) < 0.01 && Math.abs(o.y0 - b.y0) < 0.01 && Math.abs(o.x1 - b.x1) < 0.01));
}

/** Text that is actually painted: some PDFs carry hidden text layers (left over from other templates). */
function inked(canvas: HTMLCanvasElement, l: Line) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return true;
  const x = Math.max(0, Math.floor(l.x0)), y = Math.max(0, Math.floor(l.y0));
  const w = Math.min(canvas.width - x, Math.ceil(l.x1 - l.x0)), h = Math.min(canvas.height - y, Math.ceil(l.y1 - l.y0 + l.size * 0.25));
  if (w < 2 || h < 2) return false;
  const d = ctx.getImageData(x, y, w, h).data;
  let min = 255, max = 0;
  for (let i = 0; i < d.length; i += 16) {
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    if (lum < min) min = lum;
    if (lum > max) max = lum;
  }
  return max - min > 40;
}

/** Re-join sentences that wrapped onto several lines in the same column. */
function joinWraps(ls: Line[]) {
  const out: Line[] = [];
  for (const l of [...ls].sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0)) {
    const p = out[out.length - 1];
    if (p && !l.bullet && !BULLET.test(l.text) && Math.abs(l.x0 - p.x0) < p.size * 1.5 && Math.abs(l.size - p.size) < p.size * 0.2 && l.y0 - p.y1 < p.size * 0.8 && l.y0 >= p.y0 && !/[.:!?]$/.test(p.text) && (/^[a-z(]/.test(l.text) || /[,&-]$/.test(p.text) || p.text.length > 30)) {
      p.text = `${p.text.replace(/-$/, "")}${p.text.endsWith("-") ? "" : " "}${l.text}`;
      p.y1 = l.y1;
      p.x1 = Math.max(p.x1, l.x1);
    } else out.push({ ...l });
  }
  return out;
}

/* ───────── grouping into products ───────── */

const area = (b: Box) => (b.x1 - b.x0) * (b.y1 - b.y0);
const centre = (b: Box) => [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2];
const gap = (b: Box, x: number, y: number) => Math.hypot(Math.max(b.x0 - x, 0, x - b.x1), Math.max(b.y0 - y, 0, y - b.y1));

export function suggestCategory(text: string, categories: string[]) {
  for (const [rx, cats] of CATEGORY_HINTS) if (rx.test(text)) return cats.find((c) => categories.includes(c)) ?? "";
  return "";
}

/**
 * Extract products from one rendered page. `canvas` must already show the page at `vp`.
 * `seenHeaders` collects lines that repeat on many pages (running headers/footers) across calls.
 */
export async function extractPage(
  pdfjs: Pdfjs,
  page: PDFPageProxy,
  vp: PageViewport,
  canvas: HTMLCanvasElement,
  opts: { brand: string; categories: string[]; seenHeaders: Map<string, number> },
): Promise<{ products: Extracted[]; ocr: boolean }> {
  const W = vp.width, H = vp.height;
  const text = await page.getTextContent();
  let lines = linesFromPdf(pdfjs, text.items as { str: string; transform: number[]; width: number }[], vp);
  const usedOcr = lines.map((l) => l.text).join("").length < 25;
  if (usedOcr) lines = await linesFromOcr(canvas);

  // "BREW PRO DRIP COFFEE MAKER Rs.3190/-": split the name from a price printed on the same line
  lines = lines.flatMap((l) => {
    const i = l.text.search(PRICE) >= 0 ? l.text.search(PRICE) : l.text.search(PRICE_TAIL);
    const before = i > 0 ? l.text.slice(0, i).replace(/[\s:|\-–]+$/, "") : "";
    if (!before || !wordy(before)) return [l];
    const cut = l.x0 + ((l.x1 - l.x0) * i) / l.text.length;
    return [{ ...l, text: before, x1: cut }, { ...l, text: l.text.slice(i), x0: cut }];
  });

  // running headers / footers: same text seen on 3+ earlier pages
  for (const k of new Set(lines.map((l) => l.text.toLowerCase()))) opts.seenHeaders.set(k, (opts.seenHeaders.get(k) ?? 0) + 1);
  lines = lines.filter((l) => (opts.seenHeaders.get(l.text.toLowerCase()) ?? 0) <= 3 && !JUNK.test(l.text) && (usedOcr || inked(canvas, l)));
  if (!lines.length) return { products: [], ocr: usedOcr };

  const photos = usedOcr ? [] : await photoBoxes(pdfjs, page, vp);
  const sizes = lines.map((l) => l.size).sort((a, b) => a - b);
  const body = sizes[Math.floor(sizes.length / 2)];

  // anchors: big lines that read like names
  const isNameLike = (l: Line) => !l.bullet && !SIZE.test(l.text) && l.text.length >= 3 && l.text.length <= 70 && /[a-z]/i.test(l.text) && !parsePrice(l.text) && !parseCode(l.text) && !BULLET.test(l.text) && !/^(features?|specifications?|includes?|branding|colou?rs?|available|capacity|material|dimensions?)\b/i.test(l.text);
  let titles = lines.filter((l) => l.size >= body * 1.3 && isNameLike(l));
  // stacked title lines (same size, directly below) become one title
  titles.sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0);
  const merged: Line[] = [];
  for (const t of titles) {
    const prev = merged.find((m) => Math.abs(m.size - t.size) < m.size * 0.15 && t.y0 - m.y1 < t.size * 0.9 && t.y0 >= m.y0 && Math.abs(t.x0 - m.x0) < m.size * 2);
    if (prev) {
      prev.text = `${prev.text} ${t.text}`;
      prev.y1 = t.y1;
      prev.x1 = Math.max(prev.x1, t.x1);
    } else merged.push({ ...t });
  }
  titles = merged;
  // the biggest title size marks product names; smaller "titles" are section labels unless they sit next to a price
  const topSize = Math.max(...titles.map((t) => t.size), 0);
  const priceLines = lines.filter((l) => parsePrice(l.text) != null);
  let anchors = titles.filter((t) => t.size >= topSize * 0.72 || priceLines.some((p) => Math.abs(p.y0 - t.y1) < t.size * 4 && Math.abs(p.x0 - t.x0) < W * 0.35));
  // code grid (e.g. 3×3 photos, each with only an item code under it): one product per code,
  // named "<page heading> <code>", photo = the cell above the code
  const codeLines = lines.filter((l) => parseCode(l.text) && l.text.length <= 24);
  if (codeLines.length >= 3 && anchors.length < codeLines.length / 2 && priceLines.length < codeLines.length / 2) {
    const heading = lines.filter((l) => isNameLike(l) && wordy(l.text)).sort((a, b) => b.size - a.size)[0]?.text ?? opts.brand;
    const cx = (l: Line) => (l.x0 + l.x1) / 2;
    const xs = [...new Set(codeLines.map((l) => Math.round(cx(l) / (W * 0.05))))].sort((a, b) => a - b).map((v) => v * W * 0.05);
    const ys = [...new Set(codeLines.map((l) => Math.round(l.y0 / (H * 0.03))))].sort((a, b) => a - b).map((v) => v * H * 0.03);
    const step = (v: number[], full: number) => (v.length > 1 ? Math.min(...v.slice(1).map((x, i) => x - v[i]).filter((d) => d > full * 0.04)) : full * 0.9);
    const colW = step(xs, W), rowH = step(ys, H);
    const products = codeLines.map((l) => {
      const code = parseCode(l.text)!;
      const c = cx(l);
      return {
        name: `${titleCase(heading)} ${code}`.trim(),
        brand: opts.brand,
        code,
        price: null,
        description: "",
        features: [],
        category: suggestCategory(heading, opts.categories),
        photo: { x0: Math.max(0, c - colW * 0.48) / W, x1: Math.min(W, c + colW * 0.48) / W, y0: Math.max(0, l.y0 - rowH * 0.92) / H, y1: Math.max(0, l.y0 - rowH * 0.03) / H },
      } satisfies Extracted;
    });
    return { products, ocr: usedOcr };
  }

  // scanned page with a single price and code: one product, named by its biggest heading
  if (usedOcr && priceLines.length <= 1 && lines.filter((l) => parseCode(l.text)).length <= 1) {
    // scanned page with one price/code: one product. Name = the most heading-like line in the top part of the page.
    const ocrTitle = (l: Line) =>
      isNameLike(l) && l.text.split(" ").filter((w) => /[a-z]{2}/i.test(w)).length >= 2 && l.y0 < H * 0.55
        ? l.size * ((l.conf ?? 60) / 100) * (isCaps(l.text) ? 1.4 : 1) * (/[,.;]$/.test(l.text) ? 0.6 : 1)
        : 0;
    const best = lines.reduce<Line | null>((a, l) => (ocrTitle(l) > (a ? ocrTitle(a) : 0) ? l : a), null);
    if (best) anchors = [best];
  }
  if (!anchors.length) {
    const best = lines.filter(isNameLike).sort((a, b) => b.size - a.size)[0];
    if (!best || (!priceLines.length && !photos.length && !lines.some((l) => parseCode(l.text)))) return { products: [], ocr: usedOcr };
    anchors.push(best);
  }

  // assign every line to the nearest anchor (lines below/right of a title count as closer)
  const dist = (a: Line, l: Line) => {
    const dx = Math.max(a.x0 - l.x1, 0, l.x0 - a.x1);
    const dy = l.y0 >= a.y0 ? Math.max(0, l.y0 - a.y1) : (a.y0 - l.y1) * 2.2;
    return Math.hypot(dx * 1.4, dy);
  };
  const groups = anchors.map((a) => ({ a, lines: [] as Line[], photos: [] as Box[] }));
  for (const l of lines) {
    if (anchors.includes(l)) continue;
    let best = groups[0], bd = Infinity;
    for (const g of groups) {
      const d = dist(g.a, l);
      if (d < bd) (bd = d), (best = g);
    }
    best.lines.push(l);
  }
  // each photo goes to the nearest anchor; a product keeps its largest photo
  for (const p of photos) {
    const [cx, cy] = centre(p);
    let best = groups[0], bd = Infinity;
    for (const g of groups) {
      const tb = { x0: g.a.x0 / W, y0: g.a.y0 / H, x1: g.a.x1 / W, y1: g.a.y1 / H };
      const d = gap(tb, cx, cy);
      if (d < bd) (bd = d), (best = g);
    }
    best.photos.push(p);
  }
  // no separate photos (scanned page or one big background image): use each product's area of the page
  const cellOf = (g: (typeof groups)[number]) => {
    if (groups.length === 1) return { x0: 0.02, y0: 0.02, x1: 0.98, y1: 0.98 };
    const pts: [number, number][] = [];
    for (let i = 0; i <= 40; i++)
      for (let j = 0; j <= 40; j++) {
        const x = (i / 40) * W, y = (j / 40) * H;
        const probe: Line = { text: "", x0: x, x1: x, y0: y, y1: y, size: 0 };
        let best = groups[0], bd = Infinity;
        for (const o of groups) {
          const d = dist(o.a, probe);
          if (d < bd) (bd = d), (best = o);
        }
        if (best === g) pts.push([x / W, y / H]);
      }
    if (!pts.length) return null;
    return { x0: Math.min(...pts.map((p) => p[0])), y0: Math.min(...pts.map((p) => p[1])), x1: Math.max(...pts.map((p) => p[0])), y1: Math.max(...pts.map((p) => p[1])) };
  };

  const products: Extracted[] = groups.map((g) => {
    const all = [g.a, ...g.lines].sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0);
    const joined = all.map((l) => l.text).join("\n");
    const price = all.map((l) => parsePrice(l.text)).find((p) => p != null) ?? null;
    const code = all.map((l) => parseCode(l.text)).find(Boolean) ?? "";
    const rest = joinWraps(g.lines).filter((l) => parsePrice(l.text) == null && parseCode(l.text) !== l.text && !(code && l.text.includes(code)) && l.text.length > 2);
    const features = rest.filter((l) => BULLET.test(l.text) || (l.text.length <= 60 && l.size <= body * 1.15)).map((l) => l.text.replace(BULLET, "")).filter((t) => t.length > 3);
    const description = rest.filter((l) => !BULLET.test(l.text) && l.text.length > 60).map((l) => l.text).join(" ");
    const name = titleCase(g.a.text.replace(/\s*[:\-|]\s*$/, "").replace(usedOcr ? /\s+(?:new|new arrival|\d)$/i : /\s+(?:new|new arrival)$/i, ""));
    const photo = g.photos.sort((a, b) => area(b) - area(a))[0] ?? cellOf(g);
    return {
      name,
      brand: opts.brand,
      code,
      price,
      description: clean(description).slice(0, 600),
      features: [...new Set(features)].slice(0, 8),
      category: suggestCategory(`${name} ${joined}`, opts.categories),
      photo,
    };
  });
  // the same name printed twice on a page (heading + label on the photo) is one product
  const byName = new Map<string, Extracted>();
  for (const p of products.filter((p) => p.name.length > 2)) {
    const k = p.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const o = byName.get(k);
    if (!o) byName.set(k, p);
    else {
      o.code ||= p.code;
      o.price ??= p.price;
      o.description ||= p.description;
      o.features = [...new Set([...o.features, ...p.features])].slice(0, 8);
      if (p.photo && (!o.photo || area(p.photo) > area(o.photo))) o.photo = p.photo;
    }
  }
  return { products: [...byName.values()], ocr: usedOcr };
}

