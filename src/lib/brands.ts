/** Presentation data for brand tiles. Brands added later by admins fall back to their first product image. */
export const BRAND_META: Record<string, { tagline: string; image: string; pos?: string }> = {
  SMOOR: { tagline: "Artisanal chocolate gifting", image: "/thumbs/smoor/smoor-p1.webp" },
  Lifelong: { tagline: "Built for better living", image: "/thumbs/lifelong-banners/llb-p1.webp", pos: "30% 50%" },
  Tamta: { tagline: "Handcrafted pure copper", image: "/thumbs/tamta-banners/tamb-p1.webp" },
  "Unwrap Happiness": { tagline: "Gather, gift, celebrate", image: "/thumbs/unwrap/unwrap-p13-2.webp" },
  FUZO: { tagline: "Utility turned into identity", image: "/thumbs/fuzo/fuzo-p2.webp" },
  LOYKA: { tagline: "Festive almond brittles", image: "/thumbs/loyka/loyka-p1.webp" },
  "HRX by Hrithik Roshan": { tagline: "Unbreakable travel gear", image: "/thumbs/hrx/hrx-p2.webp", pos: "45% 50%" },
  "Everyday Organisers": { tagline: "Made-in-India desk design", image: "/thumbs/eo/eo-p1a.webp" },
  "BD Tech Essentials": { tagline: "Brandable desk & mobile tech", image: "/thumbs/electronics/elec-p2.webp", pos: "20% 50%" },
  Aquaminder: { tagline: "Smart hydration bottles", image: "/thumbs/bottles/bottle-p2.webp" },
  Nutsio: { tagline: "Wholesome dry fruits", image: "/thumbs/dryfruits/dry-p12.webp" },
  "SNITCH Travel": { tagline: "Pack different, move bold", image: "/thumbs/snitch/snitch-p4.webp", pos: "85% 50%" },
  "BrandingDelight Festive": { tagline: "Dry fruit gift boxes", image: "/thumbs/dryfruits/dry-p2.webp", pos: "70% 50%" },
  "Swiss Military": { tagline: "Hard-top trolley luggage", image: "/thumbs/luggage/zest-p4.webp", pos: "15% 70%" },
  Kamiliant: { tagline: "Lightweight cabin trolleys", image: "/thumbs/luggage/zest-p3.webp", pos: "50% 40%" },
};

/** Display order: best-known gifting brands first. */
export const BRAND_ORDER = Object.keys(BRAND_META);
