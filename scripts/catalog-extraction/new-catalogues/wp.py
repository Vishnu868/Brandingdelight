"""WP 2026 gift sets: model numbers, names, includes, branding options + photo crops."""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lines import pdf_lines, doc, clean
from crops import photo_rects, save_clip, dist, PUB

d = doc("WP 2026")
items = []
for pn in range(1, d.page_count + 1):
    p = d[pn - 1]
    W, H = p.rect.width, p.rect.height
    L = sorted(pdf_lines("WP 2026", pn), key=lambda l: (round(l[2], 3), l[1]))
    models = [l for l in L if re.fullmatch(r"\d{4}", l[5]) and l[0] > 0.02]
    if not models:
        continue
    photos = [r for r, z in photo_rects(p, 0.04, 0.35) if 0.65 < (r.width / r.height) < 1.5]
    title = [l for l in L if l[2] < 0.06 and l[0] > 0.03]
    title = title[0][5] if title else ""
    category = L[0][5] if L and L[0][5] in ("Gift Set", "Pen", "Diary", "Bottle", "Mug") else ""

    def block(after_y, start, stop_re, near_x=None):
        labels = [l for l in L if l[5].upper().startswith(start) and l[2] >= after_y - 0.01]
        if near_x is not None:
            labels = [l for l in labels if abs(l[1] - near_x) < 0.25] or labels
        if not labels:
            return []
        lab = labels[0]
        out = []
        for l in L:
            if l[2] <= lab[2] + 0.003 or abs(l[1] - lab[1]) > 0.09:
                continue
            if re.match(stop_re, l[5], re.I):
                break
            if re.fullmatch(r"\d{4}|MODEL NO\.?", l[5]):
                continue
            out.append(clean(l[5]).strip("• "))
        return out

    for m in models:
        mx, my = (m[1] + m[3]) / 2, m[2]
        # name: size ~0.025 line right below the model number in the same column
        nm = [l for l in L if 0.015 < l[0] < m[0] and 0 < l[2] - my < 0.09 and abs(l[1] - m[1]) < 0.2 and not re.match(r"MODEL|INCLUDES|BRANDING", l[5], re.I)]
        colour = [l for l in L if 0.02 < l[0] < 0.03 and l[5].istitle() and len(l[5].split()) <= 2 and 0.15 < l[2] - my < 0.45 and abs(l[1] - m[1]) < 0.15]
        if nm and len(nm[0][5]) > 6:
            name = nm[0][5]
        else:
            name = title + (f" - {colour[0][5]}" if colour else f" ({m[5]})")
        incl = (block(my, "INCLUDES", r"BRANDING", m[1]) if nm else []) or block(0, "INCLUDES", r"BRANDING")
        brand_opts = (block(my, "BRANDING OPTIONS", r"MODEL|INCLUDES", m[1]) if nm else []) or block(0, "BRANDING OPTIONS", r"MODEL|INCLUDES")
        pt = (mx * W, (my + 0.01) * H)
        img = None
        if photos:
            r = min(photos, key=lambda r: dist(pt, r))
            img = save_clip(p, r, "wp-giftsets", f"wp-{m[5]}", native=3)
        items.append({"key": "wp", "page": pn, "name": clean(name), "subtitle": f"{category or 'Gift set'} · Model {m[5]}",
                      "price": None, "code": m[5], "features": incl[:10], "desc": "",
                      "specs": [["Branding options", "; ".join(brand_opts)]] if brand_opts else [],
                      "images": [img] if img else [], "brand": "BD Corporate Gifts", "catalog": "WP Gift Sets 2026",
                      "category": "Corporate Gift Sets", "subcategory": "Executive Gift Sets" if (category or "Gift Set") == "Gift Set" else category})
json.dump(items, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "raw", "wp.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print(len(items))
for i in items:
    print(i["page"], i["code"], "|", i["name"], "|", i["features"][:4], "|", i["images"])
