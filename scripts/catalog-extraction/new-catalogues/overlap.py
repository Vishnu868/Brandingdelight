"""Cross-check new vs old products: perceptual hash of first image + name similarity (any company)."""
import json, re, sys
from PIL import Image
PUB = r"V:\Chidhvianna\brandingdelight\public"
cat = json.load(open(sys.argv[1], encoding="utf-8"))
old = {p["id"] for p in json.load(open(sys.argv[2], encoding="utf-8"))["products"]}
P = cat["products"]


def dhash(path, n=12):
    try:
        im = Image.open(PUB + path.replace("/catalog/", "/thumbs/")).convert("L").resize((n + 1, n), Image.LANCZOS)
    except Exception:
        return None
    px = list(im.getdata())
    return sum(1 << i for i, (y, x) in enumerate((y, x) for y in range(n) for x in range(n)) if px[y * (n + 1) + x] > px[y * (n + 1) + x + 1])


H = {p["id"]: dhash(p["images"][0]) for p in P if p["images"]}
O = [p for p in P if p["id"] in old]
N = [p for p in P if p["id"] not in old]
tok = lambda s: {w for w in re.findall(r"[a-z0-9]+", s.lower()) if len(w) > 2}
out = []
for n in N:
    hn = H.get(n["id"])
    for o in O:
        ho = H.get(o["id"])
        d = bin(hn ^ ho).count("1") if hn is not None and ho is not None else 99
        a, b = tok(n["name"]), tok(o["name"])
        j = len(a & b) / max(1, len(a | b))
        if d <= 12 or j >= 0.75:
            out.append((d, round(j, 2), n["brand"], n["name"], n["catalog"], n["images"][0], o["brand"], o["name"], o["catalog"], o["images"][0]))
out.sort()
json.dump(out, open("overlap.json", "w", encoding="utf-8"), indent=1, ensure_ascii=False)
for r in out:
    print(r[0], r[1], "|", r[2], "-", r[3], "|", r[4], "  <->  ", r[6], "-", r[7], "|", r[8])
