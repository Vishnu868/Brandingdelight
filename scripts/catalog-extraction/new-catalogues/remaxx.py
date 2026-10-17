"""Remaxx: one product per page. Names transcribed; description paragraph from Windows OCR; top-of-page hero crop + full page."""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lines import doc, wocr_lines
from crops import save_clip
import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
CAT = "Remaxx Product Catalog"
# page|code|name|subtitle
ROWS = """2|RE1052|Remaxx Nexa Self Balancing Capsule Lamp|Rechargeable RGB lamp · fidget toy · paperweight
3|RE1058|Remaxx Glo 2-in-1 Lamp with Flashlight|Rechargeable LED desk lamp & torch
4|RE1059|Remaxx Trivolt 3-in-1 Magnetic Wireless Charger|15W fast wireless charging · phone, earbuds & watch
5|RE1060|Remaxx Trixon Magnetic Mobile & Tablet Stand|MagSafe · aluminium · 8 adjustable angles
6|RE1056|Remaxx Magtrix 20 3-in-1 Power Bank|20,000 mAh MagSafe · built-in stand
7|RE1061|Remaxx Beatcube Bluetooth Alarm Clock|Speaker, FM radio & wireless charging
8||Remaxx Hydrablink Smart Hydration Reminder Coaster|20-minute reminders with sound & light
9|RE1055|Remaxx Thermo-X 2.0 Portable Travel Kettle with Display|500 ml · 4 temperature settings · 316 steel
10|RE1054|Remaxx Thermo-X Portable Travel Kettle|300 ml · 304 stainless steel · auto shut-off
11|RE1035|Remaxx Retrowave 3-in-1 Wireless Charger & Speaker|Lamp, speaker with mic & wireless charger
12|RE1002|Remaxx Magnetic Table Lamp|Magnetic switch · 2700K warm white · USB powered
13|RE1036|Remaxx Bingo Bluetooth Speaker with RGB Lights|Keyboard-style buttons · dual 10W speakers · FM
14|RE1039|Remaxx Edge Digital Clock with Bluetooth Speaker|RGB clock speaker
15|RE1037|Remaxx Powerclip Wireless Charger with Mobile Stand|With ambient light
16|RE1038|Remaxx Boss Stable Non-Slip Phone Holder|Desk phone stand
17|RE1031|Remaxx I-Square Digital Clock with Wireless Charger|With pen stand
18|RE1041|Remaxx Airwave Wireless Charger with Fan|Desk fan + fast wireless charging
19|RE1048|Remaxx Echo Induction Speaker|With wireless charger & mobile stand
20|RE1046|Remaxx Ignis Pen Stand with Warmer Plate|Keeps your coffee warm · logo branding
21|RE1049|Remaxx Activ Motivational Glass Bottle|Time-marked water bottle
22|RE1051|Remaxx Infuso Window Tumbler with Infuser|Double wall tumbler
23|RE1050|Remaxx Stylo Tumbler with Handle|Insulated tumbler with straw
24|RE1032-W|Remaxx Self Stirring Mug|Mug with automatic stirring function
25|RE1047|Remaxx Bliss Smart Scalp Massager|Rechargeable · waterproof
26|RE1003|Remaxx Mini Desk Vacuum Cleaner|Cordless table-top vacuum
27|RE1027|Remaxx Desk Organizer with Table Lamp|Lamp, phone stand & organiser in one
28|RE1009|Remaxx 4-in-1 Extendable Lamp|Lamp with torch and power bank
29|RE1010|Remaxx 2-in-1 Power Bank with Mobile Stand|10,000 mAh with built-in cables
30|RE1005|Remaxx 3-in-1 Retractable Charging Cord|Universal fast-charging cable
31|RE1045|Remaxx Multifunctional Retractable Cable|Charge, transfer & hold
32|RE1011|Remaxx Cooling Towel|Instant cooling on the go
33|RE1033|Remaxx Travel Neck Pillow with Massager|Shiatsu neck massager pillow
34|RE1006|Remaxx Rechargeable Massager Cushion|Pressure-activated vibrating cushion
35|RE1034|Remaxx Inflatable Dino Neck Pillow|Travel neck pillow for kids
36|RE1030|Remaxx Travel Neck Pillow Kit|Neck pillow + eye mask + ear plugs
37|RE1008|Remaxx Flame Humidifier & Diffuser|Flame-effect aroma diffuser
38|RE1025|Remaxx Tripod Fan|2-in-1 portable fan with LED light & remote
39|RE1043|Remaxx Telescope Torch Magnetic Light|Magnetic head · flexible design
40|RE1013|Remaxx Flower Vase with Digital Clock|Clock, pen stand & vase
41|RE1012|Remaxx Wooden Pen Stand with Digital Clock|Time, temperature & alarm
42|RE1019|Remaxx Desktop Organizer|All-in-one desk organiser
43|RE1020|Remaxx Mini Desktop Organiser|Compact desk organiser
44|RE1018|Remaxx Pyramid Pen Stand|Multipurpose organiser with mobile holder
45||Remaxx Table Calendar Clock|Perpetual calendar with clock · logo branding"""

d = doc("Remaxx")
items = []
for row in ROWS.splitlines():
    pn, code, name, sub = row.split("|")
    pn = int(pn)
    L = sorted(wocr_lines("Remaxx", pn), key=lambda l: (round(l[2], 3), l[1]))
    para = [l[5] for l in L if l[2] > 0.72 and len(l[5]) > 38 and re.search(r"[a-z]{3}", l[5])]
    desc = re.sub(r"\s+", " ", " ".join(para)).replace("3-in-l", "3-in-1").replace("IOW", "10W").replace("RCB", "RGB").strip()
    desc = re.sub(r"(\w)- (\w)", r"\1\2", desc)
    if desc and not desc.endswith("."):
        desc += "."
    p = d[pn - 1]
    W, H = p.rect.width, p.rect.height
    hero = save_clip(p, fitz.Rect(0, 0, W, H * 0.64), "remaxx", f"rmx-hero-p{pn}", native=3, maxdim=1700)
    items.append({"key": "remaxx", "page": pn, "name": name, "subtitle": sub, "price": None, "code": code or None,
                  "features": [s.strip() for s in sub.split("·")], "desc": desc, "images": [hero, f"/catalog/remaxx/rmx-p{pn}.webp"],
                  "brand": "Remaxx", "catalog": CAT})
json.dump(items, open(os.path.join(HERE, "raw", "remaxx.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
for i in items:
    print(i["page"], i["code"], i["name"], "|", i["desc"][:90])
