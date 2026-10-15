import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/admin-api";

export const GET = adminRoute(async (_req, { db }) => {
  const { data, error } = await db.from("enquiries").select("*").order("created_at", { ascending: false }).limit(300);
  if (error) throw error;
  return NextResponse.json({ enquiries: data ?? [] });
});

export const PATCH = adminRoute(async (req, { db }) => {
  const { id, status } = await req.json();
  if (!id || !["new", "contacted", "won", "lost"].includes(status)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const { error } = await db.from("enquiries").update({ status }).eq("id", id);
  if (error) throw error;
  return NextResponse.json({ ok: true });
});
