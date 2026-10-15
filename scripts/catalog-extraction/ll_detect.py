"""Detect Lifelong product cells (via orange code tags) and product photo bboxes.
Usage: python ll_detect.py <pages e.g. 5,6 or all> <outdir>
Writes annotated previews + JSON of boxes in page-fraction coordinates."""
import fitz, sys, os, json
import numpy as np, cv2

PDF = r"V:\Chidhvianna\ecommerce\catalogs\Lifelong.pdf"
doc = fitz.open(PDF)
outd = sys.argv[2]
os.makedirs(outd, exist_ok=True)
pages = range(1, doc.page_count + 1) if sys.argv[1] == "all" else [int(x) for x in sys.argv[1].split(",")]
Z = 1.2


def render(p, z):
    pix = p.get_pixmap(matrix=fitz.Matrix(z, z))
    a = np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, pix.n)[:, :, :3]
    return a.copy()


def detect(img):
    H, W = img.shape[:2]
    r, g, b = [img[:, :, i].astype(int) for i in range(3)]
    tag = (r > 170) & (r < 235) & (g > 60) & (g < 120) & (b < 80)
    n, lab, st, _ = cv2.connectedComponentsWithStats(tag.astype(np.uint8), 8)
    tags = []
    for i in range(1, n):
        x, y, w, h, a = st[i]
        if w > W * 0.06 and 0.025 * H < h < 0.08 * H and a > 0.5 * w * h:
            tags.append([int(x), int(y), int(w), int(h)])
    tags.sort(key=lambda t: (round(t[1] / (H * 0.1)), t[0]))
    return tags


def bg_color(img, x, y):
    patch = img[max(0, y - 6):y - 2, x:x + 20].reshape(-1, 3)
    return np.median(patch, axis=0)


def textmask(img):
    r, g, b = [img[:, :, i].astype(int) for i in range(3)]
    mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b)
    gray = (mx < 120) & (mx - mn < 30)
    red = (r > 150) & (g < 80) & (b < 80)
    orange = (r > 200) & (g > 80) & (g < 150) & (b < 90)
    return gray | red | orange


def group_rows(tags, H):
    rows = []
    for t in sorted(tags, key=lambda t: t[1]):
        if rows and t[1] - rows[-1][0][1] < 0.05 * H:
            rows[-1].append(t)
        else:
            rows.append([t])
    return [sorted(r, key=lambda t: t[0]) for r in rows]


