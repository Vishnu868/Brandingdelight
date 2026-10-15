import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/admin-api";
import { rowToOrder } from "@/lib/orders";

const STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "failed", "refunded"];

export const PATCH = adminRoute<{ id: string }>(async (req, { db }, { id }) => {
  const b = await req.json();
  const patch: Record<string, unknown> = {};
  if (typeof b.status === "string" && STATUSES.includes(b.status)) patch.status = b.status;
  if (typeof b.trackingUrl === "string") patch.tracking_url = b.trackingUrl.trim().slice(0, 500) || null;
  if (typeof b.notes === "string") patch.notes = b.notes.slice(0, 2000);
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  const { data, error } = await db.from("orders").update(patch).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ order: rowToOrder(data) });
});
