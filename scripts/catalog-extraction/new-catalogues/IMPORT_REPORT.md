# New catalogue import (Oct 2026)

21 new PDFs from `newcatalogues/` were added on top of the original 792 products → **3,006 products**.
Two of the 23 files (`Catalogue (JUNE 2026).pdf`, `electronics-and-mobile-accessories.pdf`) are byte-identical
to catalogues already imported, so they were skipped.

| Catalogue | Added |
|---|---|
| Portronics June 2026 | 699 |
| Popli Brass Handicrafts 2026 | 617 |
| Metal Flasks, Sippers & Mugs | 112 |
| Pen Drive Catalogue | 109 |
| Xech February 2026 | 102 |
| WP Gift Sets 2026 | 87 |
| Notebooks, Diaries & Notepads | 82 |
| Electronics Catalogue (XG-T) | 63 |
| Pen Catalogue (XG-MP) | 56 |
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

## Duplicates removed (`duplicates-removed.json`)

Rule: same company **and** same model code with a similar name, or same company + same name + same price.
House-branded (BD …) items were also compared by product photo (perceptual hash).

- **vs the old 13 catalogues — 1:** HeatVault Mag 700 Vacuum Flask (H 393) from *Metal Flasks* = HeatVault Mag 700 (H 393)
  already listed from *Electronics & Mobile Accessories* (same code, identical photo). Old listing kept.
- **Repeated inside the new catalogues — 5:** Popli TR-2, G-325, CP-111, CP-112 (each printed on two pages) and
  Portronics Konnect CL (POR 1816 / POR 2118, listed twice).

A photo + name cross-check of every new product against every old product (`overlap.py`) found no other overlaps.

## Pipeline

`render_pages.py` (page renders) → per-catalogue parsers (`borosil.py`, `remaxx.py`, `kiva.py`, `jpp.py`, `pbnb.py`,
`furjaden.py`, `combos.py`, `popli.py`, `evmwg.py`, `wp.py`, `newparse.py`, `ocrparse.py`) write `raw/<key>.json`
→ `merge.py base792.json catalog.json --report duplicates-removed.json`. Image-only pages were read with Windows OCR
(`winocr.ps1`); stylised names and prices were transcribed by hand into `names_*.txt` / the parser tables.
