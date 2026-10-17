# New catalogue import (Oct 2026)

21 new PDFs from `newcatalogues/` were added on top of the original 792 products → **3,020 products**.
Two of the 23 files (`Catalogue (JUNE 2026).pdf`, `electronics-and-mobile-accessories.pdf`) are byte-identical
to catalogues already imported, so they were skipped. All 792 original products are kept unchanged.

| Catalogue | Added |
|---|---|
| Portronics June 2026 | 700 |
| Popli Brass Handicrafts 2026 | 621 |
| Metal Flasks, Sippers & Mugs | 112 |
| Pen Drive Catalogue | 109 |
| Xech February 2026 | 102 |
| WP Gift Sets 2026 | 91 |
| Notebooks, Diaries & Notepads | 82 |
| Electronics Catalogue (XG-T) | 63 |
| Pen Catalogue (XG-MP) | 61 |
| Fur Jaden Sept 2026 | 47 |
| Remaxx Product Catalog | 44 |
| Borosil Catalog 2026 | 30 |
| Star Diary Power Bank Note Book 2027 | 26 |
| Premium Organizer Collection | 25 |
| EVM Catalogue | 21 |
| KIVA Gifts Collection 26 | 21 |
| Luxury Corporate Gift Combos | 20 |
| Desktop Pen Holders | 18 |
| Wangari Sustainable Innovations | 13 |
| Power Banks | 12 |
| JPP Premium Card Holder Segment | 10 |

## Duplicates removed (`duplicates-removed.json`) — 1

Rule: an exact duplicate is the **same company + same model code (or same name and price) + the same product photo**.
The photo check matters: these catalogues reuse one code for different products (Popli G-325 is both an Ashoka
emblem and a Nataraja; Popli TR-2, CP-111, CP-112 and Portronics Konnect CL likewise), so code alone is not enough.

- **HeatVault Mag 700 Vacuum Flask (H 393)** in *Metal Flasks* is the same product as *HeatVault Mag 700 (H 393)*
  already listed from the old *Electronics & Mobile Accessories* catalogue (same code, identical photo). Old listing kept.

A photo + name cross-check of every new product against every old one (`overlap.py`) found no other overlaps.

## Pages without their own product

Covers, index/divider pages, lifestyle photo pages (Fur Jaden) and contact pages. A few catalogue pages repeat a
product already listed elsewhere in the same PDF; those were attached to the existing product as extra photos:
Desktop Pen Holders pp. 19–27 (= XG-T11, T19, T45, T58, T59, T63, T64, T65, T68), Portronics pp. 104, 105, 660
(Harmonics Z11 / Z12 and Konnect 240C alternate photos), Notebooks p. 80 (Transformer cube colour variants).

## Known gaps

241 new products have no bullet list of features (mostly Xech, metal flasks, notebooks): their features are printed as
icon labels or free-floating text that OCR cannot order reliably. They still have a correct name, subtitle and
description; bullets can be transcribed by hand later.

## Pipeline

`render_pages.py` (page renders) → per-catalogue parsers (`borosil.py`, `remaxx.py`, `kiva.py`, `jpp.py`, `pbnb.py`,
`furjaden.py`, `combos.py`, `popli.py`, `evmwg.py`, `wp.py` + `wp_extra.py`, `newparse.py`, `ocrparse.py`,
`xgpens2.py`, `xgtech_fix.py` + `xgtech_curated.py`) write `raw/<key>.json`
→ `merge.py base792.json catalog.json --report duplicates-removed.json`. Image-only pages were read with Windows OCR
(`winocr.ps1`); stylised names and prices were transcribed by hand into `names_*.txt` / the parser tables.
