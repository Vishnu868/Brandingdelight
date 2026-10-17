"""Popli Brass catalogue: 3x3 grid per page, code under each photo. Codes from PDF text / OCR (+manual fixes)."""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lines import doc
from crops import save_clip
import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
CAT = "Popli Brass Handicrafts 2026"
o = json.load(open(os.path.join(HERE, "popli_codes2.json")))
for pn, k, c in [("30", "01", "O-1"), ("30", "02", "O-2"), ("33", "21", "UM-1"), ("33", "22", "UM-20"), ("44", "22", "96")]:
    o[pn]["cells"][k] = c

SPECIFIC = {
    "AT-8A": "Brass Auto Rickshaw Model", "B-97": "Decorative Brass Hand Bell", "B-99": "Om Brass Bell", "B-102": "Hanging Bell Chime",
    "B-105": "Brass Temple Bell", "BG-10": "Silver Plated Glass Set in Gift Box", "BX-1": "Hand-Painted Floral Gift Box", "BX-2": "Hand-Painted Wooden Box",
    "BX-3": "Hand-Painted Blue Box", "CB-1": "Copper Bowl Set with Lids", "CB-2": "Copper Bowl Set with Lids", "CF-1": "South Indian Coffee Filter",
    "CF-2": "Brass Coffee Dabara Set", "CF-3": "Enamel Coffee Dabara Set", "CF-4": "Enamel Coffee Dabara Set", "CP-65": "Gold Finish Bowl Set with Tray",
    "CP-110": "Copper Bottle with Glasses", "CP-111": "Copper Water Bottle", "CP-112": "Copper Water Bottle", "CPE-4": "Brass Compass",
    "CPE-5": "Brass Compass", "CPE-6": "Brass Pocket Compass", "GBK-61": "Brass Leaf Bookmark", "HR-1": "Hand-Painted Brass Horse",
    "KS-1": "Brass Thali Dinner Set", "KS-2": "Brass Thali Dinner Set", "KS-3": "Copper Thali Dinner Set", "MDF-1": "Mosaic Coaster Set",
    "MDF-2": "Floral Coaster Set", "MGM-1": "Mosaic Art Panel", "MGM-4": "Mosaic Elephant Art Panel", "MGM-7": "Elephant Art Panel",
    "OW-1": "Brass Owl Figure", "RS-1": "Brass Rose", "S-4": "Brass Spoon", "SP-1": "Brass Serving Bowl Set", "UR-1": "Brass Urn", "UR-2": "Brass Urn with Cross",
    "WG-12": "Brass Elephant Urli Bowl",
    "SF-2": "Nandi Idol", "SF-3": "Lord Shiva Idol", "SF-6": "Elephant Figure", "SF-7": "Lord Ganesha Idol", "SF-8": "Goddess Lakshmi Idol",
    "SF-11": "Lord Krishna Idol", "SF-12": "Durga Mata on Lion Idol", "SF-13": "Kamdhenu Cow & Calf Idol", "SF-15": "Shiva Parivar Idol",
    "SF-16": "Radha Krishna on Swing Idol", "SF-17": "Lord Ganesha Idol", "SF-18": "Goddess Lakshmi on Lotus Idol",
    "AF-2": "Brass Aftaba Jug", "AF-5": "Brass Aftaba Jug", "AP-6": "Engraved Brass Apple Box", "AP-7": "Engraved Brass Apple Box",
    "AS-1": "Brass Shoe Ash Tray", "AS-2": "Brass Ash Tray", "AS-4": "Brass Ash Tray", "ASH-3": "Gem-Studded Shoe Ash Tray", "AT-2": "Painted Auto Rickshaw Model",
    "BO-1": "Brass Trinket Box", "BO-2": "Brass Trinket Box", "BO-50": "Gem-Studded Trinket Boxes", "BS-2": "Framed Brass Art", "BS-3": "Framed Brass Art",
    "BT-1P": "Brass Bottle", "CHE-4": "Aladdin Lamp", "CHE-9": "Aladdin Lamp", "CHE-14": "Enamel Aladdin Lamp", "CHE-24-26": "Aladdin Lamp",
    "CPE-3": "Brass Crest Emblem", "DH-1": "Shield with Crossed Swords", "FR-1": "Fireplace Tool Set", "G-324": "Ashoka Pillar", "G-325": "Ashoka Lion Emblem",
    "G-342-345": "Ashoka Emblem on Stand", "GB-36": "Brass Jug", "GB-38": "Brass Kettle", "GB-41": "Enamel Brass Jug", "H-2": "Brass Incense Burner",
    "H-3": "Enamel Incense Burner", "HK-2": "Brass Hookah", "HM-1": "Brass Mortar & Pestle", "KY-2": "Om Keychain", "KY-8": "Horseshoe Keychain",
    "KY-33": "Brass Coin Keychain", "LB-1": "Scale of Justice", "LD-55": "Copper Coaster Set", "MG-1X": "Brass Magnifying Glass", "N-2": "Good Luck Horseshoe",
    "N-3": "Horse Head Horseshoe", "N-4": "Horse Head Horseshoe with Stand", "N-5": "Good Luck Horseshoe", "OB-2": "Brass Aroma Oil Burner",
    "OP-1": "Brass Bottle Opener", "P-69": "Brass Puja Thali Set", "PG-1": "Brass Goblet", "PR-2": "Antique Brass Press Iron", "PR-3": "Hand-Painted Press Iron",
    "PT-12": "Brass Leaf Tray", "SD-1": "Brass Sand Timer", "SH-5": "Brass Shoe Horn", "SHE-2": "Brass Shoe Horn", "SHE-4": "Brass Shoe Horn", "SHE-10": "Brass Shoe Horn",
    "SHIP-1": "Brass Ship Model", "TK-25-26": "Brass Tea Kettle", "TL-3": "Brass Telescope", "TR-2": "Brass Tree of Life", "TS-1": "Brass Tea Strainer",
    "WP-1": "Taj Mahal Wall Plate", "WP-2": "Decorative Wall Plate", "WP-3": "Decorative Wall Plate", "WP-7": "Decorative Wall Plate",
    "O-1": "Brass Om Wall Hanging", "O-2": "Brass Om on Stand", "P-10": "Brass Puja Diya", "PAGE-1": "Brass Incense Holder", "PAGE-100": "Brass Cone Incense Holders",
    "UM-1": "Brass Urli Bowl", "UM-20": "Elephant Brass Urli", "96": "Ganesha Brass Padlock", "G-94": "Shiva Parivar Idol", "MR-1OR-1": "Marble Inlay Napkin Holder",
    "CP-61-62-63": "Copper Cutlery Set", "LD-1": "Brass Dhoop Dani with Handle", "LD-10B": "Brass Incense Burner", "P-1": "Brass Kuber Diya",
    "P-3-2P": "Brass Diya Pair", "P-6": "Brass Dhoop Dani", "P-7": "Brass Puja Bell", "P-8": "Brass Incense Stand & Holder", "B-1": "Hanging Brass Bells",
    "B-8": "Tibetan Brass Bell", "G-3": "Lord Ganesha Idol", "G-19": "Lord Ganesha Idol", "G-20": "Elephant Ganesha Figure", "G-127": "Musician Figurines Set",
    "G-128": "Ashoka Pillar", "G-130": "Sun Face Wall Hanging", "G-144": "Lord Ganesha Idol", "G-151": "Nandi Idol", "G-152": "Kamdhenu Cow & Calf Idol",
    "D-1": "Silver Swan Bowl", "D-2": "Silver Swan Bowl", "D-3": "Swan Pair", "D-6": "Swan Pair", "D-8": "Duck Pair", "E-1": "Hand-Painted Elephant",
    "E-2": "Elephant Family Set", "WM-48": "Shiva Parivar Idol", "WM-52": "Kamdhenu Cow & Calf Idol", "WM-60-7": "Gem-Studded Incense Stick Holder",
    "E-3": "Carved Wooden Elephant", "E-5": "Jali-Carved Wooden Elephant", "GP-20": "Antique Gramophone", "RC-1": "Railway Wall Clock",
    "TF-2": "Antique Telephone", "TF-3": "Candlestick Telephone", "TF-4": "Vintage Rotary Telephone", "WC-4": "Brass Table Clock",
    "SV-4": "Taj Mahal Souvenir", "SV-TAJ": "Marble Taj Mahal in Gift Box",
}
PREFIX = {
    "FV": "Brass Flower Vase", "FB": "Brass Fruit Bowl", "CS": "Brass Candle Stand", "CSE": "Brass Candle Snuffer", "LD": "Brass Diya", "LT": "Brass Lamp",
    "TH": "Brass Puja Thali", "SB": "Tibetan Singing Bowl", "MJ": "Brass Manjira", "PL": "Singing Bowl", "DR": "Hapi Tongue Drum", "CH": "Chess Set",
    "GP": "Antique Gramophone", "TF": "Antique Telephone", "RC": "Wall Clock", "WC": "Table Clock", "KY": "Souvenir Keychain", "M": "Souvenir Fridge Magnet",
    "SV": "Taj Mahal Souvenir", "GBK": "Brass Bookmark", "EH": "Brass Elephant Figure", "E": "Brass Elephant Figure", "LK": "Lac Handicraft", "SF": "God Idol",
}
SECTION = {
    "NEW COLLECTION": "Brass Decor Piece", "GOD SF": "God Idol", "BRASS ARTEFACTS": "Brass Artefact", "BRASS FLOWER VASE": "Brass Flower Vase",
    "BRASS FRUIT BOWL": "Brass Fruit Bowl", "BRASS CANDLE STAND": "Brass Candle Stand", "BRASS WINE SET-TEA SETS": "Brass Wine & Tea Set",
    "SILVER PLATED GIFT ITEMS": "Silver Plated Gift Item", "BRASS TURKISH COFFEE POTS": "Brass Turkish Coffee Pot", "BRASS PUJA ARTICLES": "Brass Puja Article",
    "BRASS BELLS": "Brass Bell", "SINGING BOWLS & NEPALI BELLS": "Nepali Bell", "SINGING BOWL": "Singing Bowl", "HAPI DRUMS": "Hapi Tongue Drum",
    "HINDU GOD IDOLS": "Brass Idol & Figurine", "BRASS ANIMAL FIGURES": "Brass Animal Figure", "ALUMINIUM HANDICRAFT": "Aluminium Handicraft",
    "COPPER ARTICLES": "Copper Article", "CHESS SETS": "Chess Set", "WOODEN-STONE HANDICRAFT": "Wooden & Stone Handicraft",
    "TELEPHONE-GRAMOPHONE-CLOCKS": "Vintage Decor Piece", "LAK HANDICRAFT": "Lac Handicraft", "SOUVENIRS OF INDIA": "Souvenir of India",
}
SECTION_FIRST = {"BRASS FLOWER VASE", "BRASS FRUIT BOWL", "BRASS CANDLE STAND", "SILVER PLATED GIFT ITEMS", "BRASS TURKISH COFFEE POTS", "BRASS BELLS",
                 "HINDU GOD IDOLS", "ALUMINIUM HANDICRAFT", "COPPER ARTICLES", "CHESS SETS", "LAK HANDICRAFT", "BRASS WINE SET-TEA SETS"}

