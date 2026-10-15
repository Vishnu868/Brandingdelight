import { NextResponse } from "next/server";
import { getOrder } from "@/lib/orders";

/** Order IDs carry 32 random bits and are only shown to the buyer, so the confirmation page can load by ID. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^BD\d{6}-[0-9A-F]{8}$/.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const o = await getOrder(id);
  if (!o) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Return only what the confirmation page needs.
  return NextResponse.json({
    order: { id: o.id, status: o.status, items: o.items, subtotal: o.subtotal, shipping: o.shipping, total: o.total, createdAt: o.createdAt, paymentMethod: o.paymentMethod, cardNetwork: o.cardNetwork, city: o.address?.city },
  });
}
