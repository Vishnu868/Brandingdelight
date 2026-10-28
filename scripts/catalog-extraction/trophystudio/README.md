# Trophy Studio (trophystudio.in) → "Trophies" category

Source: the site's catalogue feed (one server-function request on https://trophystudio.in, fetched 28 Oct 2026),
decoded to JSON, plus each product photo from its Google Drive link at 1600px.

- 425 product codes (what the site shows as "425 products") → 263 store products, one per design, with each
  size / colour code as a selectable option at its own price.
- 14 sub-sections by material (Crystal, Crystal Glass, Acrylic, Wood & Metal …); "New Arrival" / "On Discount"
  become tags (`new-arrival`, `on-discount`).
- The feed also contains groups the site does not show (Personalised Gifts, Office Stationery, Home Appliances —
  "Material not found" on the site); those are skipped.
- Prices and stock are a snapshot of the site on the fetch date; branding cost and GST are noted per product.

Re-run: `python -I build_trophies.py <data.json> <images dir> <repo root>` (replaces existing Trophy Studio products).
