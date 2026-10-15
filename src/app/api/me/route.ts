import { NextResponse } from "next/server";
import { isAdminUser, userFromRequest } from "@/lib/firebase/admin";

export async function GET(req: Request) {
  const u = await userFromRequest(req);
  if (!u) return NextResponse.json({ user: null, isAdmin: false }, { status: 401 });
  return NextResponse.json({ user: u, isAdmin: isAdminUser(u) });
}
