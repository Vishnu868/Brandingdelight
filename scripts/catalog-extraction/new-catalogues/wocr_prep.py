"""Render pages to PNG for Windows OCR: wocr/<key>/p0001.png (long side 2000px)."""
import fitz, os, sys
D = r"V:\Chidhvianna\newcatalogues"
HERE = os.path.dirname(os.path.abspath(__file__))
for sub in sys.argv[1:]:
    f = [x for x in os.listdir(D) if sub.lower() in x.lower()][0]
    key = sub.replace(" ", "_")
    od = os.path.join(HERE, "wocr", key)
    os.makedirs(od, exist_ok=True)
    doc = fitz.open(os.path.join(D, f))
    for pn in range(1, doc.page_count + 1):
        out = os.path.join(od, f"p{pn:04d}.png")
        if os.path.exists(out):
            continue
        p = doc[pn - 1]
        z = 2000 / max(p.rect.width, p.rect.height)
        p.get_pixmap(matrix=fitz.Matrix(z, z)).save(out)
    print(key, doc.page_count, flush=True)
