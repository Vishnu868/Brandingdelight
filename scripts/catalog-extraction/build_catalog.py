"""Build the storefront catalogue JSON from catalogue notes, parsed PDF text and extracted images.
Usage: build_catalog.py <scratchdir> <out.json>"""
import json, os, re, sys
import fitz

S = sys.argv[1]
OUT = sys.argv[2]
CAT = r"V:\Chidhvianna\ecommerce\catalogs"
products = []
seen = set()


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:80]


def add(name, brand, category, sub, images, price=None, sku=None, short="", highlights=None, specs=None,
        variants=None, tags=None, warranty=None, moq=None, catalog="", desc=None):
    base = slugify(f"{brand} {name}" if brand.lower() not in name.lower() else name)
    slug, k = base, 2
    while slug in seen:
        slug = f"{base}-{k}"; k += 1
    seen.add(slug)
    highlights = [h for h in (highlights or []) if h]
    specs = [s for s in (specs or []) if s and s[1]]
    if warranty:
        specs.append(["Warranty", warranty])
    if moq:
        specs.append(["Minimum order (bulk)", str(moq)])
    if sku:
        specs.insert(0, ["Model / SKU", sku])
    if variants:
        prices = [v["price"] for v in variants if v.get("price")]
        if prices and price is None:
            price = min(prices)
    if desc is None:
        # Plain, factual copy from the catalogue; highlights/specs are rendered separately on the page.
        d = (short or name).strip().rstrip(".")
        desc = (d[:1].upper() + d[1:] + ".") if d else ""
    products.append({
        "id": slug, "slug": slug, "name": name, "brand": brand, "category": category, "subcategory": sub,
        "price": price, "mrp": price, "sku": sku, "shortDescription": short, "description": desc,
        "highlights": highlights, "specs": [{"label": a, "value": b} for a, b in specs],
        "variants": variants or [], "images": images, "tags": tags or [], "catalog": catalog,
        "stock": 100, "priceOnRequest": price is None,
    })


def notes(fname):
    rows = []
    for l in open(os.path.join(S, fname), encoding="utf-8"):
        l = l.rstrip("\n")
        if l and l[0].isdigit():
            rows.append(l.split("|"))
    return rows


def pages_text(fname):
    doc = fitz.open(os.path.join(CAT, fname))
    return [" | ".join(x.strip() for x in p.get_text().split("\n") if x.strip()) for p in doc]


# ---------------------------------------------------------------- Lifelong
def ll_cat(pg, code, name):
    n = name.lower()
    if pg in (4, 5) or "hand blender" in n: return "Home & Kitchen Appliances", "Mixers, Grinders & Blenders"
    if pg in (6, 7, 8) : return "Home & Kitchen Appliances", "Gas Stoves"
    if pg == 9: return "Home & Kitchen Appliances", "Induction & Infrared Cooktops"
    if pg in (10, 11): return "Home & Kitchen Appliances", "Kettles & Multi-Cookers"
    if pg == 12: return "Home & Kitchen Appliances", "Breakfast Appliances"
    if pg == 13: return "Home & Kitchen Appliances", "Coffee, Frothers & Mixers"
    if pg == 14: return "Home & Kitchen Appliances", "Air Fryers"
    if pg == 15: return "Home & Kitchen Appliances", "OTG & Coffee Makers"
    if pg == 16 or code.startswith("LLWC"): return "Cookware & Kitchen Tools", "Choppers & Food Prep"
    if pg in (17, 18, 19) or code in ("LLCIT026DH", "LLCIGP008", "LLCTSLW03"): return "Cookware & Kitchen Tools", "Cast Iron Cookware"
    if code.startswith(("LLTBR", "LLVF", "LLBT", "LLCB", "LLCG", "LLTIIMB")): return "Drinkware & Bottles", "Bottles, Flasks & Tumblers"
    if code.startswith("LLKWS"): return "Cookware & Kitchen Tools", "Kitchen Scales"
    if code in ("LLELB01", "LLMOM01", "LLIDCKR03", "LLIDCKR06"): return "Cookware & Kitchen Tools", "Steamers, Idli & Lunch Boxes"
    if code.startswith(("LLDI", "LLSI", "LLGRMS")): return "Home & Kitchen Appliances", "Irons & Garment Steamers"
    if pg in (26, 27, 28): return "Home & Kitchen Appliances", "Fans & Room Heaters"
    if pg in (30, 31) and code != "LLHARS02": return "Home Improvement & Safes", "Home Safes & Lockers"
    if code in ("LLHARS02", "LLCSMR001", "LLHIESM01", "LLETK09") or pg == 32: return "Home Improvement & Safes", "Cleaning & Home Care"
    if code == "LLEPF09" or pg == 60: return "Audio & Smart Gadgets", "Projectors & Photo Frames"
    if pg in (35, 36, 37, 38): return "Health & Wellness", "Massagers & Wellness"
    if pg == 39: return "Health & Wellness", "Body Weighing Scales"
    if pg == 41: return "Personal Care & Grooming", "Trimmers & Grooming"
    if code == "LLCRS01": return "Travel & Luggage", "Backpacks & Rucksacks"
    if pg in (43, 44): return "Fitness & Sports", "Treadmills & Fitness Bikes" if code.startswith(("LLTM", "LLSBB")) else "Kids Scooters"
    if pg in (45, 46): return "Fitness & Sports", "Bicycles & Cycling"
    if pg in (47, 48, 49): return "Fitness & Sports", "Yoga & Workout Gear"
    if pg in (51, 52, 53, 54, 55, 56): return "Mobile & Tech Accessories", "Power Banks"
    if pg in (57, 58, 59): return "Mobile & Tech Accessories", "Chargers, Adapters & Extension Boards"
    return "Home & Kitchen Appliances", "Appliances"


