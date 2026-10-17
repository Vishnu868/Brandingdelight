"""EVM + Wangari: big product names (>=0.03 page height), subtitle + description below, nearest photo crop."""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lines import pdf_lines, doc, clean
from crops import photo_rects, save_clip, dist

HERE = os.path.dirname(os.path.abspath(__file__))


def run(sub, key, brand, catalog, folder, prefix):
    d = doc(sub)
    items, seen = [], set()
    for pn in range(2, d.page_count + 1):
        p = d[pn - 1]
        W, H = p.rect.width, p.rect.height
        L = pdf_lines(sub, pn)
        names = [l for l in L if l[0] >= 0.03 and not re.fullmatch(r"\d{1,3}|Dashcam|Bluetooth Speaker|[\d.]+W|QC\+PD", l[5])]
        # join stacked name lines (e.g. CORK DIARY / POWERBANK)
        joined = []
        for l in sorted(names, key=lambda l: (round(l[1], 1), l[2])):
            if joined and l[5] == joined[-1][5]:
                continue
            if joined and abs(l[1] - joined[-1][1]) < 0.03 and 0 < l[2] - joined[-1][2] < 0.05:
                j = joined[-1]
                joined[-1] = (j[0], j[1], j[2], max(j[3], l[3]), l[4], j[5] + " " + l[5])
            else:
                joined.append(l)
        names = joined
        photos = [r for r, z in photo_rects(p, 0.03, 0.6)]
        for n in names:
            nm = n[5]
            if nm.lower() in seen:
                continue
            seen.add(nm.lower())
            # subtitle: lines 0.018-0.03 size just below the name (same column)
            subl = [l for l in L if 0.012 < l[0] < n[0] * 0.75 and 0 < l[2] - n[2] < 0.1 and abs(l[1] - n[1]) < 0.12 and len(l[5]) < 45]
            subl = sorted(subl, key=lambda l: l[2])
            subl = [l for l in subl if not re.search(r"\b(is|you|are|the all|whether|stay|designed|this|power banks)\b", l[5], re.I)]
            big_sub = [l for l in subl if l[0] >= 0.014]
            subtitle = " ".join(l[5] for l in big_sub[:2]) if big_sub else ""
            desc_l = sorted([l for l in L if 0.012 < l[0] < 0.019 and 0 < l[2] - n[2] < 0.32 and abs(l[1] - n[1]) < 0.12 and len(l[5]) > 12 and l[5] not in subtitle], key=lambda l: l[2])
            desc = re.sub(r"-\s+(?=[a-z])", "", " ".join(l[5] for l in desc_l))
            feats = [l[5] for l in L if l[0] < 0.013 and abs(l[1] - n[1]) < 0.45 and 0 < l[2] - n[2] < 0.35 and 3 < len(l[5]) < 30]
            pt = ((n[1] + n[3]) / 2 * W, n[2] * H)
            img = None
            if photos:
                r = min(photos, key=lambda r: dist(pt, r))
                img = save_clip(p, r, folder, f"{prefix}-{re.sub(r'[^a-z0-9]+', '-', nm.lower()).strip('-')}", native=3)
            items.append({"key": key, "page": pn, "name": nm if len(nm) > 3 else f"{nm} {subtitle}", "subtitle": subtitle, "price": None, "code": None,
                          "features": feats[:6], "desc": desc, "images": [img] if img else [], "brand": brand, "catalog": catalog})
    json.dump(items, open(os.path.join(HERE, "raw", key + ".json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    print(key, len(items))
    for i in items:
        print(" ", i["page"], "|", i["name"], "|", i["subtitle"], "|", i["desc"][:60], "|", i["images"])


run("EVM", "evm", "EVM", "EVM Catalogue", "evm", "evm")
run("Wangari", "wangari", "Wangari", "Wangari Sustainable Innovations", "wangari", "wg")
