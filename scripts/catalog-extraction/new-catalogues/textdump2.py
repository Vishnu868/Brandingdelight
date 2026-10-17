import fitz, os, sys
D = r"V:\Chidhvianna\newcatalogues"
out = sys.argv[1]
os.makedirs(out, exist_ok=True)
for f in sorted(os.listdir(D)):
    doc = fitz.open(os.path.join(D, f))
    lines = []
    for i, p in enumerate(doc):
        t = " | ".join(x.strip() for x in p.get_text().split("\n") if x.strip())
        if t:
            lines.append(f"p{i+1}: {t}")
    if lines:
        open(os.path.join(out, f.split(".")[0].strip().replace(" ", "_")[:24] + ".txt"), "w", encoding="utf-8").write("\n".join(lines))
print("ok")