for r in notes("notes_lifelong.txt"):
    pg, idx, code = int(r[0]), r[1], r[2]
    if code == "DUP":
        continue
    name, price, warr = r[3], r[4], (r[5] if len(r) > 5 else "")
    cat, sub = ll_cat(pg, code, name)
    disp = re.sub(r"^Lifelong\s+(Electronics\s+)?", "", name)
    disp = re.sub(r"^%s\s+" % re.escape(code), "", disp)
    parts = [p.strip() for p in re.split(r",|\|", disp) if p.strip()]
    title = parts[0] if len(parts[0]) > 12 else ", ".join(parts[:2])
    if len(title) > 70:
        title = title[:70].rsplit(" ", 1)[0]
    if code.split()[0] not in title and len([p for p in products if p["name"].startswith(title)]):
        title = f"{title} ({code})"
    img = "/catalog/lifelong/" + re.sub(r"[^a-z0-9]+", "-", code.lower()).strip("-") + ".webp"
    add(title, "Lifelong", cat, sub, [img], price=int(price) if price else None, sku=code,
        short=disp, highlights=parts[1:7], warranty=(warr + " Warranty") if warr else None, catalog="Lifelong Diwali 2026",
        tags=["lifelong", sub.lower()])

# ---------------------------------------------------------------- FUZO
def fuzo_cat(name, sub):
    t = (name + " " + sub).lower()
    if re.search(r"notebook|organizer|pen\b|pen with|ballpoint", t) and "desk" not in t: return "Stationery & Notebooks", "Notebooks & Pens"
    if re.search(r"backpack|bag|duffel|trolley|pouch|briefcase|travel kit|card holder|lanyard", t): return "Travel & Luggage", "Bags & Travel Accessories"
    if re.search(r"bottle|mug|tumbler|infuser", t): return "Drinkware & Bottles", "Smart & Designer Drinkware"
    if re.search(r"speaker|lamp|light|clock|fan|aroma|diffuser|kettle|blender|juicer|massager|pillow|planter", t): return "Audio & Smart Gadgets", "Lifestyle Gadgets"
    if re.search(r"adapter|charging|charger|power bank|cable|mouse|spinner|sterili|scale|tool", t): return "Mobile & Tech Accessories", "Chargers & Tech Gadgets"
    return "Desk & Office", "Desk Gadgets & Organisers"

for r in notes("notes_fuzo.txt"):
    pg, name, sub = int(r[0]), r[1], r[2]
    cat, sc = fuzo_cat(name, sub)
    if "desk" in sub.lower() or re.search(r"\d in 1", sub) and "desk" in sub.lower():
        cat, sc = "Desk & Office", "Desk Gadgets & Organisers"
    add(f"FUZO {name}", "FUZO", cat, sc, [f"/catalog/fuzo/fuzo-p{pg}.webp"], short=sub,
        highlights=[x.strip() for x in re.split(r",|\||:", sub) if x.strip()][1:6], catalog="FUZO Black Flyers Sept 2026",
        tags=["fuzo", "corporate gifting"])

# ---------------------------------------------------------------- Electronics (promo tech)
def elec_cat(name, sub):
    t = (name + " " + sub).lower()
    if re.search(r"clock|speaker|timewave", t): return "Audio & Smart Gadgets", "Clocks & Speakers"
    if re.search(r"stand|table top|desk|organizer|pad|webcam|tapframe|frame", t): return "Desk & Office", "Mobile Stands & Table Tops"
    if re.search(r"fan|flask|cooling", t): return "Mobile & Tech Accessories", "USB Fans & Gadgets"
    return "Mobile & Tech Accessories", "Chargers, Cables & USB Hubs"

for r in notes("notes_elec.txt"):
    pg, name, sub, code = int(r[0]), r[1], r[2], (r[3].strip() if len(r) > 3 else "")
    cat, sc = elec_cat(name, sub)
    add(name if name.lower() not in ("phone stand", "metal mobile stand", "usb hub", "metal multi mobile stand", "power glow usb hub", "2 side cable for android and iphone") else f"{name} {sub.split(',')[0]}",
        "BD Tech Essentials", cat, sc, [f"/catalog/electronics/elec-p{pg}.webp"], sku=(code or None), short=sub,
        highlights=[x.strip() for x in re.split(r",|&", sub) if x.strip()][:6], catalog="Electronics & Mobile Accessories",
        tags=["custom branding", "corporate gifting"])

