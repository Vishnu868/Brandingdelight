"""OCR every page of image-only catalogues. Output: ocr/<key>.json {page: [[x0,y0,x1,y1,text,conf], ...]} (coords as page fractions)."""
import fitz, os, sys, json
import numpy as np
import easyocr, torch
torch.set_num_threads(int(os.environ.get("OCR_THREADS", "3")))

D = r"V:\Chidhvianna\newcatalogues"
OUT = sys.argv[1]
SUBS = sys.argv[2:]
os.makedirs(OUT, exist_ok=True)
reader = easyocr.Reader(["en"], gpu=False, verbose=False)
for sub in SUBS:
    f = [x for x in os.listdir(D) if sub.lower() in x.lower()][0]
    key = sub.replace(" ", "_")
    path = os.path.join(OUT, key + ".json")
    res = json.load(open(path)) if os.path.exists(path) else {}
    doc = fitz.open(os.path.join(D, f))
    for pn in range(1, doc.page_count + 1):
        if str(pn) in res:
            continue
        p = doc[pn - 1]
        z = 1300 / max(p.rect.width, p.rect.height)
        pix = p.get_pixmap(matrix=fitz.Matrix(z, z))
        a = np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, pix.n)[:, :, :3]
        H, W = a.shape[:2]
        out = []
        for box, text, conf in reader.readtext(a):
            xs = [b[0] for b in box]; ys = [b[1] for b in box]
            out.append([round(min(xs) / W, 4), round(min(ys) / H, 4), round(max(xs) / W, 4), round(max(ys) / H, 4), text, round(float(conf), 2)])
        res[str(pn)] = out
        json.dump(res, open(path, "w"))
    print("done", sub, doc.page_count, flush=True)
