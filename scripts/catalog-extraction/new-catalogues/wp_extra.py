"""WP pages 15-16 use colour-suffixed model numbers (3003-Black ...) that wp.py skipped; add them."""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lines import doc
from crops import photo_rects, save_clip, dist

HERE = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(HERE, "raw", "wp.json")
BREW = ["Push button tumbler (hot/cold) 400 ml", "Double wall stainless steel cup 350 ml", "Pen", "Keychain"]
ELITE = ["Non-temperature double wall bottle 500 ml", "Push button tumbler (hot/cold) 400 ml", "Hardbound diary", "Metal pen", "Keychain"]
ROWS = [(15, "3003-Black", "Executive Brew Gift Set (Black)", BREW, 620, "Laser engraving"),
        (15, "3003-White", "Executive Brew Gift Set (White)", BREW, 620, "Laser engraving"),
        (16, "3004-Black", "Workday Elite Kit (Black)", ELITE, None, "Diary - UV DTF; rest of the products - laser engraving"),
        (16, "3004-White", "Workday Elite Kit (White)", ELITE, None, "Diary - UV DTF; rest of the products - laser engraving")]
d = doc("WP 2026")
items = [r for r in json.load(open(P, encoding="utf-8")) if not r["code"].startswith(("3003", "3004"))]
for pn, code, name, inc, price, brand in ROWS:
    p = d[pn - 1]
    hit = p.search_for(code)[0]
    photos = [r for r, z in photo_rects(p, 0.04, 0.35) if 0.65 < (r.width / r.height) < 1.5]
    r = min(photos, key=lambda r: dist((hit.x0, hit.y0), r))
    img = save_clip(p, r, "wp-giftsets", f"wp-{code.lower()}", native=3)
    specs = [["Branding options", brand]]
    if price:
        specs.append(["Bulk price", "₹620 for 1–30 units, ₹570 above 30 units"])
    items.append({"key": "wp", "page": pn, "name": name, "subtitle": f"Gift Set · Model {code}", "price": price, "code": code, "features": inc,
                  "desc": "", "specs": specs, "images": [img], "brand": "BD Corporate Gifts", "catalog": "WP Gift Sets 2026",
                  "category": "Corporate Gift Sets", "subcategory": "Executive Gift Sets"})
json.dump(items, open(P, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print("wp", len(items))
