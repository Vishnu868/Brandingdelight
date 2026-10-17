"""JPP Premium Card Holder segment — 10 single-page products (no prices in catalogue)."""
import os, json
HERE = os.path.dirname(os.path.abspath(__file__))
CAT = "JPP Premium Card Holder Segment"
R = [
    (1, "JPP-CORK", "Cork & Metal Business Card Holder", "Natural cork with brushed metal",
     "A perfect blend of natural cork and sleek metal for a refined professional impression.",
     ["Natural cork - eco-friendly and sustainable", "Durable brushed metal for a sleek look", "Spacious interior holds standard business cards", "Slim, lightweight design for everyday use", "Perfect gift for professionals and corporate gifting"]),
    (2, "JPP-BAMBOO", "Bamboo & Metal Business Card Holder", "Natural elegance, professional impact",
     "Natural bamboo front paired with polished metal - an eco-friendly, durable card holder with a professional finish.",
     ["Eco-friendly bamboo", "Professional look", "Durable metal body", "Velvet-lined interior"]),
    (3, "Card Holder 011", "Executive Card Case 011", "Sleek · compact · professional",
     "Designed for professionals who value style, organisation and efficiency. Compact in size, big on impression.",
     ["Premium build - durable materials with a refined finish", "Smart storage keeps cards secure and easy to access", "Professional style that complements your image", "Available in red, blue, orange, black, grey and white"]),
    (4, "Card Holder 01", "Card Holder 01", "Sleek design, premium impression",
     "Brushed stainless steel card holder with a coloured leatherette top, available in multiple colours.",
     ["Premium quality", "Compact & lightweight", "Durable build", "Perfect for gifting"]),
    (5, "Card Holder 02", "Card Holder 02", "Smart · sleek · secure",
     "Designed for professionals who value minimalism and functionality. Card Holder 02 keeps your essentials organised with elegance and ease.",
     ["Holds 10-12 cards - business cards, credit cards & IDs", "Durable build", "Compact design", "Light weight", "Available in blue, black, red and orange"]),
    (6, "Card Holder 03", "Card Holder 03", "Sleek design, smart organisation",
     "Metal-framed card holder with fabric-textured front and multiple card slots inside.",
     ["Compact & lightweight", "Multiple card capacity", "Durable metal body", "Available in blue & black"]),
    (7, "Card Holder 04", "Card Holder 04", "Compact design, corporate identity",
     "A perfect blend of elegance and utility - crafted for professionals who value style, organisation and impact. Add your logo and turn it into a powerful statement of your brand.",
     ["Premium finish - textured leather look with polished metal accent", "Compact & lightweight - fits your pocket or bag", "Durable build protects your cards", "Professional appeal", "Available in tan/brown and classic black"]),
    (8, "Card Holder 05", "Metal Card Holder 05", "Sleek design, premium finish",
     "Metal card holder with textured colour front and polished steel base, made to impress.",
     ["Premium metal build", "Slim & portable", "Holds standard business cards", "Stylish colours - blue, silver, red, black and tan", "Great gift choice"]),
    (9, "CH-006 Black", "Card Holder CH-006 Black", "Stainless steel · multi card slots",
     "Sleek, compact, professional. Designed for those who carry ambition.",
     ["Multiple slots to organise your cards efficiently", "Premium build - durable, scratch-resistant stainless steel", "Slim & lightweight - fits in pocket or bag", "Secure snap lock closure", "Perfect gift for professionals and executives"]),
    (10, "CH-007 Black", "Premium Card Holder CH-007 Black", "Premium metal finish",
     "A sleek blend of style and functionality, crafted for professionals who value elegance in every detail.",
     ["Premium metal finish - durable, sleek, sophisticated", "Compact & lightweight for pocket or desk", "Holds multiple cards securely", "Perfect gift choice for corporate or personal use"]),
]
items = [{"key": "jpp", "page": pn, "name": n, "subtitle": s, "price": None, "code": c, "features": f, "desc": de,
          "images": [f"/catalog/cardholders/jpp-p{pn}.webp"], "brand": "JPP", "catalog": CAT} for pn, c, n, s, de, f in R]
json.dump(items, open(os.path.join(HERE, "raw", "jpp.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print("jpp", len(items))
