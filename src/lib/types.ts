export type Variant = { id: string; label: string; price: number };

export type Spec = { label: string; value: string };

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number | null;
  mrp: number | null;
  sku: string | null;
  shortDescription: string;
  description: string;
  highlights: string[];
  specs: Spec[];
  variants: Variant[];
  images: string[];
  tags: string[];
  catalog: string;
  stock: number;
  priceOnRequest: boolean;
  featured?: boolean;
  active?: boolean;
};

/** Lightweight shape sent to listing pages. */
export type ProductCard = Pick<
  Product,
  "id" | "slug" | "name" | "brand" | "category" | "subcategory" | "price" | "mrp" | "priceOnRequest"
> & { image: string; hasVariants: boolean; inStock: boolean };

export type Category = {
  name: string;
  slug: string;
  count: number;
  image: string;
  subcategories: { name: string; slug: string; count: number }[];
};

export type Brand = { name: string; slug: string; count: number };

export type CartItem = {
  key: string; // productId + variantId
  productId: string;
  slug: string;
  name: string;
  brand: string;
  image: string;
  variantId?: string;
  variantLabel?: string;
  price: number;
  qty: number;
};

export type Address = {
  fullName: string;
  phone: string;
  email: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
  company?: string;
};

export type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "failed" | "refunded";

export type OrderLine = {
  productId: string;
  name: string;
  variantLabel?: string;
  price: number;
  qty: number;
  image: string;
};

export type Order = {
  id: string;
  userId: string | null;
  email: string;
  items: OrderLine[];
  subtotal: number;
  shipping: number;
  total: number;
  address: Address;
  status: OrderStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentMethod?: string;
  cardNetwork?: string;
  trackingUrl?: string;
  notes?: string;
  phone?: string;
  createdAt: string;
};
