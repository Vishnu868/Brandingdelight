import { NextResponse } from "next/server";
import { getOrder, markPaid } from "@/lib/orders";
import { razorpay, verifyPaymentSignature } from "@/lib/razorpay";

export async function POST(req: Request) {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json().catch(() => ({}));
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
  if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature))
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });

  // Look up how the customer paid (card network tells us e.g. "American Express").
  let method: string | undefined;
  let network: string | undefined;
  try {
    const pay = await razorpay()!.payments.fetch(razorpay_payment_id);
    method = pay.method;
    network = (pay as { card?: { network?: string } }).card?.network;
  } catch {
    /* non-fatal */
  }
  const order = (await markPaid(razorpay_order_id, razorpay_payment_id, method, network)) ?? (orderId ? await getOrder(orderId) : null);
  return NextResponse.json({ ok: true, orderId: order?.id ?? orderId, method, network });
}
