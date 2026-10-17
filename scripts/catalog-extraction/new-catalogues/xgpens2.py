"""XG-MP pen catalogue from Windows OCR (the PDF's Type3 font mangles the last glyph of each text run)."""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lines import doc, wocr_lines, titlecase

HERE = os.path.dirname(os.path.abspath(__file__))
CAT = "Pen Catalogue (XG-MP)"
COLOURS = r"BLUE|BLACK|RED|WHITE|GREEN|ORANGE|SILVER|GOLD|GREY|GRAY|PINK|PURPLE|YELLOW|BROWN|DARK BLUE|ROSE GOLD|NAVY|MAROON|COPPER|CHROME"
FIX = {"2-1n-1": "2-in-1", "Pen Gold Accents US TIP": "Ballpoint Pen with Gold Accents", "Timber a Bamboo with Chrome Finish Pen": "Timbera Bamboo Pen with Chrome Finish",
       "Touchy,": "Touchy", "Metal Pen Ballpoint": "Metal Ballpoint Pen", "Eco Stylus": "with Stylus", "2-ring": "2-Ring", "T-shock": "T-Shock", "Eco-cork": "Eco-Cork",
       "Moon Sliver": "Moon Silver", "Bamboo Pen Stylus Tip": "Bamboo Pen with Stylus Tip", "Rollerball Pen Metal": "Rollerball Metal Pen"}
CODE_FIX = {8: 7, 15: 14}  # pages where the OCR missed the printed code number
SIZE = re.compile(r"^(\d+(?:\.\d+)?)\s*[xX×*]\s*(\d+(?:\.\d+)?)(?:\s*[xX×*]\s*(\d+(?:\.\d+)?))?\s*cm", re.I)
JUNK = re.compile(r"^(signature design|color options|colour options|options|eco|xg - mp.*|stylus tip|metal ball pen)$", re.I)


def group_bullets(body):
    """Bullets sit at the left indent (or start with a bullet); wrapped lines are indented a little further."""
    body = [l for l in sorted(body, key=lambda l: (round(l[2], 3), l[1])) if len(l[5].strip()) > 1]
    if not body:
        return []
    x0 = min(l[1] for l in body)
    out = []
    for l in body:
        t = l[5].strip()
        new = t.startswith(("•", "·")) or l[1] < x0 + 0.012
        t = t.lstrip("•· ").strip()
        if new or not out:
            out.append(t)
        else:
            out[-1] += " " + t
    res = []
    for t in out:
        t = re.sub(r"\s+", " ", t).replace("Non- ", "Non-").replace("-mated", "-plated").replace(" — ", " – ")
        # a size line sometimes swallows the next bullets: split them off
        m = SIZE.match(t)
        if m:
            res.append(" × ".join(x for x in m.groups() if x) + " cm")
            t = t[m.end():].strip()
        for part in re.split(r"(?<=[a-z.])\s+(?=Signature Design\b|Fluid Writing\b|Smooth Writing\b|Smooth Performance\b|Stylus Tip\b|Eco-Friendly Bamboo Body\b|Natural And Sustainable\b|Integrated Stylus\b|Features A Classic\b)", t):
            part = re.sub(r"\s*(COLOR|COLOUR)?\s*OPTIONS$|\s+(ECO|COLOR|COLOUR)$", "", part).strip(" ;")
            if len(part) > 3 and not JUNK.match(part):
                res.append(part[:1].upper() + part[1:])
    merged = []
    for t in res:  # a lone word cut off by a split belongs to the next bullet ("Integrated" + "Stylus Tip ...")
        if merged and merged[-1] in ("Integrated", "Bold Color Options Features A"):
            merged[-1] += " " + t[:1].lower() + t[1:]
        elif merged and re.search(r"\b(For|And|A|With)$", merged[-1]):
            merged[-1] += " " + t
        else:
            merged.append(t)
    return merged[:9]


d = doc("XG-MP")
items = []
for pn in range(2, d.page_count + 1):
    L = sorted(wocr_lines("XG-MP", pn), key=lambda l: (round(l[2], 3), l[1]))
    m = next((re.search(r"(\d{1,2})$", l[5].strip()) for l in L if 0.3 < l[2] < 0.38 and l[1] > 0.6 and re.search(r"(^|\s)\d{1,2}$", l[5].strip())), None)
    num = int(m.group(1)) if m else CODE_FIX.get(pn)
    if num is None:
        print("no code on page", pn); continue
    code = f"XG-MP {num:02d}"
    title = [l for l in L if l[2] < 0.27 and l[0] > 0.016 and not re.search(r"xg\s*-\s*mp", l[5], re.I)]
    title_t = re.sub(r"\s+", " ", " ".join(l[5] for l in title)).replace("2- RING", "2-RING")
    kind = next((l[5] for l in L if 0.37 < l[2] < 0.42 and l[1] < 0.75 and not l[5].startswith("•")), "").strip()
    name = titlecase(title_t.lower())
    if kind and kind.lower() not in name.lower():
        tail = [w for w in kind.split() if w.lower() not in name.lower().split()]
        name = f"{name} {' '.join(tail)}" if tail else name
    name = re.sub(r"\bPen Pen\b", "Pen", name)
    if not re.search(r"\bpens?\b", name, re.I):
        name += " Pen"
    for a, b in FIX.items():
        name = name.replace(a, b)
    body = [l for l in L if 0.4 < l[2] < 0.88 and l[1] > 0.55]
    feats = group_bullets(body)
    size = next((f for f in feats if re.fullmatch(r"[\d.]+( × [\d.]+)+ cm", f)), None)
    feats = [f for f in feats if f != size and f.lower() != kind.lower()]
    cols = [c for _, c in sorted((l[1], l[5].strip().title()) for l in L if l[2] > 0.88 and re.fullmatch(COLOURS, l[5].strip().upper()))]
    specs = [["Size", size]] if size else []
    if cols:
        specs.append(["Colours", ", ".join(dict.fromkeys(cols))])
    desc = (kind + ". " if kind else "") + " ".join(f.rstrip(".") + "." for f in feats[:3])
    items.append({"key": "xgpens", "page": pn, "name": name, "subtitle": kind, "price": None, "code": code, "features": feats,
                  "specs": specs, "desc": desc, "images": [f"/catalog/xgpens/xgmp-p{pn}.webp"], "brand": "BD Signature", "catalog": CAT})
json.dump(items, open(os.path.join(HERE, "raw", "xgpens.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print("xgpens", len(items))
for i in items:
    print(i["code"], "|", i["name"], "|", i["specs"], "|", " ; ".join(i["features"])[:150])
