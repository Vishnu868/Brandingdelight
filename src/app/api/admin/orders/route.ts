import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/admin-api";
import { rowToOrder } from "@/lib/orders";

export const GET = adminRoute(async (req, { db }) => {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  let q = db.from("orders").select("*").order("created_at", { ascending: false }).limit(500);
  if (status && status !== "all") q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return NextResponse.json({ orders: (data ?? []).map(rowToOrder) });
});
