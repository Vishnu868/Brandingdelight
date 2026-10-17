"""Merge raw/*.json new-catalogue records into the store catalogue.
Usage: merge.py <base catalog.json (old 792)> <out catalog.json> [--report dupes.txt]"""
import json, os, re, sys, glob

HERE = os.path.dirname(os.path.abspath(__file__))
base = json.load(open(sys.argv[1], encoding="utf-8"))
OUT = sys.argv[2]


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:80]


# (regex on name+subtitle, category, subcategory) — first match wins; subcategories reuse the existing site taxonomy
RULES = [
    (r"gift set|combo|executive kit|hamper|gift box|signature edition|essentials$|premium set|business set", "Corporate Gift Sets", "Executive Gift Sets"),
    (r"organi[sz]er\b(?! bag)|diary|notebook|planner|journal|notepad", "Stationery & Notebooks", "Notebooks, Diaries & Organisers"),
    (r"\bpens?\b|rollerball|ball pen|fountain", "Stationery & Notebooks", "Premium Pens"),
    (r"pen ?drive|usb drive|flash drive|otg", "Mobile & Tech Accessories", "Pen Drives"),
    (r"card holder|card case|wallet|passport|rfid", "Travel & Luggage", "Card Holders & Wallets"),
    (r"suitcase|trolley|luggage|trunk", "Travel & Luggage", "Trolley Luggage"),
    (r"duffle|duffel", "Travel & Luggage", "Duffle Bags"),
    (r"backpack|rucksack", "Travel & Luggage", "Backpacks & Rucksacks"),
    (r"messenger|sling|laptop bag|tote|pouch|bag\b|pillow|travel kit|eye mask", "Travel & Luggage", "Bags & Travel Accessories"),
    (r"power ?bank|powerbank|mah\b", "Mobile & Tech Accessories", "Power Banks"),
    (r"charger|charging|cable|adapter|adaptor|hub|dock|magsafe|type ?c|lightning|car holder|phone holder|mobile holder|mobile stand|phone stand|tablet stand|extension", "Mobile & Tech Accessories", "Chargers, Cables & USB Hubs"),
    (r"earbud|tws|earphone|headphone|headset|neckband|speaker|soundbar|sound bar|karaoke|audio|music", "Audio & Smart Gadgets", "Speakers & Headphones"),
    (r"smart ?watch|fitness band|tracker|smart ring", "Audio & Smart Gadgets", "Smartwatches & Wearables"),
    (r"mouse|keyboard|webcam|laptop|tablet|writing pad|monitor|printer|cooling pad|desk mat|mouse pad|gaming|ssd|hard drive|card reader|router|hdmi|calculator|backlit board", "Mobile & Tech Accessories", "Computer Accessories"),
    (r"projector|photo frame", "Audio & Smart Gadgets", "Projectors & Photo Frames"),
    (r"camera|dashcam|dash cam|selfie|tripod(?! fan)|gimbal|ring light|microphone|\bmic\b", "Audio & Smart Gadgets", "Cameras & Creator Gear"),
    (r"massager|massage|eye care|posture|weighing|thermometer|humidifier|purifier|diffuser|cooling towel", "Health & Wellness", "Massagers & Wellness"),
    (r"trimmer|shaver|grooming|hair dryer|straightener", "Personal Care & Grooming", "Trimmers & Grooming"),
    (r"\bfans?\b|air circulator|cooler|heater", "Home & Kitchen Appliances", "Fans & Room Heaters"),
    (r"kettle|multi.?cooker", "Home & Kitchen Appliances", "Kettles & Multi-Cookers"),
    (r"blender|juicer|mixer|grinder", "Home & Kitchen Appliances", "Mixers, Grinders & Blenders"),
    (r"chopper", "Cookware & Kitchen Tools", "Choppers & Food Prep"),
    (r"air fryer", "Home & Kitchen Appliances", "Air Fryers"),
    (r"toaster|oven|griller|coffee maker|beverage maker|ice.?cream", "Home & Kitchen Appliances", "OTG & Coffee Makers"),
    (r"cooktop|induction", "Home & Kitchen Appliances", "Induction & Infrared Cooktops"),
    (r"sandwich", "Home & Kitchen Appliances", "Breakfast Appliances"),
    (r"steamer|steam iron|\biron\b", "Home & Kitchen Appliances", "Irons & Garment Steamers"),
    (r"vacuum|air duster|inflator|cleaner", "Home Improvement & Safes", "Cleaning & Home Care"),
    (r"lunch ?box|tiffin|lunchbox", "Cookware & Kitchen Tools", "Steamers, Idli & Lunch Boxes"),
    (r"bottle|flask|mug|tumbler|sipper|cup\b|glass", "Drinkware & Bottles", "Bottles, Flasks & Tumblers"),
    (r"lamp|light|torch|lantern", "Desk & Office", "Desk Lamps & Lights"),
    (r"clock|alarm|calendar", "Desk & Office", "Desk Clocks & Planners"),
    (r"pen stand|pen holder|organiser|desk|table top|planter", "Desk & Office", "Desk Organisers"),
    (r"chocolate|kunafa|almond|dry fruit|sweet|truffle|cookie|snack", "Gourmet & Chocolates", "Artisanal Chocolates & Treats"),
]