BADGES = [fitz.Rect(*b) for b in [(10, 13, 82, 81), (169, 253, 240, 322), (169, 470, 240, 539), (354, 253, 425, 322), (354, 470, 425, 539)]]
from PIL import Image, ImageDraw
from crops import PUB


def clip_nobadge(page, r, name, z=3.2):
    pix = page.get_pixmap(matrix=fitz.Matrix(z, z), clip=r)
    im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    dr = ImageDraw.Draw(im)
    for b in BADGES:
        b = fitz.Rect(b.x0 - 7, b.y0 - 7, b.x1 + 7, b.y1 + 7)
        if b.intersects(r):
            dr.rectangle([(b.x0 - r.x0) * z, (b.y0 - r.y0) * z, (b.x1 - r.x0) * z, (b.y1 - r.y0) * z], fill="white")
    im.save(os.path.join(PUB, "catalog", "popli", name + ".webp"), "WEBP", quality=88, method=4)
    t = im.copy(); t.thumbnail((640, 640), Image.LANCZOS)
    t.save(os.path.join(PUB, "thumbs", "popli", name + ".webp"), "WEBP", quality=80, method=4)
    return f"/catalog/popli/{name}.webp"


d = doc("Popli")
items, seen = [], {}
for pn in sorted(o, key=int):
    sec = o[pn]["section"]
    p = d[int(pn) - 1]
    W, H = p.rect.width, p.rect.height
    for k, code in sorted(o[pn]["cells"].items()):
        if not code:
            continue
        r, c = int(k[0]), int(k[1])
        y = [0.325, 0.624, 0.923][r]
        pre = code.split("-")[0]
        if sec == "NEW COLLECTION" and pre == "FR":
            noun = "Brass Art Frame"
        elif code in SPECIFIC:
            noun = SPECIFIC[code]
        elif sec in SECTION_FIRST:
            noun = SECTION[sec]
        else:
            noun = PREFIX.get(pre) or SECTION.get(sec, "Brass Handicraft")
        uid = code if code not in seen else f"{code}-{pn}"
        seen[code] = 1
        img = clip_nobadge(p, fitz.Rect(W * (c / 3 + 0.008), H * (y - 0.268), W * ((c + 1) / 3 - 0.008), H * (y - 0.014)),
                           f"popli-{re.sub(r'[^a-z0-9]+', '-', uid.lower())}")
        sec_t = sec.title().replace("-", " & ").replace("Lak", "Lac").replace("Sf", "Idols")
        items.append({"key": "popli", "page": int(pn), "name": f"Popli {noun} {code}", "subtitle": sec_t, "price": None, "code": f"POPLI-{uid}",
                      "features": [f"Item code: {code}", f"Collection: {sec_t}", "Handcrafted in Moradabad, India", "Ideal for corporate & festive gifting"],
                      "desc": f"{noun} ({code}) from Popli's {sec_t.lower()} range - handcrafted decor and gifting piece made in Moradabad, India's brass city.",
                      "images": [img], "brand": "Popli Brass", "catalog": CAT, "section": sec})
json.dump(items, open(os.path.join(HERE, "raw", "popli.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print("popli", len(items))
from collections import Counter
print(Counter(i["name"].rsplit(" ", 1)[0] for i in items).most_common(40))
