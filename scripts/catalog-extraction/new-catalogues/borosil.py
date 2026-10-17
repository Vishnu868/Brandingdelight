"""Borosil: pages 2-22 from PDF text + native-res left photo; pages 23-31 transcribed (single flattened images)."""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lines import doc, clean, titlecase
from crops import photo_rects, save_clip

HERE = os.path.dirname(os.path.abspath(__file__))
CAT = "Borosil Catalog 2026"
d = doc("Borosil")
items = []

for pn in range(2, 23):
    p = d[pn - 1]
    raw = [clean(x) for x in p.get_text().split("\n") if clean(x) and clean(x) != "®"]
    title = next(x for x in raw if x.upper().startswith("BOROSIL"))
    price = int(float(re.search(r"MRP Rs\.?\s*([\d.]+)", " ".join(raw)).group(1)))
    size = next((x for x in raw if re.fullmatch(r"[\d./ ]+\s*(ML|Ltrs\.|Pcs\.? Set|watts|Jar / 400 watts)", x, re.I)), "")
    ti = raw.index(title)
    desc_lines = [x for x in raw[ti + 1:] if not x.startswith("MRP") and x != size][:2]
    desc = re.sub(r"\s+", " ", " ".join(desc_lines)).strip(" .")
    name = titlecase(title.replace("–", "-").rstrip(". "))
    name = re.sub(r"^Borosil ", "", name).replace("Microwable", "Microwavable").replace(" Ml", " ml").replace("Ltrs", "Ltr")
    if pn in (2, 3):
        name = f"Hydra Trek {('700' if pn == 2 else '500')} ml Bottle - Black"
    if pn in (6, 7):
        name += " - " + ("2 Pcs Set" if pn == 6 else "3 Pcs Set")
    big = [r for r, z in photo_rects(p, 0.15, 0.6) if r.x0 < 200]
    imgs = []
    if big:
        r = max(big, key=lambda r: r.width * r.height)
        imgs.append(save_clip(p, r, "borosil", f"bor-photo-p{pn}", native=3))
    imgs.append(f"/catalog/borosil/bor-p{pn}.webp")
    feats = [f.strip() for f in re.split(r",|\|", desc) if len(f.strip()) > 3][:6]
    items.append({"key": "borosil", "page": pn, "name": "Borosil " + name, "subtitle": size.title().replace("Ml", "ml"), "price": price, "code": None,
                  "features": feats, "desc": desc + ".", "images": imgs, "brand": "Borosil", "catalog": CAT})

MAN = [
    (23, "BCM55W01", "Borosil Brew Pro Drip Coffee Maker", "550 W · 600 ml · Brewing", 3190,
     ["Makes 4-6 big cups of coffee, 600 ml water tank with level window", "Borosilicate glass carafe with easy-to-read level markings",
      "High-quality basket-shaped filter with handle for smooth coffee", "Anti-drip: coffee stops dripping when carafe is removed",
      "Auto shut-off for safety", "Keep-warm function for that perfect second cup", "1 m long power cord"]),
    (24, "BSI13W01", "Borosil SmartPress Steam Iron", "1380 W · Garment care", 1990,
     ["Built-in overheat protection for safety", "360° swivel cord for spraying & ironing at any angle", "Steam output up to 12 g/min",
      "Powerful water spray for uniform moisture", "Adjustable temperature control knob", "Vertical & horizontal bursting", "Self-cleaning function", "200 ml water tank"]),
    (25, "BSI20W03", "Borosil NightGlide Steam Iron", "2000 W · Garment care", 3190,
     ["Built-in overheat protection for safety", "360° swivel cord for spraying & ironing at any angle", "Steam output up to 30 g/min",
      "Powerful water spray for uniform moisture", "Steam on/off switches between dry and steam modes", "Anti-scale function prevents clogged steam outlets",
      "Vertical & horizontal bursting", "Self-cleaning function"]),
    (26, "BHB80W07", "Borosil SmartBlend 800W Hand Blender with Chopper & Whisker", "800 W DC motor · New", 5040,
     ["Blend soups, shakes and batters - hot or cold", "Chop vegetables in the 500 ml chopper, whip cream with the whisker",
      "Switch between power & turbo when you need speed", "Detachable stem for easy cleaning", "Easy-grip design, no slipping", "Extra-long 1.2 m cord"]),
    (27, "BHB80W06", "Borosil SmartBlend 800W Hand Blender with Chopper", "800 W DC motor · New", 4710,
     ["Blend hot soups or cold shakes with ease", "Chop vegetables in seconds with the 500 ml chopper", "Switch between power & turbo when you need speed",
      "Detachable stem for easy washing", "Comfortable grip that fits right in your hand", "Extra-long 1.2 m cord"]),
    (28, "BHB80W05", "Borosil SmartBlend 800W Hand Blender", "800 W DC motor · 750 ml beaker · New", 3990,
     ["Handles hot curries & cold smoothies alike", "Sharp blades that make blending effortless", "Switch between power & turbo when you need speed",
      "Detachable stem for easy cleaning", "Splash-proof so your kitchen stays clean", "Extra-long 1.2 m cord"]),
    (29, "BHGS03", "Borosil Handheld Garment Steamer", "1000 W · 120 ml tank · New", 3490,
     ["Ready to use in just 25 seconds", "Steam output up to 15 g/min", "Use for horizontal & vertical ironing", "Overheat protection",
      "Comfortable grip", "Perfect for home or travel", "Extra-long power cord"]),
    (30, "HB03", "Borosil Smart Blend Hand Blender HB03", "Hand blender", 2290,
     ["Easy single-press button operation", "One blender for all daily needs - fruit juice, dips, soups, baby food", "Handles both hot & cold blending with ease"]),
    (31, None, "Borosil ECO Colour Copper Bottle & Glass Set", "Bottle & glass set · Black", 2855,
     ["Copper bottle with two matching copper tumblers", "100% copper inside", "Matte black finish with copper accents", "Gift-ready set"]),
]
for pn, code, name, sub, price, feats in MAN:
    items.append({"key": "borosil", "page": pn, "name": name, "subtitle": sub, "price": price, "code": code,
                  "features": feats, "desc": "", "images": [f"/catalog/borosil/bor-p{pn}.webp"], "brand": "Borosil", "catalog": CAT})

json.dump(items, open(os.path.join(HERE, "raw", "borosil.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
for i in items:
    print(i["page"], "|", i["name"], "|", i["subtitle"], "|", i["price"], "|", i["desc"][:70], "|", len(i["images"]))
