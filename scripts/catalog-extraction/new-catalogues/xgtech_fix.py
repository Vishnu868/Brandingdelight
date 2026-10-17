"""Hand-corrected names/features for XG-T pages whose stylised titles OCR'd badly; general feature clean-up."""
import os, re, json

HERE = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(HERE, "raw", "xgtech.json")
FIX = {
    "XG-T25": ("Now Go Follow Light Lantern Speaker", "Bluetooth 5.3 speaker with built-in power bank",
               ["True wireless stereo, TWS pair", "5200 mAh battery, up to 12 hours playtime", "Built-in power bank", "2-in-1 amplifier, 2 × 40 mm 10 W output", "Waterproof IPX6", "Available in black, green and white"]),
    "XG-T36": ("Classic Vintage Car Bluetooth Speaker", "Wooden vintage car speaker with mobile bracket",
               ["5 W wireless stereo", "1200 mAh battery, 3–4 hours playtime", "Bluetooth 5.0, 10 m range", "FM radio", "Micro SD / TF card, USB & AUX", "Built-in mobile bracket for hands-free viewing"]),
    "XG-T42": ("Dual Rotational ProFlex Dual Fold Metal Mobile Stand", "Foldable universal metal phone stand",
               ["Dual foldable design with smooth hinge rotation", "Universal compatibility, holds all types of phones", "Supports charging while docked", "Durable, robust and anti-corrosion", "Adjustable and portable"]),
    "XG-T49": ("Rechargeable LED Menu Holder Display Stand (A5)", "A5 double-sided LED display stand",
               ["Built-in 10,000 mAh battery for cordless use, 8-hour power duration", "USB and Type-C charging sockets", "Bright illumination for menus and advertisements", "Interchangeable displays, 1-minute poster replacement", "Sleek white minimalist frame with durable base"]),
    "XG-T50": ("Rechargeable LED Menu Holder Display Stand (A4)", "A4 double-sided LED display stand",
               ["Built-in 10,000 mAh battery for cordless use, 8-hour power duration", "USB and Type-C charging sockets", "Bright illumination for menus and advertisements", "Interchangeable displays, 1-minute poster replacement", "Available in white and black"]),
    "XG-T51": ("Rechargeable LED Menu Holder Display Stand (A3)", "A3 double-sided LED display stand",
               ["Built-in 10,000 mAh battery for cordless use, 8-hour power duration", "USB and Type-C charging sockets", "Bright illumination for menus and advertisements", "Interchangeable displays, 1-minute poster replacement", "Available in white and black"]),
    "XG-T52": ("Vibe Portable Bluetooth Speaker", "Immersive versatile acoustics with RGB lighting",
               ["Bluetooth 5.3", "4000 mAh battery, up to 10 hours playtime", "RGB lighting", "Waterproof and dustproof IPX6", "TWS pairing for two speakers", "TF card support; available in black, green and white"]),
    "XG-T60": ("K3 Wireless Clock Speaker", "Time, perpetual calendar, alarm clock, temperature & mobile holder",
               ["Bluetooth speaker with digital clock", "Date and temperature display", "Alarm clock", "Mobile phone holder", "TF card and FM radio playback", "Long battery life; available in black and white"]),
    "XG-T61": ("Wireless Headband Headphone", "Stretchable, foldable over-ear headphones",
               ["Bluetooth 5.3 with heavy bass", "40 mm magnetic horn for powerful bass", "HiFi panoramic stereo sound", "Imitation protein leather earmuffs", "Stretchable and foldable design", "Type-C charging, long battery life"]),
    "XG-T62": ("Wireless Sport Headphone with LED Lights", "HiFi stereo surround sound",
               ["Bluetooth 5.3, HiFi stereo sound", "16 hours endurance", "Cool breathing LED lighting", "Folding design for travel", "HD voice calls with microphone", "Full-pack protein-skin earmuffs"]),
    "XG-T63": ("Multifunctional Digital Pen Holder", "Smart digital desk organizer with clock",
               ["Digital clock with alarm", "Calendar and temperature (°C/°F) display", "Backlit LED screen", "12/24 hour format", "Runs on AA batteries", "Compact and modern pen holder"]),
    "XG-T69": ("Now Go Versatile Sound Bluetooth Speaker", "Portable speaker with 2-in-1 amplifier",
               ["Bluetooth 5.3", "8000 mAh battery, up to 12 hours playtime", "Built-in 2-in-1 amplifier, 20 W output", "Dual bass", "Waterproof IPX6, TWS pair", "Available in black, green and white"]),
    "XG-T70": ("Now Go Karaoke Speaker with Wireless Mic (12000 mAh)", "Bluetooth party speaker with microphone",
               ["4 powerful drivers, 2.2-channel acoustic system", "12000 mAh battery, up to 12 hours playtime; works as a power bank", "Wireless microphone for karaoke", "Professional DSP chip", "Bluetooth 5.3, TWS pair, USB & AUX", "Available in green and white"]),
    "XG-T71": ("Now Go Karaoke Speaker with Wireless Mic (20000 mAh)", "Bluetooth party speaker with microphone",
               ["4 powerful drivers, 2.2-channel acoustic system", "20000 mAh battery, up to 12 hours playtime; works as a power bank", "Wireless microphone for karaoke", "Professional DSP chip", "Bluetooth 5.3, TWS pair, USB & AUX", "Available in green and white"]),
}


def clean(f):
    f = re.sub(r"\s+", " ", f).strip(" ;\"“”")
    if re.search(r"(\b\w\b ){3,}", f):  # letter-spaced display type ("E x t e n d e d")
        return None
    if len(f) < 8 or not re.search(r"[a-z]", f) and len(f) > 25:
        return None
    if f.count(" ") < 1:
        return None
    return f[:1].upper() + f[1:]


d = json.load(open(P, encoding="utf-8"))
for r in d:
    if r["code"] in FIX:
        r["name"], r["subtitle"], r["features"] = FIX[r["code"]]
        r["desc"] = r["subtitle"] + ". " + ". ".join(r["features"][:3]) + "."
    else:
        r["features"] = [c for c in (clean(f) for f in r["features"]) if c][:8]
        r["subtitle"] = r["subtitle"][:1].upper() + r["subtitle"][1:].lower() if r["subtitle"].isupper() or r["subtitle"][:1].islower() else r["subtitle"]
json.dump(d, open(P, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print(len(d))
