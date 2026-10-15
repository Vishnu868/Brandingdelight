import os, sys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
n = 0
for root, _, files in os.walk(src):
    for f in files:
        if not f.endswith(".webp"): continue
        sp = os.path.join(root, f)
        dp = os.path.join(dst, os.path.relpath(sp, src))
        os.makedirs(os.path.dirname(dp), exist_ok=True)
        im = Image.open(sp)
        im.thumbnail((640, 640), Image.LANCZOS)
        im.save(dp, "WEBP", quality=80, method=4)
        n += 1
print(n)
