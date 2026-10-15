import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const s = (v: unknown, n = 300) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  if (b.website) return NextResponse.json({ ok: true }); // honeypot field for bots
  const row = { name: s(b.name, 120), company: s(b.company, 160), email: s(b.email, 160), phone: s(b.phone, 20), quantity: s(b.quantity, 60), budget: s(b.budget, 60), message: s(b.message, 3000) };
  if (!row.name || !/^\S+@\S+\.\S+$/.test(row.email) || row.phone.replace(/\D/g, "").length < 10) return NextResponse.json({ error: "Please enter your name, a valid email and phone number." }, { status: 400 });
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ ok: true, stored: false });
  const { error } = await db.from("enquiries").insert(row);
  if (error) return NextResponse.json({ error: "Could not save your enquiry. Please WhatsApp us." }, { status: 500 });
  return NextResponse.json({ ok: true, stored: true });
}
