"""Add the Trophy Studio range (trophystudio.in) to src/data/catalog.json under the "Trophies" category.

Usage: python -I build_trophies.py <decoded data.json> <downloaded images dir> <repo root>

- data.json: the site's catalogue feed (its server function response, decoded to plain JSON).
- One store product per design ("variant" base code); each size/colour code becomes a selectable option
  with its own price. All 425 codes the site lists are kept as options.
- Only the 16 materials the site shows; its hidden groups (Personalised Gifts, Office Stationery,
  Home Appliances return "Material not found" on the site) are skipped.
- Re-runnable: replaces any existing Trophy Studio products.
"""
import json, os, re, sys
from collections import OrderedDict
from PIL import Image

DATA, RAW, ROOT = sys.argv[1], sys.argv[2], sys.argv[3]
BRAND = "Trophy Studio"
CATEGORY = "Trophies"
CATALOG = "Trophy Studio Catalogue 2026"
FOLDER = "trophystudio"
HIDDEN = {"Personalised Gifts", "OFFICE STATIONERY", "Home Appliances"}
TAG_ONLY = {"New Arrival": "new-arrival", "On Discount": "on-discount"}

# material -> (subcategory, product noun)
MATERIAL = {
    "CRYSTAL": ("Crystal Trophies", "Crystal Trophy"),
    "CRYSTAL GLASS": ("Crystal Glass Awards", "Crystal Glass Award"),
    "CRYSTAL BLOCKS": ("3D Crystal Blocks", "3D Crystal Block"),
    "CRYSTAL+METAL": ("Crystal & Metal Trophies", "Crystal & Metal Trophy"),
    "WOOD+ CRYSTAL": ("Wood & Crystal Awards", "Wood & Crystal Award"),
    "CRYSTAL+ GRANITE": ("Crystal & Granite Awards", "Crystal & Granite Award"),
    "POLY-RESIN+ CRYSTAL": ("Poly-Resin & Crystal Trophies", "Poly-Resin & Crystal Trophy"),
    "ACRYLIC": ("Acrylic Trophies", "Acrylic Trophy"),
    "WOOD": ("Wooden Awards & Plaques", "Wooden Award"),
    "WOOD+ACRYLIC": ("Wood & Acrylic Awards", "Wood & Acrylic Award"),
    "WOOD+METAL": ("Wood & Metal Trophies", "Wood & Metal Trophy"),
    "FRAME": ("Frame Awards", "Frame Award"),
    "METAL MEDAL": ("Metal Medals", "Metal Medal"),
    "ABS": ("ABS Trophies", "ABS Trophy"),
    "New Arrival": ("New Arrivals", "Trophy"),
    "On Discount": ("On Discount", "Trophy"),
}
MATERIAL_LABEL = {
    "CRYSTAL": "Crystal", "CRYSTAL GLASS": "Crystal glass", "CRYSTAL BLOCKS": "Crystal block", "CRYSTAL+METAL": "Crystal & metal",
    "WOOD+ CRYSTAL": "Wood & crystal", "CRYSTAL+ GRANITE": "Crystal & granite", "POLY-RESIN+ CRYSTAL": "Poly-resin & crystal",
    "ACRYLIC": "Acrylic", "WOOD": "Wood", "WOOD+ACRYLIC": "Wood & acrylic", "WOOD+METAL": "Wood & metal", "FRAME": "Frame",
    "METAL MEDAL": "Metal", "ABS": "ABS",
}


def clean(s):
    return re.sub(r"\s+", " ", str(s or "").replace('\\"', '"').replace("\\", "")).strip()


def price_of(s):
    m = re.search(r"[\d,]+(?:\.\d+)?", str(s or ""))
    if not m:
        return None
    v = float(m.group(0).replace(",", ""))
    return int(round(v)) if v > 0 else None


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:90]


def img_id(u):
    m = re.search(r"id=([\w-]+)", u or "")
    return m.group(1) if m else None


