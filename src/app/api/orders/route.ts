import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/firebase/admin";
import { rowToOrder } from "@/lib/orders";
import { supabaseAdmin } from "@/lib/supabase/server";

/** Signed-in customer's orders (matched by Firebase uid, or by verified email for earlier guest orders). */
export async function GET(req: Request) {
  const u = await userFromRequest(req);
  if (!u) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ orders: [], configured: false });
  let q = db.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
  // Guest orders are linked by email only when Firebase has verified the address belongs to this user.
  q = u.email && u.emailVerified ? q.or(`user_id.eq."${u.uid}",email.eq."${u.email.toLowerCase().replace(/"/g, "")}"`) : q.eq("user_id", u.uid);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: (data ?? []).map(rowToOrder), configured: true });
}