# ---------------------------------------------------------------- Dry fruits
for r in notes("notes_dry.txt"):
    pg, name, d = int(r[0]), r[1], r[2]
    brand = "Nutsio" if name.startswith("Nutsio") else "BrandingDelight Festive"
    sub = "Dry Fruit Gift Boxes" if "Gift Box" in name else "Premium Dry Fruits"
    add(name, brand, "Dry Fruits & Nuts", sub, [f"/catalog/dryfruits/dry-p{pg}.webp"], short=d,
        highlights=[x.strip() for x in re.split(r",|;", d) if x.strip()][:6], catalog="Diwali Dry Fruits 2026",
        tags=["diwali", "dry fruits", "festive"])

# ---------------------------------------------------------------- Everyday Organisers
for r in notes("notes_eo.txt"):
    pg, name, sub, mrp = int(r[0]), r[1], r[2], int(r[3])
    t = (name + sub).lower()
    if "pouch" in t or "wallet" in t: cat, sc = "Travel & Luggage", "Tech Pouches & Wallets"
    elif "terra" in t or "terrarium" in t or "sprout" in t: cat, sc = "Desk & Office", "Self-Watering Planters"
    elif "clock" in t or "timer" in t: cat, sc = "Desk & Office", "Desk Clocks & Planners"
    else: cat, sc = "Desk & Office", "Desk Organisers"
    add(f"Everyday Organisers {name}", "Everyday Organisers", cat, sc,
        [f"/catalog/eo/eo-p{pg}a.webp", f"/catalog/eo/eo-p{pg}b.webp"], price=mrp, short=sub,
        highlights=[x.strip() for x in re.split(r",|;", sub) if x.strip()][:6] + ["Made in India", "Custom branding: screen printing / DTF"],
        catalog="Everyday Organisers Feb 2026", tags=["desk", "made in india", "corporate gifting"])

# ---------------------------------------------------------------- Tamta copper
for it in json.load(open(os.path.join(S, "tamta.json"))):
    nm = f"Tamta {it['series']} {it['type']} #{it['code']}"
    add(nm, "Tamta", "Copper Collection", it["type"].replace("Hand-Crafted ", ""), [f"/catalog/tamta/{it['image']}.webp"],
        price=it["mrp"], sku=it["code"], short=f"{it['capacity'] or ''} {it['finish'] or ''} 99% pure copper, gift monocarton".strip(),
        highlights=["99% pure copper", it["capacity"] and f"Capacity {it['capacity']}", it["finish"], "Ayurvedic wellness", "Premium gift monocarton"],
        specs=[["Capacity", it["capacity"]], ["Finish", it["finish"]], ["Material", "99% pure copper"], ["Packaging", "Monocarton"]],
        moq=100, catalog="Tamta Copper Range", tags=["copper", "wellness", "drinkware"])

# ---------------------------------------------------------------- Aquaminder smart bottles
AQ = [("Congo Prime+", "1300ml", 4999, [2, 3]), ("Rio Prime+", "700ml", 4499, [4, 5, 6]), ("Nile Go+", "800ml", 4499, [7, 8, 9]),
      ("Nile+", "1200ml", 4999, [10, 11, 12, 13]), ("Thames+", "600ml", 4499, [14, 15, 16, 17, 18]), ("Volga+", "770ml", 2199, [19, 20]),
      ("Hudson", "600ml", 1599, [21, 22]), ("Volga", "770ml", 1999, [23]), ("Rhine+", "800ml", 2299, [24, 25, 26, 27])]
bt = pages_text("Catalogue  (JUNE 2026).pdf")
for name, cap, mrp, pgs in AQ:
    feat = []
    for pg in pgs:
        for f in re.split(r"\s*\|\s*", bt[pg - 1]):
            f = f.strip()
            if f and not re.search(r"MRP|ML$|^\d|PRIME|NILE|THAMES|VOLGA|RHINE|HUDSON|RIO|CONGO|NEW|LAUNCH", f, re.I) and f not in feat:
                feat.append(f)
    hl = []
    buf = ""
    for f in feat:
        buf = (buf + " " + f).strip()
        if len(buf) > 9:
            hl.append(buf); buf = ""
    add(f"Aquaminder {name} Smart Bottle {cap}", "Aquaminder", "Drinkware & Bottles", "Smart Bottles",
        [f"/catalog/bottles/bottle-p{p}.webp" for p in pgs], price=mrp, short=f"Smart hydration bottle with reminders, {cap}",
        highlights=hl[:8], specs=[["Capacity", cap], ["Battery", "Up to 15 days"], ["Charging", "USB-C"]],
        catalog="Aquaminder Catalogue June 2026", tags=["smart bottle", "drinkware", "tech"])