def save_image(iid):
    """Full-size WebP (max 1600px) + 640px thumbnail, like the rest of the catalogue."""
    src = os.path.join(RAW, iid + ".img")
    if not os.path.exists(src):
        return None
    name = f"ts-{iid[:16].lower().replace('_', '-')}"
    out = os.path.join(ROOT, "public", "catalog", FOLDER, name + ".webp")
    thumb = os.path.join(ROOT, "public", "thumbs", FOLDER, name + ".webp")
    if not os.path.exists(out) or not os.path.exists(thumb):
        im = Image.open(src).convert("RGB")
        im.thumbnail((1600, 1600), Image.LANCZOS)
        im.save(out, "WEBP", quality=86, method=5)
        t = im.copy()
        t.thumbnail((640, 640), Image.LANCZOS)
        t.save(thumb, "WEBP", quality=80, method=5)
    return f"/catalog/{FOLDER}/{name}.webp"


os.makedirs(os.path.join(ROOT, "public", "catalog", FOLDER), exist_ok=True)
os.makedirs(os.path.join(ROOT, "public", "thumbs", FOLDER), exist_ok=True)

rows = [p for p in json.load(open(DATA, encoding="utf-8"))["result"]["products"] if p["material"] not in HIDDEN]

# one entry per code: its real material (not New Arrival / On Discount), plus tags
codes = OrderedDict()
for p in rows:
    c = clean(p["code"])
    e = codes.setdefault(c, {"row": p, "materials": [], "tags": set()})
    if p["material"] in TAG_ONLY:
        e["tags"].add(TAG_ONLY[p["material"]])
    else:
        e["materials"].append(p["material"])
        e["row"] = p

# group codes into designs
designs = OrderedDict()
for c, e in codes.items():
    base = clean(e["row"]["variant"]) or c
    designs.setdefault(base, []).append((c, e))

