import { NextResponse } from "next/server";
import { markPaid } from "@/lib/orders";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Razorpay webhook (Dashboard → Settings → Webhooks → https://YOUR-DOMAIN/api/webhooks/razorpay,
 * events: payment.captured, payment.failed, order.paid). Makes orders reliable even if the customer
 * closes the browser before the success page loads.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, sig)) return NextResponse.json({ error: "bad signature" }, { status: 400 });

  const evt = JSON.parse(raw);
  const pay = evt?.payload?.payment?.entity;
  if (!pay?.order_id) return NextResponse.json({ ok: true });

  if (evt.event === "payment.captured" || evt.event === "order.paid") {
    await markPaid(pay.order_id, pay.id, pay.method, pay.card?.network);
  } else if (evt.event === "payment.failed") {
    await supabaseAdmin()?.from("orders").update({ status: "failed" }).eq("razorpay_order_id", pay.order_id).eq("status", "pending");
  }
  return NextResponse.json({ ok: true });
}
