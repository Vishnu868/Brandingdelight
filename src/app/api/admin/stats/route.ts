import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/admin-api";

export const GET = adminRoute(async (_req, { db }) => {
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const [products, active, orders, recent, enquiries] = await Promise.all([
    db.from("products").select("id", { count: "exact", head: true }),
    db.from("products").select("id", { count: "exact", head: true }).eq("active", true),
    db.from("orders").select("id", { count: "exact", head: true }),
    db.from("orders").select("total,status,created_at,card_network,payment_method").gte("created_at", since).limit(5000),
    db.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);
  const paidish = (recent.data ?? []).filter((o) => !["pending", "failed", "cancelled", "refunded"].includes(o.status));
  const byDay: Record<string, number> = {};
  for (const o of paidish) {
    const d = String(o.created_at).slice(0, 10);
    byDay[d] = (byDay[d] ?? 0) + Number(o.total);
  }
  const methods: Record<string, number> = {};
  for (const o of paidish) {
    const k = o.card_network ? `Card · ${o.card_network}` : (o.payment_method ?? "unknown");
    methods[k] = (methods[k] ?? 0) + 1;
  }
  return NextResponse.json({
    products: products.count ?? 0,
    activeProducts: active.count ?? 0,
    orders: orders.count ?? 0,
    revenue30d: paidish.reduce((n, o) => n + Number(o.total), 0),
    orders30d: paidish.length,
    pending: (recent.data ?? []).filter((o) => o.status === "paid").length,
    newEnquiries: enquiries.count ?? 0,
    byDay,
    methods,
  });
});