products = []
for base, items in designs.items():
    mats = [m for _, e in items for m in e["materials"]]
    mat = mats[0] if mats else ("New Arrival" if any("new-arrival" in e["tags"] for _, e in items) else "On Discount")
    sub, noun = MATERIAL[mat]
    if mat in ("WOOD", "WOOD+METAL", "FRAME") and base.upper().startswith("FP"):
        noun = {"WOOD": "Wooden Plaque", "WOOD+METAL": "Wood & Metal Plaque", "FRAME": "Frame Plaque"}[mat]
    if mat in ("New Arrival", "On Discount") and re.fullmatch(r"T\s?(37|38|39|40|41|42)", base):
        noun = "Number Trophy"
    name = f"{noun} {base}"

    variants, images, stock, seen_labels = [], [], 0, set()
    sizes = []
    for code, e in items:
        r = e["row"]
        pr = price_of(r["price"])
        size = clean(r["size"])
        suffix = clean(re.sub(r"^" + re.escape(base), "", code, flags=re.I)).replace("new ", "").strip(" -")
        label = " · ".join(x for x in (suffix.title() if suffix and not re.fullmatch(r"[A-Z]", suffix) else suffix, size) if x) or code
        if label in seen_labels:
            label = f"{label} ({code})"
        seen_labels.add(label)
        if pr:
            variants.append({"id": slug(code), "label": label, "price": pr})
        if size and size not in sizes:
            sizes.append(size)
        q = str(r.get("qty") or "").strip()
        stock += int(q) if q.isdigit() else 25
        for u in (r.get("images") or []):
            iid = img_id(u)
            if iid and iid not in images:
                images.append(iid)
    image_urls = [u for u in (save_image(i) for i in images) if u]
    if not image_urls:
        image_urls = ["/placeholder.svg"]

    row = items[0][1]["row"]
    branding = clean(row.get("branding"))
    m = re.search(r"Approx\.?\s*Branding Cost\s*([\d,]+)\s*-\s*([\d,]+)", branding, re.I)
    branding_note = f"Branding & GST extra (approx. branding cost ₹{m.group(1)}–₹{m.group(2)})" if m else (branding.replace("Gst", "GST") or "GST extra")
    material_label = MATERIAL_LABEL.get(mat)
    tags = sorted({t for _, e in items for t in e["tags"]}) + ["trophies", slug(sub)]
    prices = sorted(v["price"] for v in variants)
    size_txt = ", ".join(sizes)

    short = f"{material_label + ' award' if material_label else 'Award'} · {len(variants)} option{'s' if len(variants) != 1 else ''}" if len(variants) > 1 else (f"{material_label} award · {size_txt}" if material_label and size_txt else size_txt or "Trophy")
    highlights = [h for h in [
        f"Material: {material_label}" if material_label else None,
        f"Available sizes: {size_txt}" if size_txt else None,
        f"{len(variants)} options to choose from" if len(variants) > 1 else None,
        "Custom engraving / printing with your name, logo and message",
        branding_note,
        "Bulk orders: contact us for delivery timelines" if clean(row.get("comment")) else None,
    ] if h]
    desc = (
        f"{name} from the Trophy Studio collection — a {'' if not material_label else material_label.lower() + ' '}award for corporate recognition, "
        f"sports, events and achievements. "
        + (f"Available in {len(variants)} options ({', '.join(v['label'] for v in variants)}). " if len(variants) > 1 else (f"Size: {size_txt}. " if size_txt else ""))
        + f"{branding_note}."
    )
    specs = [{"label": "Model / SKU", "value": base}]
    if material_label:
        specs.append({"label": "Material", "value": material_label})
    if size_txt:
        specs.append({"label": "Size", "value": size_txt})
    specs.append({"label": "Branding", "value": branding_note})

    pid = slug(f"trophy-studio-{base}")
    products.append({
        "id": pid, "slug": pid, "name": name, "brand": BRAND, "category": CATEGORY, "subcategory": sub,
        "price": prices[0] if prices else None, "mrp": prices[0] if prices else None, "sku": base,
        "shortDescription": short, "description": desc, "highlights": highlights, "specs": specs,
        "variants": variants if len(variants) > 1 else [], "images": image_urls, "tags": tags,
        "catalog": CATALOG, "stock": stock, "priceOnRequest": not prices,
    })

path = os.path.join(ROOT, "src", "data", "catalog.json")
cat = json.load(open(path, encoding="utf-8"))
kept = [p for p in cat["products"] if p.get("brand") != BRAND]
taken = {p["slug"] for p in kept}
for p in products:
    assert p["slug"] not in taken, p["slug"]
allp = kept + products


def rebuild(ps):
    cats, brands = OrderedDict(), OrderedDict()
    for p in ps:
        c = cats.setdefault(p["category"], {"name": p["category"], "slug": slug(p["category"]), "subcategories": OrderedDict(), "count": 0, "image": p["images"][0]})
        c["count"] += 1
        c["subcategories"][p["subcategory"]] = c["subcategories"].get(p["subcategory"], 0) + 1
        b = brands.setdefault(p["brand"], {"name": p["brand"], "slug": slug(p["brand"]), "count": 0})
        b["count"] += 1
    return ([{**c, "subcategories": [{"name": k, "slug": slug(k), "count": v} for k, v in c["subcategories"].items()]} for c in cats.values()], list(brands.values()))


cat["products"] = allp
cat["categories"], cat["brands"] = rebuild(allp)
json.dump(cat, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"trophy designs {len(products)}, options {sum(max(1, len(p['variants'])) for p in products)}, codes {len(codes)}, total products {len(allp)}")
from collections import Counter
print(Counter(p["subcategory"] for p in products).most_common())
print("no photo:", [p["name"] for p in products if p["images"] == ["/placeholder.svg"]])
print("price on request:", [p["name"] for p in products if p["priceOnRequest"]])