# ---------------------------------------------------------------- HRX / Snitch / luggage
hx = pages_text("Hrx trolley's.pdf")
HRX = [("Zanzibar", 3, 8999, "Polypropylene", "Intergalactic Grey, Canes Grey, Green, Teal, Blue, Black", "8 wheels"),
       ("Kyoto", 5, 9999, "Polypropylene", "Peach, Blue, White, Black", "8 wheels"),
       ("Helium", 7, 9999, "Polypropylene", "Intergalactic Grey, Canes Grey, Red, Blue, Black", "8 wheels"),
       ("Parabola", 9, 8999, "Polypropylene", "White, Blue, Black", "8 wheels"),
       ("Icon", 11, 7999, "Polypropylene", "White, Teal, Red, Blue, Black", "4 wheels"),
       ("Force", 13, 9999, "Polycarbonate", "Silver, Green, Black", "8 wheels"),
       ("Force Urban 2.0", 15, 10999, "Polycarbonate twill texture", "Silver, White, Black", "8 wheels"),
       ("Transit Laptop", 17, 10999, "Polycarbonate", "Silver, Black", "8 wheels"),
       ("Overdrive Soft Trolley", 19, 8999, "Sturdy polyester fabric", "Blue, Black", "4 wheels")]
for name, pg, mrp, mat, cols, wheels in HRX:
    dims = re.findall(r"(Cabin|Medium|Large) \| ([\d. x]+cm) \| [^|]+\| Capacity : (\d+ litre) \| Weight : ([\d.]+ kilograms)", hx[pg])
    specs = [["Shell / material", mat], ["Colours", cols], ["Wheels", wheels], ["Warranty", "5 years"]]
    for d in dims:
        specs.append([f"{d[0]} size", f"{d[1]}, {d[2]}, {d[3]}"])
    laptop = "laptop" in name.lower() or "urban" in name.lower() or "overdrive" in name.lower()
    add(f"HRX {name} Trolley Luggage (Cabin)", "HRX by Hrithik Roshan", "Travel & Luggage", "Trolley Luggage",
        [f"/catalog/hrx/hrx-p{pg}.webp", f"/catalog/hrx/hrx-p{pg + 1}.webp"], price=mrp,
        short=f"{mat} {'hard' if 'poly' in mat.lower() else 'soft'}-shell trolley, {wheels}, 5-year warranty",
        highlights=["Unbreakable / unscratchable shell", f"{wheels} 360° motion", "Water-proof shell", "Smart storage design",
                    "5-year warranty"] + (["Quick-access laptop compartment (fits 15.6\")"] if laptop else []) + ["Also available in Medium, Large, Pack of 2 & Pack of 3"],
        specs=specs, catalog="HRX Travel Gear", tags=["luggage", "travel", "trolley"])
add("HRX Overdrive Soft Duffle Bag", "HRX by Hrithik Roshan", "Travel & Luggage", "Duffle Bags",
    ["/catalog/hrx/hrx-p21.webp", "/catalog/hrx/hrx-p22.webp"], price=4999, short="Soft duffle bag, Regular 51L with push button / Large 62L",
    highlights=["Regular 51 L with push button", "Large 62 L option", "Blue or Black", "Fuel your spirit"],
    specs=[["Colours", "Blue, Black"], ["Capacity", "51 L (Regular) / 62 L (Large)"]], catalog="HRX Travel Gear", tags=["luggage", "duffle"])

sn = pages_text("Snitch Travel.pdf")
for pg in range(6, 13):
    t = sn[pg - 1]
    name = re.search(r"SNITCH (\w+)", t).group(1).title()
    coll = "Polycarbonate" if "PC COLLECTION" in t else "Polypropylene"
    colours = [c for c in ["YELLOW", "BLUE", "WHITE", "BLACK", "POWDER BLUE", "BEIGE", "RED", "SILVER", "GOLDEN", "OFF-WHITE"] if re.search(r"\| %s \|" % c, t)]
    desc_lines = [x for x in t.split(" | ") if len(x) > 25 and "COLLECTION" not in x]
    add(f"SNITCH {name} Trolley Luggage", "SNITCH Travel", "Travel & Luggage", "Trolley Luggage", [f"/catalog/snitch/snitch-p{pg}.webp"],
        short=" ".join(desc_lines[:3])[:220],
        highlights=["Unbreakable shell", "5-year warranty", "8-wheel 360° motion" if "8-WHEELS" in t else "4-wheel motion", "Water-proof shell",
                    "Free shoe bag" if "SHOE" in t else "Quick-access laptop compartment (15.6\")", "Cabin, Medium, Large, Pack of 2 & 3"],
        specs=[["Collection", coll], ["Colours", ", ".join(c.title() for c in colours)], ["Warranty", "5 years"]],
        catalog="SNITCH Travel by Escape Plan", tags=["luggage", "travel"])

