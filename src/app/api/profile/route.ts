import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/firebase/admin";
import { supabaseAdmin } from "@/lib/supabase/server";

/** Signed-in customer's saved name + mobile. */
export async function GET(req: Request) {
  const u = await userFromRequest(req);
  if (!u) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ profile: null, stored: false });
  const { data } = await db.from("profiles").select("full_name, phone").eq("user_id", u.uid).maybeSingle();
  return NextResponse.json({ profile: data ? { name: data.full_name ?? "", phone: data.phone ?? "" } : null, stored: true });
}

export async function PUT(req: Request) {
  const u = await userFromRequest(req);
  if (!u) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const name = typeof b.name === "string" ? b.name.trim().slice(0, 80) : "";
  const phone = typeof b.phone === "string" ? b.phone.replace(/\D/g, "").slice(-10) : "";
  if (name.length < 2 || !/^[6-9]\d{9}$/.test(phone)) return NextResponse.json({ error: "Enter your name and a valid 10-digit mobile number." }, { status: 400 });
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ profile: { name, phone }, stored: false });
  const { error } = await db.from("profiles").upsert({ user_id: u.uid, email: u.email, full_name: name, phone }, { onConflict: "user_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: { name, phone }, stored: true });
}
