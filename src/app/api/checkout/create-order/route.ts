import { NextResponse } from "next/server";
import { priceFor } from "@/lib/catalog";
import { userFromRequest } from "@/lib/firebase/admin";
import { shippingFor } from "@/lib/format";
import { newOrderId } from "@/lib/orders";
import { razorpay, razorpayConfigured } from "@/lib/razorpay";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Address, OrderLine } from "@/lib/types";

type Body = { items: { productId: string; variantId?: string; qty: number }[]; address: Address };

const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid request");
  }
  const { items, address } = body;
  if (!Array.isArray(items) || !items.length || items.length > 100) return bad("Your cart is empty");
  const a = address ?? ({} as Address);
  if (!a.fullName?.trim() || !/^[6-9]\d{9}$/.test(a.phone ?? "") || !/^\S+@\S+\.\S+$/.test(a.email ?? "") || !a.line1?.trim() || !a.city?.trim() || !a.state?.trim() || !/^[1-9]\d{5}$/.test(a.pincode ?? ""))
    return bad("Please complete your delivery details");

  // Re-price every line on the server — never trust amounts sent from the browser.
  const lines: OrderLine[] = [];
  for (const it of items) {
    const qty = Math.floor(Number(it.qty));
    if (!(qty >= 1 && qty <= 999)) return bad("Invalid quantity");
    const found = await priceFor(String(it.productId), it.variantId ? String(it.variantId) : undefined);
    if (!found) return bad("An item in your cart is no longer available for online purchase. Please remove it and try again.", 409);
    const wanted = qty + lines.filter((l) => l.productId === found.product.id).reduce((n, l) => n + l.qty, 0);
    if (found.product.stock < wanted)
      return bad(found.product.stock > 0 ? `Only ${found.product.stock} of "${found.product.name}" left in stock.` : `"${found.product.name}" is out of stock.`, 409);
    lines.push({ productId: found.product.id, name: found.product.name, variantLabel: found.label, price: found.price, qty, image: found.product.images[0] ?? "" });
  }
  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;
  const id = newOrderId();
  const user = await userFromRequest(req);

  if (!razorpayConfigured()) {
    // Demo mode: lets the full flow be tested before Razorpay keys are added.
    return NextResponse.json({ demo: true, orderId: id, amount: total, lines, subtotal, shipping, total });
  }

  const rp = razorpay()!;
  const rpOrder = await rp.orders.create({
    amount: Math.round(total * 100), // paise
    currency: "INR",
    receipt: id,
    notes: { bd_order_id: id, email: a.email },
  });

  const db = supabaseAdmin();
  if (db) {
    const { error } = await db.from("orders").insert({
      id,
      user_id: user?.uid ?? null,
      email: a.email.toLowerCase(),
      phone: a.phone,
      items: lines,
      subtotal,
      shipping,
      total,
      address: a,
      status: "pending",
      razorpay_order_id: rpOrder.id,
    });
    if (error) {
      console.error("[checkout] order insert failed", error);
      return bad("Could not create your order. Please try again.", 500);
    }
  }

  return NextResponse.json({
    orderId: id,
    razorpayOrderId: rpOrder.id,
    amount: rpOrder.amount,
    currency: "INR",
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    lines,
    subtotal,
    shipping,
    total,
  });
}
