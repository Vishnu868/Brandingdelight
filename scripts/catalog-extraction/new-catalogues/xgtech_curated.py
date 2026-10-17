"""Curated names + icon-strip features for the XG-T electronics catalogue (run after xgtech_fix.py)."""
import os, json

HERE = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(HERE, "raw", "xgtech.json")
F = {
 "XG-T01": ("Bamboo Retractable Multi Charging Cable", "Eco style, tangle-free, one cable for all devices", "Lightning connector|Output 2A|Retractable cord|Eco-friendly bamboo|Range up to 75 cm|Type-C port|Durable & robust"),
 "XG-T02": ("3-in-1 Retractable Charging Cable Box", "All-in-one retractable cable with phone stand", "Universal compatibility|Fast charge|Multiport|Surge safe|Data sync|Portable, retractable design|Available in red, blue, black and more"),
 "XG-T03": ("Slim RFID Passport, Cards, SIM & Cash Organizer", "Anti-theft passport holder", "RFID security protection|High-capacity multi-organizer|Premium PU leather material|Elastic closure band|Multiple card slots|Dedicated SIM & pin slots|Ultra-slim travel design"),
 "XG-T04": ("Minimalist Smart Weather Display Clock", "Time, weather, temperature & humidity", "Alarm|Runs on AA batteries|Temperature (°C/°F)|Backlit LED screen|Time & date|12/24 hour format|Comes in two variants"),
 "XG-T10": ("3-in-1 Rechargeable LED Lamp", "Multi-angle adjustable lamp & torch", "11 SMD LEDs|Recharges in 4 hours|Long battery life, 1500 mAh (6–8 hrs)|Strong build (IP20, IP68, IPX4)|Easy adjust|USB & micro USB|360° lighting"),
 "XG-T11": ("Fusion Multi-function Wireless Sound Box", "Clock speaker with telescopic phone holder", "Alarm clock|Temperature (°C/°F)|Bluetooth 5.3|5 W wireless stereo|TWS pair|1200 mAh battery, 4–8 hours playtime|Type-C port|Pearl white and elegant black"),
 "XG-T16": ("Bamboo Mini Bluetooth Speaker", "Sustainable bamboo & rPET fabric speaker", "5 W wireless stereo|Bluetooth 5.2|300 mAh battery, 3–6 hours playtime|80 dB sound|Eco-friendly|Range up to 10 m|Type-C port"),
 "XG-T19": ("Bamboo LED Digital Clock Pen Holder", "Multi-function digital clock", "Alarm clock|Time & date|Eco-friendly bamboo|Temperature (°C/°F)|Runs on AAA cells|Pen holder|Clear LED display"),
 "XG-T20": ("All-in-One Digital Accessories Organizer", "Multi-functional tech storage bag", "Multi-layer storage|Elastic mesh pockets|Velcro dividers (DIY layout)|Water-resistant polyester + PU|Heavy-duty zipper|Universal compatibility|Portable design"),
 "XG-T21": ("Portable Gadget & Cable Storage Pouch", "Smart design, maximum convenience", "Multi-layer storage|Elastic mesh pockets|Elastic buckle|Water-resistant polyester + PU|Heavy-duty zipper|Universal compatibility|Portable design with wrist strap"),
 "XG-T22": ("Compact Slim Digital Gadget Organizer", "Keep it together, wherever you go", "Multi-layer storage|Elastic mesh pockets|Elastic buckle|Water-resistant polyester + PU|Heavy-duty zipper|Universal compatibility|Portable design"),
 "XG-T24": ("Bamboo Wireless Charging LED Ring Dock", "Wireless charger with ambient ring light", "Eco-friendly bamboo|15 W output|Wireless charging|Touch control light with 3 brightness levels|Qi compatibility|Supports all wireless devices|Type-C support"),
 "XG-T26": ("All-in-One Smart Travel Adapter", "Covers more than 200 countries", "Universal compatibility (US, EU, AUS, UK plugs)|Fast charge|Multiport USB & Type-C|Surge safe|Fuse guard|Compact|Indicator light"),
 "XG-T27": ("4-in-1 Portable Data Charging Cable", "Push-down cable organizer", "Push-down organizer|Light & compact|PD 60 W fast charging|Surge safe|TF card slot|Multiport|Type-C port"),
 "XG-T31": ("RetroTone Mini Radio Gramophone Speaker", "Vintage-style Bluetooth speaker", "5 W wireless stereo|Bluetooth 5.0|1200 mAh battery, 4–6 hours playtime|FM radio|TF card|USB & AUX|Type-C port"),
 "XG-T32": ("Retro Box Classic Craft Wooden Speaker", "Small size, surprisingly loud volume", "5 W wireless stereo|Bluetooth 5.1|1200 mAh battery, 3–6 hours playtime|FM radio|TF card|USB & AUX|Type-C port"),
 "XG-T33": ("Retro Cast Dual Golden Era Speaker", "HiFi stereo sound, comes in two variants", "5 W wireless stereo|Bluetooth 5.3|1200 mAh battery, 8–10 hours playtime|FM radio|TF card|USB & AUX|Type-C port"),
 "XG-T34": ("Retro Box Twin Speaker with Gramophone Horn", "Classic craft wooden stereo speaker", "5 W wireless stereo|Bluetooth 4.1|1800 mAh battery, 8–10 hours playtime|FM radio with antenna|TF card|USB & AUX|Type-C port"),
 "XG-T35": ("Retro Tunes Single Tall Trumpet Speaker", "Gramophone-style Bluetooth speaker", "5 W wireless stereo|Bluetooth 5.4|1800 mAh battery, 8–10 hours playtime|FM radio|TF card|USB & AUX|Type-C port"),
 "XG-T38": ("3-in-1 Round Retractable Charging Cable", "Coiled precision structure, extends 35–120 cm", "Universal compatibility|Fast charge|Multiport|Surge safe|Data sync|Portable|Retractable"),
 "XG-T39": ("ErgoMetal Premium Mobile Stand with Card Holder", "Anti-skid, anti-scratch silicone surface", "Universal compatibility|Durable & robust|Balanced|Surge safe|Anti-corrosion|Portable|Holds all types of phones"),
 "XG-T40": ("Retro Digital Flip Down Clock (Black)", "Mechanical page-turning clock", "Precise time|Smooth flip|Long battery life (1 D carbon battery)|Strong build|Easy adjust|Big numbers|Stable stand"),
 "XG-T41": ("Retro Digital Flip Down Clock (White)", "Mechanical page-turning clock", "Precise time|Smooth flip|Long battery life (1 D carbon battery)|Strong build|Easy adjust|Big numbers|Stable stand"),
 "XG-T43": ("ProFlex ErgoLift Adjustable Metal Mobile Holder", "Metal mobile stand with top adjustable neck", "Universal compatibility|Durable & robust|Adjustable up to 180°|Surge safe|Anti-corrosion|Portable|Holds all types of phones"),
 "XG-T44": ("ProGrip Premium Metal Desktop Mobile Stand", "Sturdy metal stand with anti-slip pads", "Universal compatibility|Durable & robust|Balanced|Surge safe|Anti-corrosion|Portable|Holds all types of phones"),
 "XG-T45": ("Wooden LED Digital Alarm Clock with Wireless Charging", "Elegant wooden design with white LED display", "Shows time, date & temperature (°C/°F switch)|Smart alarm clock with sound control & brightness adjustment|Built-in Qi wireless charging pad|Works via USB or battery|Dual USB ports for additional device charging"),
 "XG-T46": ("Bamboo & Metal Foldable Multi-Tool Kit", "Interchangeable screwdriver bits", "Eco-friendly natural bamboo body|Compact, foldable and highly portable|Versatile interchangeable metal screwdriver bits|Quick and easy bit exchange|Ideal surface for custom laser engraving"),
 "XG-T47": ("Eco-Friendly Wireless Bamboo Mouse", "Natural bamboo & durable black ABS", "Sleek 2.4 GHz wireless design with USB receiver|Operates on AA battery (not included)|Eco-conscious material with smooth surface|Compact and ergonomic for daily work or travel|Ideal for corporate gifting"),
 "XG-T48": ("Bamboo Keypad Stress Reliever & Phone Stand", "Stress relief desk gadget", "Stress reliever – textured like a real keypad|Phone stand for hands-free viewing|Eco-friendly sustainable bamboo|Tech-inspired keyboard look|Compact, lightweight and customisable with your logo"),
 "XG-T53": ("Porta Multi-Functional Travel Passport Organizer", "Minimal. Organized. Always ready.", "Multi-layer storage|Elastic mesh pockets|Elastic buckle|Water-resistant polyester + PU|Heavy-duty zipper|Universal compatibility|Available in black, pink, green and grey"),
 "XG-T54": ("Cable Organizer Bag", "Smart storage for everyday essentials", "Multi-layer storage|Elastic mesh pockets|Elastic buckle|Water-resistant polyester + PU|Heavy-duty zipper|Universal compatibility|Available in black, pink, green and grey"),
 "XG-T55": ("Digital Bag Ultimate Organizer Pouch", "Built for the way you carry tech", "Multi-layer storage|Elastic mesh pockets|Elastic buckle|Water-resistant polyester + PU|Heavy-duty zipper|Universal compatibility|Wrist strap; available in 6 colours"),
 "XG-T56": ("Digital Bag Ultimate Organizer Case (Beige)", "Everything you need, in one place", "Multi-layer storage|Elastic mesh pockets|Velcro dividers|Water-resistant polyester + PU|Heavy-duty zipper|Universal compatibility|Carry handle; available in 6 colours"),
 "XG-T57": ("Digital Bag Ultimate Organizer Case (Navy)", "Everything you need, in one place", "Multi-layer storage|Elastic mesh pockets|Velcro dividers|Water-resistant polyester + PU|Heavy-duty zipper|Universal compatibility|Carry handle; available in 6 colours"),
 "XG-T58": ("Data Cable Storage Organizer Bag", "The smart travel case for every gadget", "Double-sided storage|Elastic mesh pockets|Elastic straps|Water-resistant polyester + PU|Heavy-duty zipper|Universal compatibility|Available in grey, pink and black"),
 "XG-T59": ("Smart Speaker & Alarm Clock", "Not just a speaker – also a smart clock", "Bluetooth 5.4|Heavy bass|LED lights|HD call|TF card play|FM radio|40-hour long battery life|TWS interconnection"),
 "XG-T64": ("Bamboo Pen Clock (Cube)", "Multi-function digital clock with pen holder", "Alarm|AAA batteries or USB power|Temperature (°C/°F)|LED lights|Time & date|Clap & tap sound control|Eco-friendly bamboo"),
 "XG-T65": ("Bamboo Pen Clock & Vase", "Minimalist wooden clock vase", "Alarm|AAA batteries or USB power|Temperature (°C/°F)|LED lights with adjustable brightness|Time & date|Clap & tap voice control|Eco-friendly bamboo"),
 "XG-T66": ("All-in-One Charging Dock with Night Light", "Alarm clock, night light & wireless charger", "Alarm clock|10 W output|Wireless charging|Touch control light|Snooze mode|Supports all wireless devices|Type-C support"),
 "XG-T67": ("All-in-One Charging Dock with Soothing LED Light", "Clock, night light & wireless charger", "Alarm clock|10 W output|Wireless charging|Temperature (°C/°F)|Snooze mode|Time & date|Type-C support"),
 "XG-T68": ("Bamboo Pen Clock (Diamond)", "Multi-function digital clock with pen holder", "Alarm|AAA batteries or USB power|Temperature (°C/°F)|LED lights|Time & date|Clap, touch & tap control (>60 dB)|Eco-friendly bamboo"),
 "XG-T72": ("AeroSlide UltraColor Custom Sublimation Desk Mat", "Custom-printed desk mat (e.g. 2026 calendar)", "Delicate stitched edges|3 mm thick cushioning|Water-resistant coating|Non-toxic & RoHS certified|Woven rubber texture base|Durable & flexible material|Smooth glide surface; 23 × 11 in"),
 "XG-T73": ("EcoLink 3-in-1 Travel Cable Kit", "Bamboo case with built-in cables", "Magnetic secure closure|Light & compact|PD 60 W fast charging|Surge safe|Eco-friendly|Multiport|Type-C port"),
 "XG-T74": ("4-in-1 Round Clip Charging Cable with Light-Up Logo", "Double-sided light-up logo", "Durable braided cable|Light & compact|Fast charging|Surge safe|LED logo|Multiport|Type-C port"),
 "XG-T75": ("EcoCharge 6-in-1 Bamboo Wireless Charging Cable Set", "Bamboo case with wireless charger & cables", "15 W wireless output|Light & compact|PD 60 W fast charging|Surge safe|Eco-friendly|Multiport|Type-C port"),
 "XG-T76": ("Steel Multi Universal Mobile Stand with Card Holder (Grey)", "Holds smartphones & tablets up to 7 inches", "Universal compatibility|Durable & robust|Balanced|Surge safe|Anti-corrosion|Card holder|Holds all types of phones"),
 "XG-T77": ("Steel Multi Universal Mobile Stand with Card Holder (Silver)", "Holds smartphones & tablets up to 7 inches", "Universal compatibility|Durable & robust|Balanced|Surge safe|Anti-corrosion|Card holder|Holds all types of phones"),
 "XG-T78": ("4-in-1 Fast Charging Power Bank with Phone Stand", "Built-in cables, LED display & torch", "Mobile holder|Inbuilt torch light|2A fast charging|LED digital power display|10000 mAh battery|Multiport|Type-C port"),
 "XG-T79": ("Premium Aluminium Alloy Portable Laptop Stand", "Ergonomic foldable laptop stand", "Wide compatibility|Aluminium alloy body|Heat dissipation design|6-level height adjustment|Non-slip silicone pads|Foldable & portable|Lightweight"),
}
d = json.load(open(P, encoding="utf-8"))
for r in d:
    if r["code"] in F:
        n, s, f = F[r["code"]]
        r["name"], r["subtitle"], r["features"] = n, s, f.split("|")
        r["desc"] = s + ". " + ". ".join(r["features"][:3]) + "."
json.dump(d, open(P, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print("curated", sum(1 for r in d if r["code"] in F), "of", len(d))
