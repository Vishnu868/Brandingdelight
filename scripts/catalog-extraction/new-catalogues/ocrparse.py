"""OCR-based parsers for image-only catalogues (one product per page)."""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lines import wocr_lines, ocr_lines, titlecase, clean, doc

HERE = os.path.dirname(os.path.abspath(__file__))
JUNK = re.compile(r"optimi[sz]ed by|imageopt|www\.|premium collection|^\d{1,3}$|^[^a-z0-9]{0,3}$|available colou?rs?|^code$", re.I)


def fixnum(t):
    """OCR digit fixes inside numbers: O->0, I/l->1."""
    return re.sub(r"(?<=[\d,.])[Oo]|[Oo](?=[\d,.])|(?<=\d)[Il]|[Il](?=\d)", lambda m: "0" if m.group(0) in "Oo" else "1", t)


BUL = re.compile(r"^[•\-–+*·]\s*\S|^[e.]\s+[A-Z]")


def bullets(L, maxn=10):
    """Bullet points, with wrapped continuation lines joined back on."""
    rows = sorted(L, key=lambda l: (round(l[2], 3), l[1]))
    out = []  # [text, x, last_y, height]
    for l in rows:
        t = l[5]
        if BUL.match(t) or (re.match(r"^[A-Z0-9][\w&/+%. -]{2,40}\s[-—–:]\s\S", t) and len(t) > 18):
            t = re.sub(r"^[•\-–+*·e.]\s*", "", t).strip()
            out.append([t, l[1], l[4], l[0]])
            continue
        # continuation: just below the previous bullet, roughly aligned, not a new heading
        if out:
            p = out[-1]
            if 0 <= l[2] - p[2] < 1.8 * p[3] and abs(l[1] - p[1]) < 0.06 and not t.isupper():
                p[0] += " " + t
                p[2] = l[4]
    res = []
    for t, *_ in out:
        t = re.sub(r"\s+", " ", t).replace("3-in-l", "3-in-1").replace("mI", "ml").strip(" ,")
        t = re.sub(r"\s*[—–]\s*", " - ", t)
        if 6 < len(t) and not JUNK.search(t):
            res.append(t[:160])
    return res[:maxn]