for name, brand, pg, mrp, sp in [
    ("Kamiliant Martial Roader Cabin Trolley", "Kamiliant", 1, 7800, [["Size", "Cabin 40 x 55 x 21 cm"], ["Colour", "Black"]]),
    ("Kamiliant Strive Cabin Trolley", "Kamiliant", 2, 7800, [["Size", "Cabin 39.5 x 57 x 22.5 cm"], ["Colours", "Black, Light Grey"]]),
    ("Kamiliant Martial 55 cm Cabin Trolley", "Kamiliant", 3, 7500, [["Size", "55 cm - 40 x 55 x 21 cm"], ["Colours", "Royal Blue, Black"]]),
    ("Swiss Military GalaxyPro Hardtop Trolley (Cabin)", "Swiss Military", 5, 9099, [["Size", "Cabin 42 L, 34 x 22 x 55 cm"], ["Material", "100% polycarbonate"], ["Warranty", "3 years international"]]),
]:
    add(name, brand, "Travel & Luggage", "Trolley Luggage", [f"/catalog/luggage/zest-p{pg}.webp"], price=mrp,
        short="Lightweight hard-shell cabin trolley with 3-digit combination lock and multistep trolley handle",
        highlights=["Lightweight", "Smooth spinner wheels", "3-digit combination lock", "Multistep trolley handle"], specs=sp,
        catalog="Luggage Options", tags=["luggage", "travel"])
add("Swiss Military Starkey Hardtop Trolley Luggage", "Swiss Military", "Travel & Luggage", "Trolley Luggage", ["/catalog/luggage/zest-p4.webp"],
    short="Ultra-lightweight PP luggage with unique 3D design, push-button metal trolley and 3-dial lock",
    variants=[{"id": "cabin", "label": "Cabin 55 cm (44 L)", "price": 8999}, {"id": "medium", "label": "Medium 65 cm (82 L)", "price": 10999},
              {"id": "large", "label": "Large 75 cm (136 L)", "price": 12999}, {"id": "set3", "label": "3 Pcs Set", "price": 32997}],
    highlights=["Light weight", "Unique 3D design", "Ergonomic 360° rotatable wheels", "3 dial combination lock", "Push button metal trolley", "3 years warranty"],
    specs=[["Material", "Polypropylene"], ["Colours", "Black, Blue, Grey"], ["Warranty", "3 years"]], catalog="Luggage Options", tags=["luggage"])

# ---------------------------------------------------------------- Loyka
ly = pages_text("Loyka Catalogue 2026 (V3) -1_removed.pdf")
for pg in range(4, 30):
    t = ly[pg - 1]
    segs = [x.strip() for x in t.split(" | ")]
    mrp = int(re.search(r"MRP:\s*`?\s*([\d,]+)", t).group(1).replace(",", ""))
    items = [x.lstrip("• ").strip() for x in segs if x.startswith("•")]
    i = [k for k, x in enumerate(segs) if x.startswith("MRP")][0]
    nm = []
    for x in segs[i + 1:]:
        if x.startswith("•") or x.startswith("LDC"):
            break
        nm.append(x)
    name = " ".join(nm).replace("LOYKA ", "").replace("LOYKA", "").strip()
    sub = "Festive Gift Boxes" if items and "Box" in name or "Tin" in name or "Diwali" in name else "Almond Brittles"
    add(f"LOYKA {name}", "LOYKA", "Gourmet & Chocolates" if sub == "Almond Brittles" else "Festive Hampers & Gift Boxes", sub,
        [f"/catalog/loyka/loyka-p{pg}.webp"], price=mrp, short=(", ".join(items[:4]) if items else name),
        highlights=items[:10], catalog="LOYKA Diwali Catalog 2026", tags=["diwali", "gourmet", "festive"],
        desc=f"The LOYKA {name} is a premium Diwali gift, packed with handcrafted almond brittles and festive treats. Ideal for family, friends and corporate gifting.")

