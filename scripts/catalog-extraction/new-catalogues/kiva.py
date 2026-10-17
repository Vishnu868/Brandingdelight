"""KIVA Gifts (Chocolian) hampers — transcribed from the catalogue; photo crop + full page."""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lines import doc
from crops import save_clip
import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
CAT = "KIVA Gifts Collection 26"
B4 = ["Pan Bites", "Mocha Bites", "Orange Bites", "Fruit & Nut Bites"]
DARK = ["Dark Fruit & Nut 1 x 72g", "Creamy Cranberry 1 x 72g", "Dark Choco Orange 1 x 72g", "Dark Rose Pistachio 1 x 72g"]
NUTS = ["Almond Kernel 1 x 100g", "Cashew Nut 1 x 100g", "Golden Raisin 1 x 100g", "Pistachio 1 x 80g", "Cranberry Masala 1 x 100g"]
DIM_L, DIM_S, DIM_M, DIM_D, DIM_B = "383 x 253 x 65 mm", "225 x 130 x 32 mm", "315 x 225 x 32 mm", "270 x 245 x 65 mm", "225 x 175 x 32 mm"
H = [
    (3, "6501", "Celebration Hamper 6501", "Chocolate bars & dry fruit kachori", 1199, DARK + ["Dry Fruit Kachori 1 x 300g"], DIM_L),
    (4, "6502", "Celebration Hamper 6502", "Chocolate bars & almond dates", 1199, DARK + ["Almond Dates 1 x 100g"], DIM_L),
    (5, "6503", "Celebration Hamper 6503", "Chocolate bars & almond brittle", 1199, DARK + ["Almond Brittle 1 x 100g"], DIM_L),
    (6, "WD-01", "Celebration Hamper WD-01", "Dubai kunafa bites", 249, ["Dubai Pistachio Kunafa Bites 6 x 20g", "or Dubai Hazelnut Kunafa Bites 6 x 20g", "or Dubai Biscotti Bites 6 x 20g"], DIM_S),
    (7, "WD-02", "Kunafa Sweet Hamper WD-02", "Dubai kunafa bites", 599, ["Dubai Pistachio Kunafa Bites 6 x 20g", "or Dubai Hazelnut Kunafa Bites 6 x 20g", "or Dubai Biscotti Bites 6 x 20g"], DIM_S),
    (8, "2401", "Celebration Hamper 2401", "Chocolate bites & waffles", 599, [b + " 3 x 12g" for b in B4] + ["Choco Strawberry Waffle 1 x 20g", "Choco Double Dark Waffle 1 x 20g"], DIM_M),
    (9, "2403", "Celebration Hamper 2403", "Chocolate bites & Sleek cocoa bars", 649, [b + " 3 x 12g" for b in B4] + ["Sleek Classic Cocoa 1 x 22g", "Sleek Zesty Orange Cocoa 1 x 22g", "Sleek Nut Raisin Dark Cocoa 1 x 22g"], DIM_M),
    (10, "2406", "Celebration Hamper 2406", "Sleek cocoa bars, smoky almonds & diyas", 649, ["Sleek Zesty Orange Cocoa 1 x 22g", "Sleek Cocoa 1 x 22g", "Sleek Rich Coffee Cocoa 1 x 22g", "Sleek Paan Cocoa 1 x 22g", "Smoky Almond 1 x 25g pouch", "Diya 2 pieces"], DIM_M),
    (11, "2409", "Celebration Hamper 2409", "Chocolate bites, dark bar & choco almond dates", 699, [b + " 2 x 12g" for b in B4] + ["Dark Fruit & Nuts 1 x 72g", "Choco Almond Dates 4 x 10g"], DIM_M),
    (12, "2410", "Celebration Hamper 2410", "24 assorted chocolate bites", 749, [b + " 6 x 12g" for b in B4], DIM_M),
    (13, "2412", "Celebration Hamper 2412", "Sleek bars, almond dates & waffles", 499, ["Sleek Zesty Orange Cocoa 1 x 22g", "Sleek Classic Cocoa 1 x 22g", "Choco Almond Dates 4 x 10g", "Choco Double Dark Waffle 1 x 20g", "Choco Strawberry Waffle 1 x 20g"], DIM_M),
    (14, "2413", "Celebration Hamper 2413", "Chocolate bites & four waffles", 649, [b + " 3 x 12g" for b in B4] + ["Choco Coffee Waffle 1 x 20g", "Choco Orange Waffle 1 x 20g", "Choco Creme Milk Waffle 1 x 20g", "Choco Strawberry Waffle 1 x 20g"], DIM_M),
    (15, "1201", "Celebration Hamper 1201", "12 assorted chocolate bites", 399, [b + " 3 x 12g" for b in B4], DIM_B),
    (16, "1203", "Celebration Hamper 1203", "Chocolate bites & choco almond dates", 349, [b + " 2 x 12g" for b in B4[:3]] + ["Choco Almond Dates 4 x 10g"], DIM_B),
    (17, "801", "Celebration Hamper 801", "8 assorted chocolate bites", 249, [b + " 2 x 12g" for b in B4], DIM_S),
    (18, "802", "Celebration Hamper 802", "Chocolate bites & choco almond dates", 249, [b + " 1 x 12g" for b in B4] + ["Choco Almond Dates 3 x 10g"], DIM_S),
    (20, "606", "Dry Fruit Hamper 606", "Six premium dry fruit jars", 1349, NUTS + ["Peri-Peri Trail Mix 1 x 100g"], DIM_D),
    (21, "605", "Dry Fruit Hamper 605", "Five dry fruit jars & a diya", 1199, NUTS + ["Diya 1 piece"], DIM_D),
    (22, "604", "Dry Fruit Hamper 604", "Four dry fruit jars & diyas", 999, NUTS[:4] + ["Diya 2 pieces"], DIM_D),
    (23, "603", "Dry Fruit Hamper 603", "Three dry fruit jars & diyas", 749, NUTS[:3] + ["Diya 2 pieces"], DIM_D),
    (24, "602", "Dry Fruit Hamper 602", "Two dry fruit jars & diyas", 599, NUTS[:2] + ["Diya 2 pieces"], DIM_D),
]
d = doc("KIVA")
items = []
for pn, code, name, sub, price, inc, dim in H:
    p = d[pn - 1]
    W, Hh = p.rect.width, p.rect.height
    photo = save_clip(p, fitz.Rect(0, 0, W, Hh * 0.76), "kiva", f"kiva-photo-p{pn}", native=3, maxdim=1700)
    desc = f"KIVA Gifts {name.split(' ' + code)[0].lower()} by Chocolian — {sub.lower()}, packed in a premium gift box. Pack dimension: {dim}."
    items.append({"key": "kiva", "page": pn, "name": f"KIVA {name}", "subtitle": sub, "price": price, "code": f"KIVA-{code}",
                  "features": ["Pack includes: " + inc[0]] + inc[1:] + [f"Pack dimension: {dim}"], "desc": desc,
                  "images": [photo, f"/catalog/kiva/kiva-p{pn}.webp"], "brand": "KIVA Gifts", "catalog": CAT})
json.dump(items, open(os.path.join(HERE, "raw", "kiva.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print("kiva", len(items))
