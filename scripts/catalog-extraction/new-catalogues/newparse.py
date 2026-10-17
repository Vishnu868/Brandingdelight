"""Parse the new catalogues into raw product records -> raw/<key>.json
Record: {key, page, name, subtitle, price, code, features[], desc, images[], brand, catalog}"""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lines import pdf_lines, ocr_lines, doc, titlecase, money, clean

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "raw")
os.makedirs(OUT, exist_ok=True)
NOISE = re.compile(r"^(mrp|price|model no\.?|includes|branding options|colou?r ?options?|available colou?rs?.*|new|launch|gift set|\d{1,3}|~|-|www\..*)$", re.I)


def groups(L, code_re=None):
    """Return (name, subtitle, rest) from sized lines."""
    L = [l for l in L if not NOISE.match(l[5]) and not (code_re and re.search(code_re, l[5], re.I)) and money(l[5]) is None]
    if not L:
        return "", "", []
    S = max(l[0] for l in L)
    big = sorted([l for l in L if l[0] >= 0.88 * S], key=lambda l: (round(l[2], 2), l[1]))
    # keep big lines near the first one (avoid repeated watermark text far away)
    y0 = big[0][2]
    big = [l for l in big if abs(l[2] - y0) < 0.16]
    seen, name_parts = set(), []
    for l in big:
        if l[5].lower() not in seen:
            seen.add(l[5].lower()); name_parts.append(l[5])
    name = " ".join(name_parts)
    rest = [l for l in L if l not in big and l[5].lower() not in seen]
    sizes = sorted({round(l[0], 4) for l in rest if l[0] < 0.88 * S and l[0] > 0.3 * S}, reverse=True)
    sub = ""
    for sz in sizes:
        cand = sorted([l for l in rest if abs(l[0] - sz) < 0.0005 and len(l[5]) > 3], key=lambda l: abs(l[2] - y0))
        if cand:
            near = [l for l in cand if abs(l[2] - cand[0][2]) < 0.08]
            sub = " ".join(l[5] for l in sorted(near, key=lambda l: (l[2], l[1]))[:3])
            if len(sub) > 4 and sub.lower() not in seen:
                break
            sub = ""
    others = [l for l in rest if l[5] not in sub]
    return name, sub, others


def feature_list(lines, maxn=8, minlen=4, maxlen=60):
    out, seen = [], set()
    for l in sorted(lines, key=lambda l: (round(l[2], 2), l[1])):
        t = l[5]
        if minlen <= len(t) <= maxlen and t.lower() not in seen and not re.search(r"view$|^specifications$", t, re.I):
            seen.add(t.lower()); out.append(t)
    # glue split two-line labels ("Dual" + "Output")
    merged = []
    for t in out:
        if merged and (len(merged[-1]) <= 12 and len(t) <= 14 and not merged[-1][-1:].isdigit() or t[:1].islower()):
            merged[-1] += " " + t
        else:
            merged.append(t)
    return merged[:maxn]


def para(lines, minlen=40):
    """Longest descriptive sentence block (lines >= minlen chars, same size), joined."""
    long = [l for l in lines if len(l[5]) >= 25]
    if not long:
        return ""
    by = {}
    for l in long:
        by.setdefault(round(l[0], 4), []).append(l)
    best = max(by.values(), key=lambda g: sum(len(l[5]) for l in g))
    txt = " ".join(l[5] for l in sorted(best, key=lambda l: (round(l[2], 3), l[1])))
    txt = re.sub(r"-\s+(?=[a-z])", "", txt)
    return txt if len(txt) >= minlen else ""


