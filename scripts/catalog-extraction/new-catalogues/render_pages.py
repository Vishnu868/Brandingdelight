"""Render whole pages of one-product-per-page catalogues to WebP (long side 1600px) + 640px thumbs."""
import fitz, os, sys
from PIL import Image
D = r"V:\Chidhvianna\newcatalogues"
PUB = sys.argv[1]  # brandingdelight/public
JOBS = [  # (substring, folder, prefix, maxdim)
    ("PPT_June", "portronics", "por", 1600),
    ("Borosil", "borosil", "bor", 1600),
    ("Desktop Pen", "deskpen", "dpen", 1600),
    ("ELECTRONICS 1", "xgtech", "xgt", 1800),
    ("Fur jaden", "furjaden", "fj", 1600),
    ("JPP", "cardholders", "jpp", 1500),
    ("KIVA", "kiva", "kiva", 1600),
    ("Remaxx", "remaxx", "rmx", 1600),
    ("XG-MP", "xgpens", "xgmp", 1500),
    ("Xech", "xech", "xech", 1700),
    ("metal-flasks", "flasks", "fl", 1600),
    ("notebooks-diaries", "notebooks", "nb", 1600),
    ("power-banks", "powerbanks", "pb", 1600),
    ("Pendrive", "pendrives", "pd", 1400),
    ("EVM", "evm", "evm", 1500),
    ("Wangari", "wangari", "wg", 1500),
]
only = sys.argv[2:] or None
for sub, folder, prefix, md in JOBS:
    if only and folder not in only:
        continue
    f = [x for x in os.listdir(D) if sub.lower() in x.lower()][0]
    doc = fitz.open(os.path.join(D, f))
    od = os.path.join(PUB, "catalog", folder); td = os.path.join(PUB, "thumbs", folder)
    os.makedirs(od, exist_ok=True); os.makedirs(td, exist_ok=True)
    for pn in range(1, doc.page_count + 1):
        out = os.path.join(od, f"{prefix}-p{pn}.webp")
        if os.path.exists(out):
            continue
        p = doc[pn - 1]
        z = md / max(p.rect.width, p.rect.height)
        pix = p.get_pixmap(matrix=fitz.Matrix(z, z))
        im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        im.save(out, "WEBP", quality=86, method=4)
        t = im.copy(); t.thumbnail((640, 640), Image.LANCZOS)
        t.save(os.path.join(td, f"{prefix}-p{pn}.webp"), "WEBP", quality=80, method=4)
    print(folder, doc.page_count, flush=True)
