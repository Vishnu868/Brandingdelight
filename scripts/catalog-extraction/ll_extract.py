"""Crop Lifelong product photos at native resolution using boxes from ll_detect,
erase stray text/dividers, pad to a square tile in the card colour.
Usage: python ll_extract.py <boxes.json> <notes.txt> <outdir>"""
import fitz, sys, os, json, re
import numpy as np, cv2
from PIL import Image

boxes = json.load(open(sys.argv[1]))
outd = sys.argv[3]
os.makedirs(outd, exist_ok=True)
doc = fitz.open(r"V:\Chidhvianna\ecommerce\catalogs\Lifelong.pdf")
Z = 3.0
rows = [l.rstrip("\n").split("|") for l in open(sys.argv[2], encoding="utf-8") if l[0].isdigit()]
done = 0
for r in rows:
    pg, idx, code = int(r[0]), int(r[1]), r[2]
    if code == "DUP":
        continue
    b = boxes[str(pg)][idx - 1]
    p = doc[pg - 1]
    W, H = p.rect.width, p.rect.height
    box = list(b["prod"] or b["cell"])
    cell = b["cell"]
    # clamp to the card so neighbouring cards / page margin never leak in
    box = [max(box[0], cell[0]), max(box[1], cell[1]), min(box[2], cell[2]), min(box[3], cell[3] + 0.004)]
    clip = fitz.Rect(box[0] * W, box[1] * H, box[2] * W, box[3] * H)
    pix = p.get_pixmap(matrix=fitz.Matrix(Z, Z), clip=clip)
    a = np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, pix.n)[:, :, :3].copy()
    h, w = a.shape[:2]
    bg = np.array(b["bg"] or a[2, 2].tolist(), dtype=int)
    diff = np.abs(a.astype(int) - bg).sum(axis=2)
    m = (diff > 28).astype(np.uint8)
    md = cv2.dilate(m, np.ones((5, 7), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(md, 8)
    tr = b.get("text")
    if tr:
        tx0 = (tr[0] - box[0]) * W * Z; ty0 = (tr[1] - box[1]) * H * Z
        tx1 = (tr[2] - box[0]) * W * Z; ty1 = (tr[3] - box[1]) * H * Z
    keep = np.zeros(n, bool)
    for k in range(1, n):
        x, y, cw, ch, area = st[k]
        if cw < 0.006 * W * Z and ch > 0.5 * h:     # thin divider line
            continue
        big = ch > 0.05 * H * Z or cw > 0.08 * W * Z
        if not big or area < 0.0012 * W * H * Z * Z or ch < 0.035 * H * Z:
            continue
        if tr:
            ix = max(0, min(x + cw, tx1) - max(x, tx0)); iy = max(0, min(y + ch, ty1) - max(y, ty0))
            if ix * iy > 0.6 * cw * ch:
                continue
        keep[k] = True
    erase = (m == 1) & ~keep[lab]
    a[erase] = bg
    im = Image.fromarray(a)
    side = int(max(w, h) * 1.08)
    sq = Image.new("RGB", (side, side), tuple(int(v) for v in bg))
    sq.paste(im, ((side - w) // 2, (side - h) // 2))
    if side > 1400:
        sq = sq.resize((1400, 1400), Image.LANCZOS)
    slug = re.sub(r"[^a-z0-9]+", "-", code.lower()).strip("-")
    sq.save(os.path.join(outd, f"{slug}.webp"), "WEBP", quality=90, method=6)
    done += 1
print("saved", done)
