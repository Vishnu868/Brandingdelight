"""Helpers to crop product photos from multi-product pages at native resolution."""
import fitz, os
from PIL import Image

PUB = r"V:\Chidhvianna\brandingdelight\public"


def photo_rects(page, min_area=0.03, max_area=0.9, min_px=200):
    W, H = page.rect.width, page.rect.height
    out = []
    for im in page.get_images(full=True):
        if min(im[2], im[3]) < min_px:
            continue
        for r in page.get_image_rects(im[0]):
            r = r & page.rect
            a = r.width * r.height / (W * H)
            if min_area <= a <= max_area:
                out.append((fitz.Rect(r), im[2] / max(1, r.width)))
    # dedupe identical rects
    uniq = []
    for r, z in out:
        if not any(abs(r.x0 - u.x0) < 2 and abs(r.y0 - u.y0) < 2 and abs(r.x1 - u.x1) < 2 for u, _ in uniq):
            uniq.append((r, z))
    return uniq


def save_clip(page, rect, folder, name, native=2.0, maxdim=1600, pad=0):
    r = fitz.Rect(rect.x0 - pad, rect.y0 - pad, rect.x1 + pad, rect.y1 + pad) & page.rect
    z = max(1.5, min(native, maxdim / max(r.width, r.height)))
    pix = page.get_pixmap(matrix=fitz.Matrix(z, z), clip=r)
    im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    od = os.path.join(PUB, "catalog", folder); td = os.path.join(PUB, "thumbs", folder)
    os.makedirs(od, exist_ok=True); os.makedirs(td, exist_ok=True)
    im.save(os.path.join(od, name + ".webp"), "WEBP", quality=88, method=4)
    t = im.copy(); t.thumbnail((640, 640), Image.LANCZOS)
    t.save(os.path.join(td, name + ".webp"), "WEBP", quality=80, method=4)
    return f"/catalog/{folder}/{name}.webp"


def dist(pt, r):
    x, y = pt
    dx = max(r.x0 - x, 0, x - r.x1)
    dy = max(r.y0 - y, 0, y - r.y1)
    return (dx * dx + dy * dy) ** 0.5