def save(key, items):
    json.dump(items, open(os.path.join(HERE, "raw", key + ".json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    print(key, len(items))


def simple(key, okey, folder, prefix, brand, catalog, code_re, code_fmt, pages, name_fn, price_re=None, extra=None):
    items = []
    for pn in pages:
        L = [l for l in wocr_lines(okey, pn) if not JUNK.search(l[5])]
        txt = " | ".join(l[5] for l in sorted(L, key=lambda l: (round(l[2], 2), l[1])))
        m = re.search(code_re, fixnum(txt), re.I)
        if not m:
            continue
        code = code_fmt(m)
        name, subtitle = name_fn(L, txt)
        if not name:
            continue
        price = None
        if price_re:
            pm = re.search(price_re, fixnum(txt), re.I)
            if pm:
                price = int(re.sub(r"\D", "", pm.group(1)))
        feats = bullets(L)
        it = {"key": key, "page": pn, "name": name, "subtitle": subtitle, "price": price, "code": code,
              "features": feats, "desc": "", "images": [f"/catalog/{folder}/{prefix}-p{pn}.webp"], "brand": brand, "catalog": catalog}
        if extra:
            extra(it, L, txt)
        if items and items[-1]["code"] == code:
            items[-1]["images"] += it["images"]
            items[-1]["features"] = items[-1]["features"] or feats
            items[-1]["price"] = items[-1]["price"] or price
            continue
        items.append(it)
    save(key, items)
    return items


def by_height(L, before_y=1.0):
    return sorted([l for l in L if l[2] < before_y], key=lambda l: -l[0])


# ── metal flasks / sippers / mugs  (stylised name, descriptor, "with ..." line, Product Code : H 388)
def flask_name(L, txt):
    pc = [l for l in L if re.search(r"product code", l[5], re.I)]
    top = pc[0][2] if pc else 0.5
    cand = [l for l in L if l[2] < top + 0.01 and len(l[5]) > 2]
    if not cand:
        return "", ""
    ordered = sorted(cand, key=lambda l: (round(l[2], 3), l[1]))
    big = max(cand, key=lambda l: l[0])
    after = [l for l in ordered if l[2] > big[2]]
    desc = [l[5] for l in after if l[5].isupper() and len(l[5]) > 3][:2]
    stylised = big[5].replace("5", "S") if not re.search(r"\d{2}", big[5]) else big[5]
    if big[5].isupper() and not desc:
        name = titlecase(big[5])
    else:
        name = titlecase(stylised) + (" " + titlecase(desc[0]) if desc and desc[0] != big[5] else "")
    sub = desc[1].capitalize() if len(desc) > 1 else ""
    return name.strip(" :|"), sub


def run_flasks():
    d = doc("metal-flasks")
    simple("flasks", "metal-flasks", "flasks", "fl", "BD Signature", "Metal Flasks, Sippers & Mugs",
           r"product code\s*:?\s*([A-Z])\s*[-]?\s*(\d{2,4})\s*([A-Z]?)\b", lambda m: f"{m.group(1).upper()} {m.group(2)}{(' ' + m.group(3).upper()) if m.group(3) else ''}",
           range(2, d.page_count + 1), flask_name)


def run_powerbanks():
    d = doc("power-banks")
    simple("powerbanks", "power-banks", "powerbanks", "pb", "BD Tech Essentials", "Power Banks",
           r"product code\s*:?\s*([A-Z])\s*[-]?\s*(\d{2,4})\s*([A-Z]?)\b", lambda m: f"{m.group(1).upper()} {m.group(2)}{(' ' + m.group(3).upper()) if m.group(3) else ''}",
           range(2, d.page_count + 1), flask_name)


def run_notebooks():
    d = doc("notebooks-diaries")
    simple("notebooks", "notebooks-diaries", "notebooks", "nb", "BD Signature", "Notebooks, Diaries & Notepads",
           r"product code\s*:?\s*([A-Z])\s*[-]?\s*(\d{2,4})\s*([A-Z]?)\b", lambda m: f"{m.group(1).upper()} {m.group(2)}{(' ' + m.group(3).upper()) if m.group(3) else ''}",
           range(2, d.page_count + 1), flask_name)


# ── pendrives: "DC 02 | Metal Visiting Card Pen Drive | • Material..."
def pd_name(L, txt):
    cand = [l for l in L if not re.match(r"^(DC\s*\d+|[•e]\s|branding options|product info)", l[5], re.I) and len(l[5]) > 6]
    if not cand:
        return "", ""
    first = min(cand, key=lambda l: (round(l[2], 2), l[1]))
    n = titlecase(first[5])
    if not re.search(r"drive|usb|pen ?drive|otg", n, re.I):
        n += " Pen Drive"
    return n, ""


def pd_extra(it, L, txt):
    specs = re.findall(r"(Material|USB Interface|Interface Type|Category|Capacity)\s*:\s*([^|•]+)", txt, re.I)
    it["specs"] = [[a.title(), b.strip()] for a, b in specs]
    bo = re.search(r"Branding Options\s*\|(.*?)(?:\||$)(.*)", txt, re.I)
    opts = re.findall(r"(UV Printing|Screen Printing|Digital Printing|Laser Engraving|Embossing|Debossing)", txt, re.I)
    if opts:
        it["specs"].append(["Branding options", ", ".join(dict.fromkeys(o.title() for o in opts))])
    it["features"] = [f"{a.title()}: {b.strip()}" for a, b in specs][:6]


def run_pendrives():
    d = doc("Pendrive")
    simple("pendrives", "Pendrive", "pendrives", "pd", "BD Tech Essentials", "Pen Drive Catalogue",
           r"\bD\s*C\s*[-]?\s*(\d{1,3})\b", lambda m: f"DC {int(m.group(1)):02d}", range(1, d.page_count + 1), pd_name, extra=pd_extra)


# ── desk pen holders: "XG-D01" + big title words in image
def dpen_name(L, txt):
    big = sorted([l for l in L if l[2] > 0.55 and l[1] < 0.5 and len(l[5]) > 3], key=lambda l: -l[0])[:3]
    big = sorted(big, key=lambda l: l[2])
    n = " ".join(l[5] for l in big)
    return titlecase(n), ""




def manual(key, okey, namesfile, folder, prefix, brand, catalog, price_col=False):
    """Names/codes transcribed by hand (names_*.txt: page|code|name|subtitle[|price]); features from OCR bullets."""
    items = []
    for ln in open(os.path.join(HERE, namesfile), encoding="utf-8"):
        parts = ln.rstrip("\n").split("|")
        if not parts[0].isdigit():
            continue
        pn = int(parts[0])
        code, name, sub = parts[1], parts[2], parts[3] if len(parts) > 3 else ""
        price = int(parts[4]) if price_col and len(parts) > 4 and parts[4].strip().isdigit() else None
        L = [l for l in wocr_lines(okey, pn) if not JUNK.search(l[5])]
        feats = [f for f in bullets(L) if not re.search(r"product code|capacity", f, re.I)]
        items.append({"key": key, "page": pn, "name": name, "subtitle": sub, "price": price, "code": code or None,
                      "features": feats[:8], "desc": "", "images": [f"/catalog/{folder}/{prefix}-p{pn}.webp"], "brand": brand, "catalog": catalog})
    save(key, items)
    return items


def run_flasks():
    manual("flasks", "metal-flasks", "names_flasks.txt", "flasks", "fl", "BD Signature", "Metal Flasks, Sippers & Mugs")


def run_powerbanks():
    manual("powerbanks", "power-banks", "names_powerbanks.txt", "powerbanks", "pb", "BD Tech Essentials", "Power Banks")




def run_deskpen():
    manual("deskpen", "Desktop_Pen", "names_deskpen.txt", "deskpen", "dpen", "BD Signature", "Desktop Pen Holders")




def run_notebooks():
    manual("notebooks", "notebooks-diaries", "names_notebooks.txt", "notebooks", "nb", "BD Signature", "Notebooks, Diaries & Notepads")


def run_xech():
    manual("xech", "Xech", "names_xech.txt", "xech", "xech", "Xech", "Xech February 2026", price_col=True)


if __name__ == "__main__":
    which = sys.argv[1:]
    for w in which:
        globals()["run_" + w]()