# ---------------------------------------------------------------- SMOOR
sm = pages_text("SMOOR Diwali 2026 (1).pdf")
for pg in range(4, 89):
    t = sm[pg - 1]
    if "Price" not in t:
        continue
    segs = [x.strip() for x in t.split(" | ")]
    title = []
    for x in segs:
        if x.upper() == x and not x.startswith(("BOX OF", "PACK OF", "Price")):
            title.append(x)
        else:
            break
    name = " ".join(title).title().replace("Smoor", "SMOOR").replace("X SMOOR", "x SMOOR")
    desc_parts = [x for x in segs[len(title):] if not re.match(r"(BOX|PACK) OF|Price|Available", x)]
    desc = " ".join(desc_parts)
    variants = []
    for m in re.finditer(r"(BOX|PACK) OF (\d+)(?:\s*-\s*([A-Z]+))?\s*\|\s*Price\s*`\s*([\d,]+)", t):
        lbl = f"{m.group(1).title()} of {m.group(2)}" + (f" - {m.group(3).title()}" if m.group(3) else "")
        variants.append({"id": slugify(lbl), "label": lbl, "price": int(m.group(4).replace(",", ""))})
    price = None
    if not variants:
        m = re.search(r"Price\s*`\s*([\d,]+)", t)
        price = int(m.group(1).replace(",", "")) if m else None
    variants.sort(key=lambda v: v["price"])
    T = " ".join(title)
    if T in ("BAKLAVA",):
        pk = re.search(r"PACK OF \d+", t)
        if pk:
            name = f"{name} {pk.group(0).title()}"
    hamper = bool(re.search(r"HAMPER|TIN$|TRAY|HIGH BOX|CHEST|COLLECTION|TOTE|ELEGANZA|MUSE|HALO|MANOR|GIFT BOX|MAISON|CELEBRATION BOX|AURA|CIRCLE OF JOY", T)) and not re.search(r"TRUFFLES|NOUGAT", T)
    cat = "Festive Hampers & Gift Boxes" if hamper else "Gourmet & Chocolates"
    sub = "Chocolate Hampers" if hamper else "Artisanal Chocolates & Treats"
    inc = re.findall(r"(?:features|includes|comprising of|brings together|holds within|featuring|with) (.+?)(?:\.|$)", desc)
    hl = [x.strip(" ,") for x in re.split(r",| and ", inc[0])][:10] if inc else []
    add(f"SMOOR {name}", "SMOOR", cat, sub, [f"/catalog/smoor/smoor-p{pg}.webp"], price=price, variants=variants,
        short=(re.split(r"(?<=[.!])\s", desc)[0])[:240], highlights=hl, catalog="SMOOR Diwali 2026", tags=["diwali", "chocolates", "smoor"], desc=desc)

# ---------------------------------------------------------------- Unwrap Happiness
UH = [  # (code, page, img index, displayed price)
    ("COP 001", 7, 1, 745), ("COP 002", 7, 2, 1085), ("COP 003", 8, 1, 1200), ("COP 004", 8, 2, 1300), ("COP 005", 9, 1, 1485),
    ("COP 006", 9, 2, 1485), ("COP 007", 10, 1, 1545), ("COP 008", 10, 2, 1715), ("COP 009", 11, 1, 1660), ("COP 010", 11, 2, 1715),
    ("COP 011", 12, 1, 1830), ("LUX 001", 13, 1, 1945), ("LUX 002", 13, 2, 2060), ("LUX 003", 14, 1, 2115), ("LUX 004", 14, 2, 2170),
    ("LUX 005", 15, 1, 2285), ("LUX 006", 15, 2, 2285), ("LUX 007", 16, 1, 2399), ("LUX 008", 16, 2, 2630), ("LUX 009", 17, 1, 3199),
    ("LUX 010", 17, 2, 4570), ("LUX 011", 18, 1, 4570), ("LUX 012", 18, 2, 5830), ("LUX 013", 19, 1, 7425),
    ("BOX 001", 20, 1, 350), ("BOX 002", 20, 2, 675), ("BOX 003", 21, 1, 685), ("BOX 004", 21, 2, 600), ("BOX 005", 22, 1, 2399),
    ("BOX 006", 22, 2, 1830), ("BOX 007", 23, 1, 2115), ("BOX 008", 23, 2, 1945), ("BOX 009", 24, 1, 1370), ("BOX 010", 24, 2, 570),
    ("BOX 011", 25, 1, 745), ("BOX 012", 25, 2, 745), ("BOX 013", 26, 1, 860), ("BOX 014", 26, 2, 860), ("BOX 015", 27, 1, 970),
    ("BOX 016", 27, 2, 1830)]
uw = fitz.open(os.path.join(CAT, "Unwrap Happiness sept 2026.pdf"))


def contents_under(pn, idx):
    p = uw[pn - 1]; W, H = p.rect.width, p.rect.height
    rects = []
    for im in p.get_images(full=True):
        for r in p.get_image_rects(im[0]):
            r = r & p.rect
            if r.width > 0.3 * W and r.height > 0.21 * H and not (r.width > 0.95 * W and r.height > 0.95 * H):
                rects.append(r)
    rects = sorted({(round(r.y0), round(r.y1)): r for r in rects}.values(), key=lambda r: r.y0)
    r = rects[idx - 1]; nxt = rects[idx].y0 if idx < len(rects) else H
    lines = []
    for b in p.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            tt = "".join(s["text"] for s in l["spans"]).strip()
            if tt and r.y1 - 5 < l["bbox"][1] < nxt:
                lines.append((l["bbox"][0], l["bbox"][1], tt))
    cols = {}
    for x, y, tt in lines:
        cols.setdefault(round(x / 25), []).append((y, tt))
    out = []
    for k in sorted(cols):
        for y, tt in sorted(cols[k]):
            if re.match(r"^(COP|LUX|BOX)\b|^\d+$|`|Tray", tt):
                continue
            out.append(tt)
    items, buf = [], None
    for tt in out:
        if re.match(r"^\d+\s*(gm|gms|pcs|pc)$", tt, re.I) and buf:
            items[-1] = f"{items[-1]} {tt}"
        else:
            items.append(tt.title() if tt.isupper() else tt); buf = tt
    return items


