"""Contact sheets for new catalogues. Usage: sheets2.py <outdir> <file-substring> <first> <last> [cols] [thumbw]"""
import fitz, os, sys
from PIL import Image, ImageDraw
D = r"V:\Chidhvianna\newcatalogues"
out, sub, a, b = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
cols = int(sys.argv[5]) if len(sys.argv) > 5 else 4
TW = int(sys.argv[6]) if len(sys.argv) > 6 else 420
os.makedirs(out, exist_ok=True)
f = [x for x in os.listdir(D) if sub.lower() in x.lower()][0]
doc = fitz.open(os.path.join(D, f))
b = min(b, doc.page_count)
ims = []
for pn in range(a, b + 1):
    p = doc[pn - 1]
    z = TW / p.rect.width
    pix = p.get_pixmap(matrix=fitz.Matrix(z, z))
    ims.append((pn, Image.frombytes("RGB", (pix.width, pix.height), pix.samples)))
th = max(i.height for _, i in ims)
rows = (len(ims) + cols - 1) // cols
s = Image.new("RGB", (cols * (TW + 6), rows * (th + 22)), "white")
d = ImageDraw.Draw(s)
for k, (pn, im) in enumerate(ims):
    x, y = (k % cols) * (TW + 6), (k // cols) * (th + 22)
    s.paste(im, (x, y + 20))
    d.text((x + 3, y + 3), f"p{pn}", fill="red")
name = f"{sub.replace(' ', '_')[:12]}_{a}-{b}.jpg"
s.save(os.path.join(out, name), quality=72)
print(name, doc.page_count)
