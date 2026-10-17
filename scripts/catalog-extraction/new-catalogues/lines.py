"""Shared helpers: page text lines with font size (from PDF text or OCR), normalised to page fractions."""
import fitz, os, json, re

D = r"V:\Chidhvianna\newcatalogues"
HERE = os.path.dirname(os.path.abspath(__file__))
_docs = {}


def doc(sub):
    if sub not in _docs:
        f = [x for x in os.listdir(D) if sub.lower() in x.lower()][0]
        _docs[sub] = fitz.open(os.path.join(D, f))
    return _docs[sub]


def clean(t):
    t = t.replace("\ufffd", "-").replace("Ʃ", "tt").replace("Ɵ", "ti").replace("Ō", "ft").replace("ﬁ", "fi").replace("ﬂ", "fl").replace("ﬃ", "ffi").replace("ﬀ", "ff").replace("’", "'")
    return re.sub(r"\s+", " ", t).strip()


def pdf_lines(sub, pn):
    """[(size, x0, y0, x1, y1, text)] size = font size / page height."""
    p = doc(sub)[pn - 1]
    W, H = p.rect.width, p.rect.height
    out = []
    for b in p.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            t = clean("".join(s["text"] for s in l["spans"]))
            if not t:
                continue
            x0, y0, x1, y1 = l["bbox"]
            out.append((max(s["size"] for s in l["spans"]) / H, x0 / W, y0 / H, x1 / W, y1 / H, t))
    return out


_ocr = {}


def ocr_lines(key, pn):
    if key not in _ocr:
        path = os.path.join(HERE, "ocr", key + ".json")
        _ocr[key] = json.load(open(path)) if os.path.exists(path) else {}
    return [(b[3] - b[1], b[0], b[1], b[2], b[3], clean(b[4])) for b in _ocr[key].get(str(pn), []) if b[5] > 0.2]


def titlecase(s):
    small = {"and", "with", "for", "of", "in", "on", "the", "to", "a", "&"}
    words = s.split()
    out = []
    for i, w in enumerate(words):
        lw = w.lower()
        if re.search(r"\d", w) and re.search(r"[a-z]", w, re.I) and len(w) <= 7:
            out.append(w.upper() if re.fullmatch(r"\d*[a-z]{1,3}\d*", lw) and lw not in ("in",) else w)
        elif i and lw in small:
            out.append(lw)
        elif w.isupper() or w.islower():
            out.append(w[:1].upper() + w[1:].lower())
        else:
            out.append(w)
    return " ".join(out).replace("Mah", "mAh").replace("Usb", "USB").replace("Led", "LED").replace("Rgb", "RGB").replace("Tws", "TWS").replace("Pu ", "PU ").replace("Rfid", "RFID")


def money(t):
    m = re.search(r"(?:₹|Rs\.?|MRP\s*:?\s*|`)\s*([\d,]{3,7})(?:\.\d+)?", t)
    return int(m.group(1).replace(",", "")) if m else None


_w = {}


def wocr_lines(key, pn):
    """Windows OCR lines for page pn: [(height, x0, y0, x1, y1, text)] in page fractions."""
    if key not in _w:
        path = os.path.join(HERE, "wocr", key + ".jsonl")
        m = {}
        if os.path.exists(path):
            for ln in open(path, encoding="utf-8-sig"):
                ln = ln.strip()
                if not ln:
                    continue
                o = json.loads(ln)
                n = int(re.search(r"\d+", o["file"]).group(0))
                W, H = o["w"], o["h"]
                ls = o["lines"] if isinstance(o["lines"], list) else [o["lines"]]
                m[n] = [((l["y1"] - l["y0"]) / H, l["x0"] / W, l["y0"] / H, l["x1"] / W, l["y1"] / H, clean(l["t"])) for l in ls if l and l.get("t")]
        _w[key] = m
    return _w[key].get(pn, [])