for code, pg, idx, price in UH:
    items = contents_under(pg, idx)
    kind = {"COP": "Corporate Hamper", "LUX": "Luxury Hamper", "BOX": "Gift Box"}[code[:3]]
    add(f"Unwrap Happiness {kind} {code.replace(' ', '')}", "Unwrap Happiness", "Festive Hampers & Gift Boxes",
        {"COP": "Corporate Hampers", "LUX": "Luxury Hampers", "BOX": "Gourmet Gift Boxes"}[code[:3]],
        [f"/catalog/unwrap/unwrap-p{pg}-{idx}.webp"], price=price, sku=code, short="Includes " + ", ".join(items[:5]),
        highlights=items, catalog="Unwrap Happiness Sept 2026", tags=["hamper", "corporate gifting", "gourmet"],
        desc=f"A curated {kind.lower()} by Unwrap Happiness, beautifully packed for festive and corporate gifting. Every hamper can be customised with your messaging, custom design and branded ribbons. Images are for reference; contents may vary slightly with availability.")
add("Unwrap Happiness Corporate Hamper COP012 (Tray Set)", "Unwrap Happiness", "Festive Hampers & Gift Boxes", "Corporate Hampers",
    ["/catalog/unwrap/unwrap-p12-2.webp"], sku="COP 012",
    variants=[{"id": "tray1", "label": "Tray 1", "price": 3030}, {"id": "tray2", "label": "Tray 2", "price": 3260}, {"id": "tray3", "label": "Tray 3", "price": 3485}],
    short="Three-tier tray hamper: brittle, garlic bread, wafers, cookies, crackers & wafer cubes", highlights=["Brittle 100gm", "Garlic Bread 150gm", "Wafers 125gm", "Cookies Box 75gm", "Crunchy Crackers 150gm", "Wafer Cubes 100gm"],
    catalog="Unwrap Happiness Sept 2026", tags=["hamper"])
for name, imgs, price, items in [
    ("Herbal Tea Test Tube Gift Set", ["unwrap-p28-2"], 1140, ["6 herbal tea test tubes"]),
    ("Herbal Tea Single Gift with Infuser", ["unwrap-p28-1", "unwrap-p28-3"], 1000, ["Herbal tea x 1 jar", "Infuser"]),
    ("Herbal Tea 9 Pcs Gift Box", ["unwrap-p29-1"], 2285, ["9 herbal tea tins"]),
    ("Herbal Tea Flip Top Gift Box", ["unwrap-p29-2"], 1260, ["Herbal tea x 4 jars"])]:
    add(f"Unwrap Happiness {name}", "Unwrap Happiness", "Festive Hampers & Gift Boxes", "Tea Gift Sets", [f"/catalog/unwrap/{i}.webp" for i in imgs],
        price=price, short=", ".join(items), highlights=items, catalog="Unwrap Happiness Sept 2026", tags=["tea", "wellness"])

