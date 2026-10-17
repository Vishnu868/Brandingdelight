"""Portronics (PPT_June_2026): one product per page. Name = largest text, subtitle = text near it, features list, MRP, POR codes."""
import fitz, re, json, sys
doc = fitz.open(r"V:\Chidhvianna\newcatalogues\PPT_June_2026.pdf")
items = []
for pn in range(1, doc.page_count + 1):
    p = doc[pn - 1]
    W, H = p.rect.width, p.rect.height
    spans = []
    for b in p.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            t = "".join(s["text"] for s in l["spans"]).strip()
            if not t:
                continue
            size = max(s["size"] for s in l["spans"])
            x0, y0, x1, y1 = l["bbox"]
            spans.append((size, x0 / W, y0 / H, t))
    txt = " | ".join(s[3] for s in spans)
    m = re.search(r"₹\s*([\d,]+)", txt)
    if not m:
        continue
    price = int(m.group(1).replace(",", ""))
    codes = sorted(set(re.findall(r"POR\s*(\d{2,5})", txt)), key=int)
    big = sorted(spans, key=lambda s: -s[0])
    name = big[0][3]
    # subtitle: spans just below the name in left half, smaller font, not features
    nm = big[0]
    cand = sorted([s for s in spans if s[1] < 0.55 and 0 < s[2] - nm[2] < 0.25 and s[0] < nm[0] * 0.8 and not re.search(r"MRP|₹|POR", s[3])], key=lambda s: s[2])
    sub = [s for s in cand if cand and abs(s[0] - cand[0][0]) < 0.6]
    subtitle = " ".join(s[3] for s in sub)
    feats = [s[3] for s in spans if s[1] > 0.55 and not re.search(r"MRP|₹|POR|^\d+$", s[3]) and s[3] != name]
    # merge broken feature lines (start lowercase or very short)
    merged = []
    for f in feats:
        if merged and (f[:1].islower() or len(merged[-1]) < 6):
            merged[-1] += " " + f
        else:
            merged.append(f)
    items.append({"page": pn, "name": name.strip().replace("�", "-"), "subtitle": subtitle.strip().replace("�", "-"), "price": price, "codes": codes, "features": [f.replace("�", "-").replace(" - ", "-") for f in merged[:10]]})
json.dump(items, open(sys.argv[1], "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print(len(items))
import collections
c = collections.Counter(i["name"].upper() for i in items)
print("dupe names", sum(1 for v in c.values() if v > 1))
for i in items[:40]:
    print(i["page"], "|", i["name"], "|", i["subtitle"][:60], "|", i["price"], i["codes"][:3], i["features"][:3])