def save(key, items):
    json.dump(items, open(os.path.join(OUT, key + ".json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    print(key, len(items))


# ─────────────────────────── Portronics
def portronics():
    raw = json.load(open(os.path.join(os.path.dirname(OUT), "ppt.json"), encoding="utf-8"))
    merged = {}
    for r in raw:
        k = (r["name"].upper(), tuple(r["codes"]) or r["subtitle"].upper())
        if k in merged:
            merged[k]["images"].append(f"/catalog/portronics/por-p{r['page']}.webp")
            continue
        merged[k] = {"key": "portronics", "page": r["page"], "name": titlecase(r["name"]) if r["name"].isupper() else r["name"],
                     "subtitle": r["subtitle"], "price": r["price"], "code": " / ".join("POR " + c for c in r["codes"]) or None,
                     "features": r["features"], "desc": "", "images": [f"/catalog/portronics/por-p{r['page']}.webp"],
                     "brand": "Portronics", "catalog": "Portronics June 2026"}
    save("portronics", list(merged.values()))


# ─────────────────────────── one-product-per-page text catalogues
def simple(key, sub, folder, prefix, brand, catalog, code_re, pages=None, name_fix=None):
    d = doc(sub)
    items = []
    for pn in pages or range(1, d.page_count + 1):
        L = pdf_lines(sub, pn)
        txt = " | ".join(l[5] for l in L)
        code = re.search(code_re, txt, re.I) if code_re else None
        price = money(txt)
        name, subtitle, rest = groups(L, code_re)
        if not name or (not code and not price):
            continue
        if name_fix:
            name, subtitle = name_fix(name, subtitle, txt)
        items.append({"key": key, "page": pn, "name": name, "subtitle": subtitle, "price": price,
                      "code": re.sub(r"\s+", "", code.group(0)).upper() if code else None,
                      "features": feature_list(rest), "desc": para(rest), "images": [f"/catalog/{folder}/{prefix}-p{pn}.webp"],
                      "brand": brand, "catalog": catalog})
    # merge consecutive pages of the same product (same code or same name)
    out = []
    for it in items:
        if out and ((it["code"] and it["code"] == out[-1]["code"]) or (not it["code"] and it["name"].lower() == out[-1]["name"].lower())):
            out[-1]["images"] += it["images"]
            out[-1]["price"] = out[-1]["price"] or it["price"]
            if len(it["desc"]) > len(out[-1]["desc"]):
                out[-1]["desc"] = it["desc"]
            continue
        out.append(it)
    save(key, out)
    return out


def run():
    portronics()

    def xgt(name, sub, txt):
        n = titlecase(name)
        return (f"{n} {titlecase(sub)}" if len(n) < 14 and sub else n), sub
    simple("xgtech", "ELECTRONICS 1", "xgtech", "xgt", "BD Signature", "Electronics Catalogue (XG-T)", r"XG\s*-\s*t\s*\d+", name_fix=xgt)

    def xgmp(name, sub, txt):
        n = titlecase(name)
        s = titlecase(sub) if sub else "Metal Ball Pen"
        return (n if re.search(r"pen$", n, re.I) else f"{n} {s}"), s
    simple("xgpens", "XG-MP", "xgpens", "xgmp", "BD Signature", "Pen Catalogue (XG-MP)", r"xg\s*-\s*mp\s*\|?\s*\d+", name_fix=xgmp)

    def rmx(name, sub, txt):
        return titlecase(name), titlecase(sub)
    simple("remaxx", "Remaxx", "remaxx", "rmx", "Remaxx", "Remaxx Product Catalogue", r"RE\s?\d{4}", name_fix=rmx)

    def xech(name, sub, txt):
        return titlecase(name), sub
    simple("xech", "Xech", "xech", "xech", "Xech", "Xech February 2026", None, name_fix=xech)

    def boro(name, sub, txt):
        m = re.search(r"BOROSIL[^|]+", txt)
        n = titlecase(clean(m.group(0))) if m else titlecase(name)
        return n, sub
    simple("borosil", "Borosil", "borosil", "bor", "Borosil", "Borosil Catalog 2026", None, name_fix=boro)


if __name__ == "__main__":
    run()