def products(img, tags):
    H, W = img.shape[:2]
    tm = textmask(img)
    res = []
    rows = group_rows(tags, H)
    for ri, ts in enumerate(rows):
        for i, t in enumerate(ts):
            x0 = max(0, t[0] - int(0.02 * W))
            x1 = ts[i + 1][0] - int(0.015 * W) if i + 1 < len(ts) else W - int(0.01 * W)
            y0 = t[1]
            y1 = rows[ri + 1][0][1] - int(0.03 * H) if ri + 1 < len(rows) else H - int(0.01 * H)
            sx, sy = min(W - 1, t[0] + t[2] + 15), t[1] + t[3] // 2
            bg = img[sy, sx].astype(int)
            near = (np.abs(img.astype(int) - bg).sum(axis=2) < 30).astype(np.uint8)
            nn, nlab, nst, _ = cv2.connectedComponentsWithStats(near, 4)
            cx, cy, cw, ch, _a = nst[nlab[sy, sx]]
            x0 = max(x0, cx + 3); x1 = min(x1, cx + cw - 3)
            y1 = min(y1, cy + ch - 3)
            if y1 - y0 < 20 or x1 - x0 < 20:
                res.append({"tag": t, "cell": [x0, y0, max(x1, x0 + 1), max(y1, y0 + 1)], "prod": None, "text": None}); continue
            # text block: rows with text-coloured pixels starting at left margin
            lm0, lm1 = t[0] - 4, t[0] + int(0.03 * W)
            last, first, tr = None, None, t[0] + t[2]
            for y in range(t[1] + t[3] + 2, min(y1, t[1] + int(0.26 * H))):
                if tm[y, lm0:lm1].sum() >= 2:
                    if first is None: first = y
                    last = y
                    # walk right
                    xs = np.nonzero(tm[y, lm0:x1])[0]
                    if len(xs):
                        reach = lm0; gap = int(0.025 * W)
                        for xx in xs + lm0:
                            if xx - reach <= gap: reach = xx
                            else: break
                        tr = max(tr, reach)
                elif last is not None and y - last > 0.09 * H:
                    break
            tb = (last or (t[1] + t[3])) + int(0.008 * H)
            trect = [x0, y0, min(x1, tr + int(0.008 * W)), tb]
            cell = img[y0:y1, x0:x1].astype(int)
            diff = np.abs(cell - bg).sum(axis=2)
            m = (diff > 28).astype(np.uint8)
            m[0:t[3] + 4, 0:max(t[0] + t[2] - x0 + 10, trect[2] - x0)] = 0
            m = cv2.dilate(m, np.ones((2, 3), np.uint8))
            n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
            keep = np.zeros_like(m)
            tx1, ty1 = trect[2] - x0, tb - y0
            boxes = []
            for k in range(1, n):
                x, y, w, h, a = st[k]
                if w < 0.01 * W:
                    continue
                # inside text block -> text
                ix = max(0, min(x + w, tx1) - x); iy = max(0, min(y + h, ty1) - y)
                if ix * iy > 0.6 * w * h:
                    continue
                if (h > 0.05 * H or w > 0.08 * W) and a > 0.0012 * W * H:
                    boxes.append((x, y, x + w, y + h)); keep[lab == k] = 1
            pb = None
            if boxes:
                bx0 = min(b[0] for b in boxes); by0 = min(b[1] for b in boxes)
                bx1 = max(b[2] for b in boxes); by1 = max(b[3] for b in boxes)
                if bx0 < tx1 and by0 < ty1:
                    tot = keep.sum() + 1
                    lost_top = keep[:ty1, :].sum() / tot
                    lost_left = keep[:, :tx1].sum() / tot
                    if min(lost_top, lost_left) < 0.03:
                        if lost_top <= lost_left: by0 = max(by0, ty1)
                        else: bx0 = max(bx0, tx1)
                pad = int(0.012 * W)
                pb = [max(x0, x0 + bx0 - pad), max(y0, y0 + by0 - pad), min(W, x0 + bx1 + pad), min(H, y0 + by1 + pad)]
            if pb is None and y1 - tb > 0.12 * H:
                pb = [x0, tb, x1, y1]
            res.append({"tag": t, "cell": [x0, y0, x1, y1], "prod": pb, "text": trect, "bg": [int(v) for v in bg]})
    return res


allres = {}
for pn in pages:
    p = doc[pn - 1]
    img = render(p, Z)
    H, W = img.shape[:2]
    tags = detect(img)
    res = products(img, tags)
    vis = img.copy()
    for k, r in enumerate(res):
        t = r["tag"]
        cv2.rectangle(vis, (t[0], t[1]), (t[0] + t[2], t[1] + t[3]), (0, 0, 255), 2)
        c = r["cell"]
        cv2.rectangle(vis, (c[0], c[1]), (c[2], c[3]), (0, 160, 0), 1)
        if r["prod"]:
            b = r["prod"]
            cv2.rectangle(vis, (b[0], b[1]), (b[2], b[3]), (255, 0, 255), 3)
        if r.get("text"):
            q = r["text"]; cv2.rectangle(vis, (q[0], q[1]), (q[2], q[3]), (255, 160, 0), 1)
        cv2.putText(vis, str(k + 1), (t[0] + 2, t[1] - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
    cv2.imwrite(os.path.join(outd, f"ll_{pn:02d}.jpg"), cv2.cvtColor(vis, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 70])
    fr = lambda q: [v / (W if i % 2 == 0 else H) for i, v in enumerate(q)] if q else None
    allres[pn] = [{"cell": fr(r["cell"]), "text": fr(r.get("text")), "bg": r.get("bg"),
                   "prod": [v / (W if i % 2 == 0 else H) for i, v in enumerate(r["prod"])] if r["prod"] else None}
                  for r in res]
    print(pn, len(res), sum(1 for r in res if r["prod"]))
json.dump(allres, open(os.path.join(outd, "ll_boxes.json"), "w"), indent=0)