KEY_CAT = {  # whole-catalogue placements
    "pbnb": ("Stationery & Notebooks", "Power Bank Notebooks"),
    "organizers": ("Stationery & Notebooks", "Notebooks, Diaries & Organisers"),
    "notebooks": ("Stationery & Notebooks", "Notebooks, Diaries & Organisers"),
    "luxury": ("Corporate Gift Sets", "Executive Gift Sets"),
    "jpp": ("Travel & Luggage", "Card Holders & Wallets"),
    "pendrives": ("Mobile & Tech Accessories", "Pen Drives"),
    "xgpens": ("Stationery & Notebooks", "Premium Pens"),
    "deskpen": ("Desk & Office", "Desk Organisers"),
    "flasks": ("Drinkware & Bottles", "Bottles, Flasks & Tumblers"),
}
POPLI_SUB = {
    "NEW COLLECTION": "New Collection", "GOD SF": "God Idols", "HINDU GOD IDOLS": "God Idols", "BRASS ARTEFACTS": "Brass Artefacts",
    "BRASS FLOWER VASE": "Flower Vases", "BRASS FRUIT BOWL": "Fruit Bowls", "BRASS CANDLE STAND": "Candle Stands", "BRASS WINE SET-TEA SETS": "Wine & Tea Sets",
    "SILVER PLATED GIFT ITEMS": "Silver Plated Gifts", "BRASS TURKISH COFFEE POTS": "Wine & Tea Sets", "BRASS PUJA ARTICLES": "Puja Articles",
    "BRASS BELLS": "Bells & Singing Bowls", "SINGING BOWLS & NEPALI BELLS": "Bells & Singing Bowls", "SINGING BOWL": "Bells & Singing Bowls",
    "HAPI DRUMS": "Bells & Singing Bowls", "BRASS ANIMAL FIGURES": "Animal Figures", "ALUMINIUM HANDICRAFT": "Aluminium & Copper Handicrafts",
    "COPPER ARTICLES": "Aluminium & Copper Handicrafts", "CHESS SETS": "Wooden, Stone & Lac Crafts", "WOODEN-STONE HANDICRAFT": "Wooden, Stone & Lac Crafts",
    "LAK HANDICRAFT": "Wooden, Stone & Lac Crafts", "TELEPHONE-GRAMOPHONE-CLOCKS": "Vintage Telephones & Clocks", "SOUVENIRS OF INDIA": "Souvenirs of India",
}


def classify(r):
    if r["key"] == "popli":
        return "Brass Decor & Pooja", POPLI_SUB.get(r.get("section"), "Brass Artefacts")
    if r["key"] == "kiva":
        return "Festive Hampers & Gift Boxes", "Dry Fruit Hampers" if "Dry Fruit" in r["name"] else "Chocolate Hampers"
    if r["key"] in KEY_CAT:
        return KEY_CAT[r["key"]]
    if r.get("category"):
        return r["category"], r.get("subcategory") or r["category"]
    t = f"{r['name']} {r.get('subtitle', '')}".lower()
    for rx, c, s in RULES:
        if re.search(rx, t):
            return c, s
    t2 = (t + " " + " ".join(r.get("features", [])) + " " + (r.get("desc") or "")).lower()
    for rx, c, s in RULES:
        if re.search(rx, t2):
            return c, s
    return "Audio & Smart Gadgets", "Lifestyle Gadgets"


def to_product(r, seen):
    cat, sub = classify(r)
    name = re.sub(r"\s+", " ", r["name"]).strip(" -|")
    if r["brand"] and r["brand"].split()[0].lower() not in name.lower() and r["brand"] not in ("BD Signature",):
        name = f"{r['brand'].split(' by ')[0]} {name}" if len(name) < 28 else name
    sub_t = (r.get("subtitle") or "").strip()
    base_slug = slugify(name + (" " + r["code"] if r.get("code") and slugify(name) in seen else ""))
    slug, k = base_slug, 2
    while slug in seen:
        slug = f"{base_slug}-{k}"; k += 1
    seen.add(slug)
    feats = [f for f in r.get("features", []) if f.lower() not in name.lower()][:8]
    desc = (r.get("desc") or "").strip()
    short = sub_t or (desc.split(". ")[0] if desc else "")
    if not desc:
        desc = (short[:1].upper() + short[1:]).rstrip(".") + "." if short else ""
    specs = [{"label": "Model / SKU", "value": r["code"]}] if r.get("code") else []
    specs += [{"label": a, "value": b} for a, b in r.get("specs", [])]
    price = r.get("price")
    variants = r.get("variants") or []
    return {
        "id": slug, "slug": slug, "name": name, "brand": r["brand"], "category": cat, "subcategory": sub,
        "price": price, "mrp": price, "sku": r.get("code"), "shortDescription": short, "description": desc,
        "highlights": feats, "specs": specs, "variants": variants, "images": r["images"], "tags": [r["key"]],
        "catalog": r["catalog"], "stock": 100, "priceOnRequest": price is None and not variants,
    }


