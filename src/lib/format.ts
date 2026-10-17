const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export const formatINR = (n: number) => inr.format(n);

/** Thumbnail path for a catalogue image (640px WebP); uploaded/remote images are returned unchanged. */
/** 640px grid version of a product image: /catalog → /thumbs, and admin uploads (stored as `p/…/x.webp`) → `x_640.webp`. */
export const thumb = (src: string) =>
  src.startsWith("/catalog/") ? src.replace("/catalog/", "/thumbs/") : /\/object\/public\/[^/]+\/p\/.+\.webp$/.test(src) ? src.replace(/\.webp$/, "_640.webp") : src;

export const FREE_SHIPPING_THRESHOLD = 999;
export const SHIPPING_FEE = 79;

export const shippingFor = (subtotal: number) => (subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE);

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

export const SITE = {
  name: "BrandingDelight",
  tagline: "Premium brands & corporate gifting, delivered across India",
  phone: "+91 76808 93537",
  phoneRaw: "917680893537",
  email: "brandingdelight@gmail.com",
  address: "Hyderabad, Telangana 500078",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
};

export const whatsappLink = (text: string) => `https://wa.me/${SITE.phoneRaw}?text=${encodeURIComponent(text)}`;
