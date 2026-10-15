"""Extract placed photos (embedded raster images) from pages by rendering their visible rect at native zoom.
Usage: photos.py <pdf-substring> <pages e.g. 7-29,32-43> <prefix> <outdir> <montage.jpg> [minfrac=0.18]"""
import fitz, sys, os
from PIL import Image, ImageDraw

d = r"V:\Chidhvianna\ecommerce\catalogs"
f = [x for x in os.listdir(d) if sys.argv[1].lower() in x.lower()][0]
doc = fitz.open(os.path.join(d, f))
pages = []
for part in sys.argv[2].split(","):
    a, _, b = part.partition("-")
    pages += list(range(int(a), int(b or a) + 1))
prefix, outd = sys.argv[3], sys.argv[4]
os.makedirs(outd, exist_ok=True)
minfrac = float(sys.argv[6]) if len(sys.argv) > 6 else 0.18
thumbs = []
for pn in pages:
    p = doc[pn - 1]
    W, H = p.rect.width, p.rect.height
    rects = []
    for im in p.get_images(full=True):
        for r in p.get_image_rects(im[0]):
            r = r & p.rect
            if r.is_empty:
                continue
            if r.width > minfrac * W and r.height > minfrac * 0.7 * H and not (r.width > 0.95 * W and r.height > 0.95 * H):
                rects.append((r, im[2] / max(1, r.width)))
    # drop rects contained in others
    keep = []
    for r, z in rects:
        if any(o != r and o.contains(r) for o, _ in rects):
            continue
        if any(abs(o.x0 - r.x0) < 2 and abs(o.y0 - r.y0) < 2 for o, _ in keep):
            continue
        keep.append((r, z))
    keep.sort(key=lambda q: (round(q[0].y0 / (H * 0.08)), q[0].x0))
    for i, (r, z) in enumerate(keep, 1):
        zz = max(1.5, min(z, 1600 / max(r.width, r.height)))
        pix = p.get_pixmap(matrix=fitz.Matrix(zz, zz), clip=r)
        img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        name = f"{prefix}-p{pn}-{i}"
        img.save(os.path.join(outd, name + ".webp"), "WEBP", quality=88, method=4)
        t = img.copy(); t.thumbnail((220, 220))
        thumbs.append((name, t))
cols = 8
rows = (len(thumbs) + cols - 1) // cols
s = Image.new("RGB", (cols * 230, rows * 250), "white")
dr = ImageDraw.Draw(s)
for k, (n, t) in enumerate(thumbs):
    x, y = (k % cols) * 230, (k // cols) * 250
    s.paste(t, (x + 5, y + 22))
    dr.text((x + 5, y + 5), n, fill="red")
s.save(sys.argv[5], quality=70)
print(len(thumbs))
