import "server-only";
import crypto from "node:crypto";
import { revalidateTag } from "next/cache";
import { PRODUCTS_TAG } from "./catalog";
import { supabaseAdmin } from "./supabase/server";
import type { Order } from "./types";

export const newOrderId = () => {
  const d = new Date();
  const ymd = `${d.getFullYear() % 100}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `BD${ymd}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
};

type Row = Record<string, unknown>;

export function rowToOrder(r: Row): Order {
  return {
    id: String(r.id),
    userId: (r.user_id as string) ?? null,
    email: String(r.email),
    phone: (r.phone as string) ?? undefined,
    items: r.items as Order["items"],
    subtotal: Number(r.subtotal),
    shipping: Number(r.shipping),
    total: Number(r.total),
    address: r.address as Order["address"],
    status: r.status as Order["status"],
    razorpayOrderId: (r.razorpay_order_id as string) ?? undefined,
    razorpayPaymentId: (r.razorpay_payment_id as string) ?? undefined,
    paymentMethod: (r.payment_method as string) ?? undefined,
    cardNetwork: (r.card_network as string) ?? undefined,
    trackingUrl: (r.tracking_url as string) ?? undefined,
    notes: (r.notes as string) ?? undefined,
    createdAt: String(r.created_at),
  };
}

export async function getOrder(id: string) {
  const db = supabaseAdmin();
  if (!db) return null;
  const { data } = await db.from("orders").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  const order = rowToOrder(data);
  // Reduce stock once per order (only runs on the pending→paid transition above).
  for (const l of order.items) {
    const { error } = await db.rpc("decrement_stock", { p_id: l.productId, p_qty: l.qty });
    if (error) console.error("[orders] stock update failed", l.productId, error.message);
  }
  revalidateTag(PRODUCTS_TAG);
  return order;
}

export async function markPaid(razorpayOrderId: string, paymentId: string, method?: string, network?: string) {
  const db = supabaseAdmin();
  if (!db) return null;
  const { data } = await db
    .from("orders")
    .update({ status: "paid", razorpay_payment_id: paymentId, payment_method: method ?? null, card_network: network ?? null })
    .eq("razorpay_order_id", razorpayOrderId)
    .in("status", ["pending", "failed"])
    .select("*")
    .maybeSingle();
  if (!data) return null;
  const order = rowToOrder(data);
  // Reduce stock once per order (only runs on the pending→paid transition above).
  for (const l of order.items) {
    const { error } = await db.rpc("decrement_stock", { p_id: l.productId, p_qty: l.qty });
    if (error) console.error("[orders] stock update failed", l.productId, error.message);
  }
  revalidateTag(PRODUCTS_TAG);
  return order;
}
