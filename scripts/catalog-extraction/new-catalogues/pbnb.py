"""Star Diary Power Bank Note Books 2027 — two products per page (top/bottom halves)."""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lines import doc
from crops import save_clip
import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
CAT = "Star Diary Power Bank Note Book 2027"
NB = "Note Book with 10000 mAh Power Bank"
R = [  # page, half, code, title, contents, price
    (2, 0, "P1", "Power Bank Notebook Gift Set", [NB, "Wireless charger", "Phone stand", "Refill", "Pen", "Box with paper bag"], 1450),
    (2, 1, "P2", "Power Bank Notebook with Bluetooth Speaker", [NB, "Wireless charger", "Bluetooth speaker", "Pen", "Box"], 1950),
    (3, 0, "P3", "Power Bank Notebook with LED Branding Plate", [NB, "Wireless charger", "Colour LED branding plate", "Gift box with pen"], 1650),
    (3, 1, "P4", "Power Bank Notebook with 16 GB USB", [NB, "Wireless charger", "16 GB USB", "Gift box with pen"], 1950),
    (4, 0, "P5", "Power Bank Notebook with Wireless Charger", [NB, "Wireless charger"], 1450),
    (4, 1, "P6", "Power Bank Notebook with Phone Stand", [NB, "Wireless charger", "Phone stand", "Refill", "Pen", "Box with paper bag"], 1450),
    (5, 0, "P7", "Power Bank Folder with 16 GB USB", ["Folder with 10000 mAh Power Bank", "Wireless charger", "16 GB USB", "Pen", "Phone stand", "Box with carry bag"], 1950),
    (5, 1, "P8", "Power Bank Notebook in White Hanger Box", [NB, "Wireless charger", "Pen", "16 GB USB", "Phone stand", "White hanger box"], 1950),
    (6, 0, "P9", "Power Bank Notebook with Lamp & Branding Plate", [NB, "Lamp", "Wireless charger", "Branding plate", "Pen", "16 GB USB", "Phone stand", "Hanger box"], 2300),
    (6, 1, "P10", "Power Bank Notebook with Lamp", [NB, "Wireless charger", "Pen", "Lamp", "Phone stand", "PU box with paper bag"], 2100),
    (7, 0, "P11", "Power Bank Notebook with Fingerprint Lock", [NB, "Wireless charger LED", "Fingerprint lock", "Pen", "Hanger box"], 2700),
    (7, 1, "P12", "8000 mAh Power Bank Notebook", ["Note Book with 8000 mAh Power Bank", "Without pen"], 1200),
    (8, 0, "P13", "Power Bank Notebook with Lamp Gift Box", [NB, "Wireless charger", "Lamp", "Pen", "Gift box"], 1900),
    (8, 1, "P14", "8000 mAh Power Bank Notebook with Phone Stand", ["Note Book with 8000 mAh Power Bank", "Phone stand", "Without pen"], 1200),
    (9, 0, "P15", "Power Bank Notebook with Lamp & Carry Bag", [NB, "Wireless charger", "Lamp", "Pen", "LED branding plate with PU box & carry bag"], 2050),
    (9, 1, "P16", "Power Bank Notebook with LED Branding Plate & PU Box", [NB, "Pen", "LED branding plate", "PU box with paper bag"], 1950),
    (10, 0, "P17", "Power Bank Zip Folder with Lamp", ["Zip Folder with 10000 mAh Power Bank", "Wireless charger", "Lamp", "Pen", "LED branding plate with box"], 2000),
    (10, 1, "P18", "Power Bank Notebook with LED Display", [NB, "LED display", "Box with pen"], 1800),
    (11, 0, "P19", "Power Bank Notebook with LED Display & Gift Box", [NB, "Wireless charger", "Pen", "LED display with gift box"], 1800),
    (11, 1, "P20", "Power Bank Notebook with Wireless Charging & Speaker", [NB, "Pen", "Wireless charging", "Bluetooth speaker"], 2000),
    (12, 0, "P21", "3-Fold Power Bank Notebook", ["3 Fold Note Book with 8000 mAh Power Bank", "Without pen"], 1150),
    (12, 1, "P23", "Zip Power Bank Notebook 5000 mAh", ["Zip Note Book with 5000 mAh Power Bank", "Without pen"], 850),
    (13, 0, "P25", "Power Bank Notebook Deluxe Gift Set", [NB, "Pen", "Lamp", "Phone stand", "16 GB USB", "LED branding plate", "PU box with paper bag"], 2400),
    (13, 1, "P31", "A6 Power Bank Notebook", ["A6 Note Book with 10000 mAh Power Bank", "Wireless charger", "Box with pen"], 1400),
    (14, 0, "P32", "A6 Power Bank Notebook with 16 GB USB", ["A6 Note Book with 10000 mAh Power Bank", "16 GB USB", "Pen", "Wireless charger", "Box"], 1650),
    (14, 1, "P32A", "A6 Power Bank Notebook (without Pen)", ["A6 Note Book with 10000 mAh Power Bank", "Wireless charger", "Box without pen"], 1100),
]
d = doc("POWER BANK NOTE")
items = []
for pn, half, code, title, inc, price in R:
    p = d[pn - 1]
    W, H = p.rect.width, p.rect.height
    r = fitz.Rect(W * 0.03, H * (0.105 if half == 0 else 0.505), W * 0.97, H * (0.495 if half == 0 else 0.915))
    img = save_clip(p, r, "powerbank-notebooks", f"pbnb-{code.lower()}", native=4, maxdim=1800)
    items.append({"key": "pbnb", "page": pn, "name": f"Star Diary {title} {code}", "subtitle": inc[0], "price": price, "code": f"STAR-{code}",
                  "features": inc, "desc": f"Premium power bank notebook from the Star Diary 2027 collection. Includes: {', '.join(i.lower() if k else i for k, i in enumerate(inc))}.",
                  "images": [img], "brand": "Star Diary", "catalog": CAT})
json.dump(items, open(os.path.join(HERE, "raw", "pbnb.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print("pbnb", len(items))
