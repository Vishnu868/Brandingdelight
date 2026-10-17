"""Fur Jaden (The Shade Squad) bags & luggage — names/codes/MRP transcribed; features from OCR feature grid."""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lines import doc, wocr_lines
from crops import save_clip
import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
CAT = "Fur Jaden Sept 2026"
R = """1|BM38|The Trailblazer Backpack|4000
3|BM154|The Pathfinder Backpack|3500
5|BM83|Anti-Theft Backpack|2000
7|BM302|Urban Vault Backpack|2000
9|BM178|The Globetrotter Backpack|3000
11|MW69|Laptop Messenger Bag|4000
13|BM84|Weekender Travel Laptop Backpack|2000
15|BM95|Pro-V Laptop Backpack|7000
17|BM185|The Explorer Backpack|3799
19|BM176|The Urban Nomad Backpack|3499
21|BM174|The Navigator Backpack|4500
23|BM179|The Cloud Commuter Backpack|2999
25|BM88|The Wayfarer Backpack|5000
27|BM301|The Thinker Backpack|2000
29|BM304|Urban Heritage Backpack|2000
31|BM305|Urban Elite Backpack|2000
33|BM307|Urban Classic Backpack|2000
35|BM303|Urban Crest Backpack|2000
37|BM81|Travel Laptop Backpack|2500
39|BM92|Pro-II Laptop Backpack|6000
41|BM93|Pro-III Laptop Backpack|7000
43|BM162|The Nomad Backpack|5000
45|BM45|The Voyager Backpack|5000
46|BM99|The Cosmopolitan Backpack|5000
48|BM165|The Aviator Backpack|5000
50|BM170|The Urban Rebel Backpack|5000
52|BM173|The Voyager II Backpack|5000
54|BM163|The Wanderer Backpack|5000
55|DUFF05|Croc Weekender Duffle Bag|4000
57|DUFF30|Weekender Faux Leather Duffle|2000
59|DUFF50|Canvas Travel Duffle|4000
61|DUFF55|Travel Duffle Bag|3000
63|DUFF60|Textured Travel Duffle Bag|2500
65|DUFF75|30L Travel Duffle|2500
66|DUFF80|The Explorer Duffle|3000
68|DUFF76|The Weekender Duffle|2000
70|DUFF77|The Mariner Duffle Bag|4000
72|DUFF21|Weekender Duffle Bag|2000
74|DUFF22|Weekender Duffle Bag (Compact)|1000
76|MW67|GameFace Padel / Pickleball Bag|4500
78|MW65|Crossbody Sling Bag|2500
79|MW36|Leatherette Crossbody Sling Bag|1000
80|SC05|The Voyager Suitcase|12000
82|SC07|The Wayfarer Suitcase|14000
84|SC09|The Aviator Suitcase|11000
86|SC12|The Carbon Trunk Suitcase|6499
88|SC14|The Puffer Pop Suitcase|6999"""
FIX = [("I ", "| "), ("15.6\"", "15.6\""), ("Litres", "litres"), ("O Light", "Light"), ("Bag ", "Bag ")]


def grid(L):
    cells = []
    for col in (0.14, 0.39):
        ls = sorted([l for l in L if abs(l[1] - col) < 0.03 and 0.25 < l[2] < 0.555 and not re.search(r"\d+\s*cm|SIZES", l[5])], key=lambda l: l[2])
        cur, last = [], None
        for l in ls:
            if last is not None and l[2] - last > 0.022:
                cells.append((cur[0][2], col, cur)); cur = []
            cur.append(l); last = l[2]
        if cur:
            cells.append((cur[0][2], col, cur))
    out = []
    for y, c, ls in sorted(cells, key=lambda t: (round(t[0] / 0.05), t[1])):
        t = re.sub(r"\s+", " ", " ".join(l[5] for l in ls)).strip()
        t = re.sub(r"^[O0o•]\s+", "", t).replace("Earphones", "earphones").replace("/ ", "/")
        if len(t) > 4:
            out.append(t)
    return out


def colours(L):
    ls = sorted([l for l in L if 0.86 < l[2] < 0.93], key=lambda l: (round(l[1], 2), l[2]))
    t = " ".join(l[5] for l in ls)
    t = re.sub(r"COLO\S*:?|COLO\(", "|", t, flags=re.I)
    return [c.strip(" :|") for c in t.split("|") if c.strip(" :|")]


d = doc("Fur jaden")
spec = [int(r.split("|")[0]) for r in R.splitlines()]
items = []
for row in R.splitlines():
    pn, code, name, mrp = row.split("|")
    pn = int(pn)
    p = d[pn - 1]
    W, H = p.rect.width, p.rect.height
    L = wocr_lines("Fur_jaden", pn)
    cat = next((l[5] for l in sorted(L, key=lambda l: l[2]) if 0.2 < l[2] < 0.23 and l[1] < 0.2), "")
    kind = re.split(r"\s*[I|]\s*", cat)[0].strip() if cat else ""
    feats = grid(L)
    sizes = [l[5] for l in L if re.search(r'\d{2}"\s*\[\d+cm\]', l[5])]
    if sizes:
        feats.append("Sizes: " + ", ".join(dict.fromkeys(s.replace("[", "(").replace("]", ")") for s in sizes)))
    hero = save_clip(p, fitz.Rect(W * 0.555, H * 0.13, W * 0.995, H * 0.565), "furjaden", f"fj-hero-p{pn}", native=3)
    variants = save_clip(p, fitz.Rect(0, H * 0.655, W, H * 0.935), "furjaden", f"fj-var-p{pn}", native=3)
    imgs = [hero, variants]
    if pn + 1 <= d.page_count and pn + 1 not in spec:
        imgs.append(f"/catalog/furjaden/fj-p{pn + 1}.webp")
    imgs.append(f"/catalog/furjaden/fj-p{pn}.webp")
    cols = colours(L)
    desc = f"Fur Jaden {name} ({code}) from The Shade Squad collection."
    if cols:
        desc += f" Available colours: {', '.join(cols)}."
    items.append({"key": "furjaden", "page": pn, "name": f"Fur Jaden {name}", "subtitle": f"Style code {code}", "price": int(mrp), "code": code,
                  "features": feats[:10], "desc": desc, "images": imgs, "brand": "Fur Jaden", "catalog": CAT})
json.dump(items, open(os.path.join(HERE, "raw", "furjaden.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
for i in items:
    print(i["page"], i["name"], "|", i["features"][:4], "|", i["desc"][-70:])