new = []
for f in sorted(glob.glob(os.path.join(HERE, "raw", "*.json"))):
    new += json.load(open(f, encoding="utf-8"))
for r in new:  # Popli lists a few items on two pages; the page suffix only kept image names apart
    if r["key"] == "popli":
        r["code"] = r["name"].rsplit(" ", 1)[1]
    elif r["key"] in ("kiva", "pbnb") and r.get("code"):
        r["code"] = r["code"].split("-", 1)[1]

old = base["products"]
seen = {p["slug"] for p in old}
added = [to_product(r, seen) for r in new]

# ── exact duplicates (same company): same model code AND similar name, or same name AND same price with no conflicting code
norm = lambda s: re.sub(r"[^a-z0-9]", "", (s or "").lower())
STOP = {"the", "with", "and", "for", "of", "in", "a", "&"}
toks = lambda p: {w for w in re.findall(r"[a-z0-9]+", p["name"].lower()) if w not in STOP and w not in p["brand"].lower().split()
                  and w not in re.findall(r"[a-z0-9]+", (p.get("sku") or "").lower())}


def sim(a, b):
    ta, tb = toks(a), toks(b)
    return len(ta & tb) / max(1, min(len(ta), len(tb)))


def same(a, b):
    if norm(a["brand"]) != norm(b["brand"]):
        return False
    sa, sb = norm(a.get("sku")), norm(b.get("sku"))
    if sa and sb:
        return sa == sb and sim(a, b) >= 0.5
    return norm(a["name"]) == norm(b["name"]) and a.get("price") is not None and a.get("price") == b.get("price")


idx = {}
def bucket(p):
    return [("s", norm(p["brand"]), norm(p.get("sku")))] if p.get("sku") else [] + [("n", norm(p["brand"]), norm(p["name"]))]


def keys(p):
    k = [("n", norm(p["brand"]), norm(p["name"]))]
    if p.get("sku"):
        k.append(("s", norm(p["brand"]), norm(p["sku"])))
    return k


for p in old:
    for k in keys(p):
        idx.setdefault(k, []).append(("old", p))
from PIL import Image
PUB = "V:/Chidhvianna/brandingdelight/public"


def dhash(path, n=12):
    try:
        im = Image.open(PUB + path.replace("/catalog/", "/thumbs/")).convert("L").resize((n + 1, n), Image.LANCZOS)
    except Exception:
        return None
    px = im.load()
    return sum(1 << (y * n + x) for y in range(n) for x in range(n) if px[x, y] > px[x + 1, y])


OLD_H = [(dhash(p["images"][0]), p) for p in old if p["images"]]
HOUSE = lambda b: b.startswith("BD ") or b.startswith("BrandingDelight")
dupes, final_new = [], []
for p in added:
    cands = [c for k in keys(p) for c in idx.get(k, [])]
    hit = next((c for c in cands if same(p, c[1])), None)
    if not hit and HOUSE(p["brand"]):  # house-branded white-label catalogues: identical product photo = same product
        h = dhash(p["images"][0])
        hit = next((("old", q) for hq, q in OLD_H if h is not None and hq is not None and HOUSE(q["brand"]) and bin(h ^ hq).count("1") <= 4), None)
    if hit:
        src, q = hit
        dupes.append((src, p, q))
        continue
    for k in keys(p):
        idx.setdefault(k, []).append(("new", p))
    final_new.append(p)

products = old + final_new
cats = {}
for p in products:
    c = cats.setdefault(p["category"], {"name": p["category"], "slug": slugify(p["category"]), "subcategories": {}, "count": 0, "image": p["images"][0]})
    c["count"] += 1
    c["subcategories"][p["subcategory"]] = c["subcategories"].get(p["subcategory"], 0) + 1
brands = {}
for p in products:
    b = brands.setdefault(p["brand"], {"name": p["brand"], "slug": slugify(p["brand"]), "count": 0})
    b["count"] += 1
json.dump({"products": products,
           "categories": [{**c, "subcategories": [{"name": k, "slug": slugify(k), "count": v} for k, v in c["subcategories"].items()]} for c in cats.values()],
           "brands": list(brands.values())}, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("old", len(old), "new parsed", len(added), "duplicates removed", len(dupes), "total", len(products))
from collections import Counter
print(Counter(p["brand"] for p in final_new).most_common())
print(Counter(p["category"] for p in final_new).most_common())
if "--report" in sys.argv:
    json.dump([{"where": src, "brand": p["brand"], "new": p["name"], "new_sku": p.get("sku"), "new_catalog": p["catalog"], "price": p.get("price"),
                "matches": q["name"], "match_sku": q.get("sku"), "match_catalog": q["catalog"]} for src, p, q in dupes],
              open(sys.argv[sys.argv.index("--report") + 1], "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print("removed: vs old", sum(1 for d in dupes if d[0] == "old"), "| repeated inside new", sum(1 for d in dupes if d[0] == "new"))
