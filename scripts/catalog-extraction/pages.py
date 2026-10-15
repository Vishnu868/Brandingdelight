"""Render whole pages (or halves) as product images at native-ish resolution.
Usage: pages.py <outroot>"""
import fitz, sys, os
from PIL import Image

D = r"V:\Chidhvianna\ecommerce\catalogs"
OUT = sys.argv[1]
JOBS = [
    # (file, folder, prefix, pages, mode, maxdim)
    ("FUZO Black Flyers Catalogue - Sept 2026.pdf", "fuzo", "fuzo", range(1, 98), "page", 1500),
    ("electronics-and-mobile-accessories.pdf", "electronics", "elec", range(1, 97), "page", 1600),
    ("Diwali Dry Fruits.pdf", "dryfruits", "dry", range(1, 16), "page", 1300),
    ("EO Feb 2026.pdf", "eo", "eo", range(1, 33), "halves", 1500),
    ("SMOOR Diwali 2026 (1).pdf", "smoor", "smoor", range(1, 95), "page", 1100),
    ("Loyka Catalogue 2026 (V3) -1_removed.pdf", "loyka", "loyka", range(1, 30), "page", 1600),
    ("Catalogue  (JUNE 2026).pdf", "bottles", "bottle", range(1, 28), "page", 1100),
    ("Hrx trolley's.pdf", "hrx", "hrx", range(1, 23), "page", 1800),
    ("Snitch Travel.pdf", "snitch", "snitch", range(1, 13), "page", 1800),
    ("zestiot options.pdf", "luggage", "zest", range(1, 14), "page", 1600),
    ("Lifelong.pdf", "lifelong-banners", "llb", [1, 2, 3, 29, 34, 40, 42, 50], "page", 1800),
    ("Tamta copper range.pdf", "tamta-banners", "tamb", [1, 3, 8, 19, 25, 31, 39, 53, 62], "page", 1400),
    ("Unwrap Happiness sept 2026.pdf", "unwrap-banners", "unwb", [1, 2, 4, 5, 6], "page", 1400),
]
for fname, folder, prefix, pages, mode, maxdim in JOBS:
    doc = fitz.open(os.path.join(D, fname))
    od = os.path.join(OUT, folder); os.makedirs(od, exist_ok=True)
    n = 0
    for pn in pages:
        if pn > doc.page_count:
            continue
        p = doc[pn - 1]
        r = p.rect
        clips = [("", r)] if mode == "page" else [("a", fitz.Rect(r.x0, r.y0, r.x0 + r.width / 2, r.y1)), ("b", fitz.Rect(r.x0 + r.width / 2, r.y0, r.x1, r.y1))]
        for suf, c in clips:
            z = maxdim / max(c.width, c.height)
            pix = p.get_pixmap(matrix=fitz.Matrix(z, z), clip=c)
            im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
            im.save(os.path.join(od, f"{prefix}-p{pn}{suf}.webp"), "WEBP", quality=86, method=4)
            n += 1
    print(folder, n)
