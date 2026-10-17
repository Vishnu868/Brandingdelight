"""Luxury Corporate Gift Combos (GS10xx) + Premium Organizer Collection (OR10xx): 4 tiles per page, PDF text labels."""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lines import doc, pdf_lines
from crops import save_clip
import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
T = {
    "GS1001": "Nature Craft Set | Bamboo Eco Collection", "GS1002": "Smart Pro 7 | Utility Executive Set", "GS1003": "White Luxe | Minimalist Executive Set",
    "GS1004": "Bamboo Essence | Nature-Inspired Gift Box", "GS1005": "Imperial Black Gold 6-in-1 Executive Kit", "GS1006": "Sustain Pro Bamboo Edition with Powerbank & Pendrive",
    "GS1007": "Matte Vault with Torch Powerbank", "GS1008": "Cork Luxe Premium 6-in-1 Eco Gift Set", "GS1009": "Elite Tan Wallet Edition 6-in-1 Gift Set",
    "GS1010": "Brew Note Kit 6-in-1 Coffee Cork Collection", "GS1011": "Eco Luxe 5 Sustainable Power Gift Set", "GS1012": "Prestige Pro with Umbrella & PU Pendrive",
    "GS1013": "Luxury Wooden 6-in-1 Business Gift Set", "GS1014": "Ring Edge 6 Elite Corporate Essentials", "GS1015": "Eco Wooden | Mug 4-in-1 Gift Set",
    "GS1016": "Luxury 4-in-1 Business Organizer Gift Set", "GS1017": "Signature Business 6-in-1 Combo Set", "GS1018": "Elite 6-in-1 Signature Edition",
    "GS1019": "Prestige 5-in-1 Business Set", "GS1020": "Regal Black 5-in-1 Premium Set",
    "OR1001": "Magnetic Prestige Organizer", "OR1002": "Power Sync Pro | Wireless Organizer", "OR1003": "Aura Link Organizer", "OR1004": "Premium Executive Flap Organizer",
    "OR1005": "Lumen Note Organizer", "OR1006": "Smart Charge | Wireless Organizer", "OR1007": "Bio Lock Pro | Wireless Organizer", "OR1008": "Display Pro Organizer",
    "OR1009": "Store Pad Pro | Wireless Organizer", "OR1010": "Edge Craft Pro | Wireless Organizer", "OR1011": "Store Pad | Organizer", "OR1012": "Luxe Charge Business Organizer",
    "OR1013": "Magna Lux | VIP Organizer", "OR1014": "Elite Fold Organizer", "OR1015": "Metro Loop Organizer", "OR1016": "Veritas Planner Organizer",
    "OR1017": "Ring Edge | Premium Organizer", "OR1018": "Vintage Elite Organizer", "OR1019": "Canvas Core Organizer", "OR1020": "Nexus Ring Organizer",
    "OR1021": "Platina Pro Executive Organizer", "OR1022": "Confidant Pro Organizer", "OR1023": "Notion C Organizer", "OR1024": "Heritage Lock | Classic Organizer",
    "OR1025": "Moon Clip Organizer",
}
SKIP = re.compile(r"view$|available colors|^specifications$|^GS\d|^OR\d", re.I)
CONT = re.compile(r"^(\(|&|capacity|[a-z])", re.I)


def labels(L, spec_mode):
    L = [l for l in L if not SKIP.search(l[5])]
    if spec_mode:  # organiser spec lists: two columns, each line a feature, continuation lines joined
        out = []
        for col in sorted({round(l[1], 1) for l in L}):
            cl = sorted([l for l in L if round(l[1], 1) == col], key=lambda l: l[2])
            for l in cl:
                t = l[5]
                if out and out[-1][1] == col and (re.match(r"^(\(|Capacity|Watch Charger|& )", t) or out[-1][0].endswith(("Smart", "&"))):
                    out[-1][0] += " " + t
                else:
                    out.append([t, col])
        return [o[0] for o in out]
    groups = []
    for l in sorted(L, key=lambda l: (l[2], l[1])):
        g = next((g for g in groups if abs(g[-1][1] - l[1]) < 0.035 and 0 < l[2] - g[-1][2] < 0.017), None)
        (g.append(l) if g else groups.append([l]))
    return [re.sub(r"\s+", " ", " ".join(x[5] for x in g)).replace("Rechargable", "Rechargeable").replace("10,000mah", "10,000mAh") for g in groups]


def run(sub, key, brand, catalog, folder, prefix, pages):
    d = doc(sub)
    items = []
    for pn in pages:
        p = d[pn - 1]
        W, H = p.rect.width, p.rect.height
        L = pdf_lines(sub, pn)
        for c in [l for l in L if re.fullmatch(r"(GS|OR)\d{4}", l[5])]:
            qx, qy = (0.5 if c[1] > 0.45 else 0), (0.5 if c[2] > 0.45 else 0)
            QL = [l for l in L if qx <= l[1] < qx + 0.5 and qy <= l[2] < qy + 0.5]
            spec = any(l[5] == "SPECIFICATIONS" for l in QL)
            if spec:
                sy = next(l[2] for l in QL if l[5] == "SPECIFICATIONS")
                QL = [l for l in QL if l[2] > sy]
            feats = list(dict.fromkeys(labels(QL, spec)))
            code = c[5]
            img = save_clip(p, fitz.Rect(W * qx, H * qy, W * (qx + 0.5), H * (qy + 0.5)), folder, f"{prefix}-{code.lower()}", native=4.2, maxdim=1100)
            title = T[code]
            if key == "luxury":
                desc = f"{title} - a premium corporate gift combo featuring " + ", ".join(f.lower() if not re.match(r"^(A5|PU|32GB)", f) else f for f in feats) + "."
            else:
                desc = f"{title} - premium B5/A5 organiser" + (" with " + ", ".join(f.lower() for f in feats[:5]) + "." if feats else ".")
            items.append({"key": key, "page": pn, "name": title, "subtitle": code, "price": None, "code": code, "features": feats[:10],
                          "desc": desc.replace("  ", " "), "images": [img], "brand": brand, "catalog": catalog})
    items.sort(key=lambda i: i["code"])
    json.dump(items, open(os.path.join(HERE, "raw", key + ".json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    print(key, len(items))
    for i in items:
        print(" ", i["code"], i["name"], "|", i["features"])


run("Luxury", "luxury", "BD Corporate Gifts", "Luxury Corporate Gift Combos", "gift-combos", "gc", range(2, 7))
run("Premium Organizer", "organizers", "BD Corporate Gifts", "Premium Organizer Collection", "organizers", "org", range(2, 9))
