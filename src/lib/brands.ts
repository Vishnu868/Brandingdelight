/** Presentation data for brand tiles. Brands added later by admins fall back to their first product image. */
export const BRAND_META: Record<string, { tagline: string; image: string; pos?: string }> = {
  SMOOR: { tagline: "Artisanal chocolate gifting", image: "/thumbs/smoor/smoor-p1.webp" },
  Lifelong: { tagline: "Built for better living", image: "/thumbs/lifelong-banners/llb-p1.webp", pos: "30% 50%" },
  Portronics: { tagline: "Something for everyone", image: "/thumbs/portronics/por-p1.webp", pos: "50% 50%" },
  Borosil: { tagline: "Kitchen & drinkware essentials", image: "/thumbs/borosil/bor-photo-p12.webp" },
  Tamta: { tagline: "Handcrafted pure copper", image: "/thumbs/tamta-banners/tamb-p1.webp" },
  "Unwrap Happiness": { tagline: "Gather, gift, celebrate", image: "/thumbs/unwrap/unwrap-p13-2.webp" },
  FUZO: { tagline: "Utility turned into identity", image: "/thumbs/fuzo/fuzo-p2.webp" },
  LOYKA: { tagline: "Festive almond brittles", image: "/thumbs/loyka/loyka-p1.webp" },
  "HRX by Hrithik Roshan": { tagline: "Unbreakable travel gear", image: "/thumbs/hrx/hrx-p2.webp", pos: "45% 50%" },
  "Everyday Organisers": { tagline: "Made-in-India desk design", image: "/thumbs/eo/eo-p1a.webp" },
  Xech: { tagline: "Smart lifestyle gadgets", image: "/thumbs/xech/xech-p1.webp" },
  "Fur Jaden": { tagline: "Bags for the shade squad", image: "/thumbs/furjaden/fj-p2.webp" },
  "KIVA Gifts": { tagline: "Chocolate & dry fruit hampers", image: "/thumbs/kiva/kiva-p2.webp", pos: "50% 35%" },
  "Popli Brass": { tagline: "Handcrafted brass & pooja decor", image: "/thumbs/popli/popli-fv-15te.webp" },
  Remaxx: { tagline: "Clever desk & travel tech", image: "/thumbs/remaxx/rmx-hero-p4.webp" },
  "BD Corporate Gifts": { tagline: "Ready-to-brand gift sets", image: "/thumbs/gift-combos/gc-gs1008.webp" },
  "BD Signature": { tagline: "Bottles, diaries & desk gifts", image: "/thumbs/flasks/fl-p2.webp" },
  "Star Diary": { tagline: "Power bank notebooks", image: "/thumbs/powerbank-notebooks/pbnb-p11.webp", pos: "30% 50%" },
  EVM: { tagline: "Power banks & accessories", image: "/thumbs/evm/evm-22-5w.webp" },
  Wangari: { tagline: "Sustainable innovations", image: "/thumbs/wangari/wg-alder.webp" },
  JPP: { tagline: "Premium card holders", image: "/thumbs/cardholders/jpp-p4.webp" },
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
