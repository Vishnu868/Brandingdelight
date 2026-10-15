"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Order } from "./types";

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "key" | "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

export const cartKey = (productId: string, variantId?: string) => (variantId ? `${productId}::${variantId}` : productId);

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item, qty = 1) =>
        set((s) => {
          const key = cartKey(item.productId, item.variantId);
          const found = s.items.find((i) => i.key === key);
          if (found) return { items: s.items.map((i) => (i.key === key ? { ...i, qty: Math.min(99, i.qty + qty) } : i)) };
          return { items: [...s.items, { ...item, key, qty }] };
        }),
      setQty: (key, qty) =>
        set((s) => ({ items: s.items.map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(99, qty)) } : i)) })),
      remove: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
    }),
    { name: "bd-cart" }
  )
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.qty, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((n, i) => n + i.qty * i.price, 0);

export type WishItem = { id: string; slug: string; name: string; brand: string; image: string; price: number | null };

type WishState = { items: WishItem[]; toggle: (w: WishItem) => void; has: (id: string) => boolean; remove: (id: string) => void };

export const useWishlist = create<WishState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (w) =>
        set((s) => ({ items: s.items.some((i) => i.id === w.id) ? s.items.filter((i) => i.id !== w.id) : [w, ...s.items] })),
      has: (id) => get().items.some((i) => i.id === id),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
    }),
    { name: "bd-wishlist" }
  )
);

/** Orders placed while Supabase is not configured are kept on this device so the flow still works in demo mode. */
type LocalOrders = { orders: Order[]; save: (o: Order) => void };
export const useLocalOrders = create<LocalOrders>()(
  persist((set) => ({ orders: [], save: (o) => set((s) => ({ orders: [o, ...s.orders.filter((x) => x.id !== o.id)] })) }), {
    name: "bd-orders",
  })
);

type Toast = { id: number; text: string; tone?: "ok" | "error" };
type ToastState = { toasts: Toast[]; push: (text: string, tone?: Toast["tone"]) => void; dismiss: (id: number) => void };
export const useToast = create<ToastState>((set) => ({
  toasts: [],
  push: (text, tone = "ok") => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts, { id, text, tone }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2600);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

type UiState = { menuOpen: boolean; searchOpen: boolean; setMenu: (v: boolean) => void; setSearch: (v: boolean) => void };
export const useUi = create<UiState>((set) => ({
  menuOpen: false,
  searchOpen: false,
  setMenu: (v) => set({ menuOpen: v }),
  setSearch: (v) => set({ searchOpen: v }),
}));
