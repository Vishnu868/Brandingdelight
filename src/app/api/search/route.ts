import { NextResponse } from "next/server";
import { getCards } from "@/lib/catalog";
import { searchCards } from "@/lib/search";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.slice(0, 80) ?? "";
  const results = q.trim().length < 2 ? [] : searchCards(await getCards(), q).slice(0, 8);
  return NextResponse.json({ results }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}