GOURMET = [
    ("Cocoa Bar", "p32-2", [("Brownie Nibs 110g", 300), ("Strawberry 110g", 300), ("Roasted Almonds 110g", 300)]),
    ("Choco Oh Nuts", "p32-3", [("Almonds 200g", 395), ("Butter Nuts 200g", 325)]),
    ("Brittle Collection", "p32-4", [("Almond Brittle 100g", 175), ("Brownie Brittle 125g", 175), ("Hazelnut 100g", 250)]),
    ("Chocolate Bar", "p32-5", [("Kunafa 100g", 450), ("Hazelnut 100g", 450), ("Fruit n Nut 100g", 450)]),
    ("Choco Sins Matter Chocolate Box", "p33-1", [("9 pcs", 550), ("12 pcs", 650), ("18 pcs", 850)]),
    ("Dragees", "p33-2", [("Hazelnut 150g", 375), ("Rose Almond 150g", 375), ("Cocoa Almond 150g", 375), ("Pineapple 150g", 375), ("Pista 150g", 375), ("Cranberry 150g", 375)]),
    ("Almond Brittle Box", "p34-1", [("4 pc 50g", 250), ("180g", 420)]),
    ("Brownie Brittle Box", "p34-2", [("240g", 420)]),
    ("Florentine", "p34-3", [("100g", 200)]),
    ("Choco Roche", "p34-4", [("18 pcs 200g", 750)]),
    ("Oh! Crumb Cookies", "p35-1", [("Roasted Almonds 140g", 300), ("Choco Chip 140g", 250)]),
    ("Almond & Pista Sticks", "p35-2", [("Almond Stick 150g", 250), ("Pista Stick 150g", 250)]),
    ("Oh! Crumb Cookie Tins", "p35-3", [("Osmania 400g", 250), ("Coconut 400g", 350), ("Shrewsbury 400g", 350), ("Chocochip 400g", 375), ("Red Velvet 350g", 450)]),
    ("Healthy Cookies Mini Packs", "p36-1", [("Red Velvet 75g", 125), ("Almond 75g", 125), ("Osmania 75g", 125), ("Chocochip 75g", 125)]),
    ("Oh! Crumb Healthy Cookies", "p36-2", [("Multigrain 400g", 350), ("Mixed Berry 400g", 400), ("Almond Pista 400g", 400), ("Cashew Pista 400g", 400), ("Chocochip 400g", 400)]),
    ("Crunchy Crackers", "p37-1", [("Lemon Curd 160g", 300), ("Orange 160g", 300), ("Fruit Nut 160g", 300), ("Hazelnut 160g", 300), ("Ginger 160g", 300), ("Choco Chips 160g", 300)]),
    ("Savoury Crackers Jar", "p37-2", [("Jeera 150g", 125), ("Sour 150g", 125), ("Cheese 150g", 125)]),
    ("Le Classico Choco Rolls", "p38-1", [("85g", 100)]),
    ("Drippin Coffee Rolls", "p38-2", [("120g", 125)]),
    ("Wafer Cubes", "p38-3", [("Chocolate 125g", 250), ("Strawberry 125g", 250), ("Hazelnut 125g", 250)]),
    ("Creme Wafers", "p38-4", [("Chocolate 125g", 100), ("Strawberry 125g", 100), ("Vanilla 125g", 100)]),
    ("Baked Lavash", "p39-2", [("Garlic 150g", 150), ("Tomato Oregano 150g", 150), ("Pizza 150g", 150)]),
    ("Crispetti Bruschetta", "p39-3", [("Cheese 100g", 150), ("Beetroot 100g", 150), ("Spinach 100g", 150)]),
    ("Pop-up! Popcorn", "p39-4", [("Masala 80g", 200), ("Chocolate 80g", 200), ("Strawberry 80g", 200)]),
    ("Roasted Makhana", "p40-1", [("Masala 80g", 200), ("Honey Chilli BBQ 80g", 200), ("Mint 80g", 200), ("Jalapeno 80g", 200), ("Peri Peri 80g", 200), ("Butter Cheese 80g", 200), ("Cheese 80g", 200)]),
    ("Roasted Nuts Box", "p40-2", [("Almond 100g", 250), ("Almond 200g", 375), ("Cashew 100g", 300), ("Cashew 200g", 450)]),
    ("Chipzy Potato Crackers", "p40-3", [("Almond 100g", 125)]),
    ("French Heart", "p41-1", [("200g", 200)]),
    ("Healthy Lavash", "p41-2", [("Tomato Oregano 100g", 150), ("Tomato Peri Peri 100g", 150), ("Carrot 100g", 150)]),
    ("Immunity Bites", "p42-1", [("Energy Bites 5 pcs", 225), ("Chikki Almond Pista 5 pcs", 200), ("Chikki Almond Kaju 5 pcs", 225), ("Power Seeds 5 pcs", 225), ("Saffron Dates Bite 5 pcs", 225), ("Gulkand Date Bite 5 pcs", 225), ("Almond Roka 5 pcs", 200)]),
    ("Stuffed Dates", "p43-1", [("9 pcs", 750)]),
]
for name, img, vs in GOURMET:
    variants = [{"id": slugify(l), "label": l, "price": p} for l, p in vs] if len(vs) > 1 else []
    add(f"Unwrap Happiness {name}", "Unwrap Happiness", "Gourmet & Chocolates", "Gourmet Snacks & Treats", [f"/catalog/unwrap/unwrapg-{img}.webp"],
        price=vs[0][1] if len(vs) == 1 else None, variants=variants, short=", ".join(l for l, _ in vs),
        highlights=["100% vegetarian", "Premium ingredients", "Hygienically packed"] + ([f"Pack: {vs[0][0]}"] if len(vs) == 1 else []),
        catalog="Unwrap Happiness Sept 2026", tags=["gourmet", "snacks"])

# ---------------------------------------------------------------- write
cats = {}
for p in products:
    c = cats.setdefault(p["category"], {"name": p["category"], "slug": slugify(p["category"]), "subcategories": {}, "count": 0, "image": p["images"][0]})
    c["count"] += 1
    c["subcategories"][p["subcategory"]] = c["subcategories"].get(p["subcategory"], 0) + 1
brands = {}
for p in products:
    b = brands.setdefault(p["brand"], {"name": p["brand"], "slug": slugify(p["brand"]), "count": 0})
    b["count"] += 1
out = {"products": products,
       "categories": [{**c, "subcategories": [{"name": k, "slug": slugify(k), "count": v} for k, v in c["subcategories"].items()]} for c in cats.values()],
       "brands": list(brands.values())}
json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("products", len(products), "priced", sum(1 for p in products if not p["priceOnRequest"]))
for c in out["categories"]:
    print(f"  {c['name']}: {c['count']}")
print("brands", [(b["name"], b["count"]) for b in out["brands"]])
