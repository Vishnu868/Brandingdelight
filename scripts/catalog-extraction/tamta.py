"""Tamta: pair each #CODE with its spec lines and its bottle photo, render the photo clip.
Usage: tamta.py <outdir> <json-out> [preview-dir]"""
import fitz, sys, os, re, json
from PIL import Image

doc = fitz.open(r"V:\Chidhvianna\ecommerce\catalogs\Tamta copper range.pdf")
outd = sys.argv[1]; os.makedirs(outd, exist_ok=True)
prev = sys.argv[3] if len(sys.argv) > 3 else None
if prev: os.makedirs(prev, exist_ok=True)
SERIES = {"P": ("Tamra", "Plain Copper Bottle"), "H": ("Tatva", "Hand-Crafted Hammered Copper Bottle"),
          "A": ("Tavya", "Antique Heritage Print Copper Bottle"), "V": ("Tura", "Earth Vein Copper Bottle"),
          "E": ("Etching", "Heritage Etched Copper Bottle"), "T": ("Tivra", "Silk Finish Copper Bottle"),
          "S": ("Surai", "Handcrafted Matka Copper Surai"), "C": ("Tanmaya Set", "Copper Combo Gift Set")}
items = []
for pno in range(doc.page_count):
    p = doc[pno]
    W, H = p.rect.width, p.rect.height
    spans = []
    for b in p.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            t = "".join(s["text"] for s in l["spans"]).strip()
            if t:
                x0, y0, x1, y1 = l["bbox"]
                spans.append((t, (x0 + x1) / 2, (y0 + y1) / 2, l["bbox"]))
    codes = [(re.search(r"#\s*([A-Z])\s*(\d{3})", t), x, y, bb) for t, x, y, bb in spans]
    codes = [(m.group(1) + m.group(2), x, y, bb) for m, x, y, bb in codes if m]
    seen = {}
    for c in codes:
        seen.setdefault(c[0], c)
    codes = list(seen.values())
    if not codes:
        continue
    specs = {c[0]: [] for c in codes}
    for t, x, y, bb in spans:
        if re.search(r"CAPACITY|FINISH|HAMMER|DIAMOND|MOQ|MRP|MEENA|MONOCARTON|ml\b", t, re.I):
            best = min(codes, key=lambda c: (abs(y - c[2]) + 0.6 * abs(x - c[1])) if y > c[2] - 5 else 1e9)
            specs[best[0]].append((y, t))
    # bottle photos
    imgs = []
    for im in p.get_images(full=True):
        for r in p.get_image_rects(im[0]):
            if 0.25 * W < r.width < 0.66 * W and 0.2 * H < r.height < 0.75 * H:
                imgs.append((r, im[0], im[1]))
    for code, cx, cy, bb in codes:
        lines = [t for _, t in sorted(specs[code])]
        txt = " | ".join(lines)
        mrp = re.search(r"MRP\s*:?\s*([\d,]+)", txt)
        cap = re.search(r"CAPACITY\s*-?\s*(\d+\s*ml)", txt, re.I)
        fin = [l for l in lines if re.search(r"FINISH|HAMMER|DIAMOND|MEENA", l, re.I) and "CAPACITY" not in l.upper()]
        if not imgs:
            continue
        r, xref, smask = min(imgs, key=lambda q: (abs((q[0].x0 + q[0].x1) / 2 - cx) + abs((q[0].y0 + q[0].y1) / 2 - cy)))
        pix = fitz.Pixmap(doc, xref)
        if smask:
            pix = fitz.Pixmap(pix, fitz.Pixmap(doc, smask))
        if pix.n - pix.alpha >= 4:
            pix = fitz.Pixmap(fitz.csRGB, pix)
        img = Image.frombytes("RGBA" if pix.alpha else "RGB", (pix.width, pix.height), pix.samples).convert("RGBA")
        bbox = img.getchannel("A").point(lambda v: 255 if v > 10 else 0).getbbox()
        if bbox:
            img = img.crop(bbox)
        side = int(max(img.size) * 1.08)
        sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        sq.paste(img, ((side - img.width) // 2, (side - img.height) // 2), img)
        slug = f"tamta-{code.lower()}"
        sq.save(os.path.join(outd, slug + ".webp"), "WEBP", quality=92, method=6)
        if prev:
            bgw = Image.new("RGB", sq.size, "white"); bgw.paste(sq, (0, 0), sq); bgw.resize((240, 240)).save(os.path.join(prev, slug + ".jpg"), quality=70)
        ser = SERIES.get(code[0], ("Tamta", "Copper Bottle"))
        items.append({"code": code, "page": pno + 1, "series": ser[0], "type": ser[1],
                      "mrp": int(mrp.group(1).replace(",", "")) if mrp else None,
                      "capacity": cap.group(1).replace(" ", "") if cap else None,
                      "finish": fin[0].title() if fin else None, "image": slug})
json.dump(items, open(sys.argv[2], "w"), indent=1)
print(len(items))
for i in items:
    print(i["page"], i["code"], i["mrp"], i["capacity"], i["finish"])
