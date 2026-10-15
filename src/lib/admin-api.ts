import "server-only";
import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin, type SessionUser } from "./firebase/admin";
import { PRODUCTS_TAG } from "./catalog";
import { supabaseAdmin } from "./supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

type Ctx = { admin: SessionUser; db: SupabaseClient };

/** Wraps an admin route: verifies the Firebase token + email allow-list and that Supabase is configured. */
export function adminRoute<P = unknown>(fn: (req: Request, ctx: Ctx, params: P) => Promise<Response>) {
  return async (req: Request, routeCtx: { params: Promise<P> }) => {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: "Admin access only. Sign in with an approved, verified admin email." }, { status: 403 });
    const db = supabaseAdmin();
    if (!db) return NextResponse.json({ error: "Supabase is not configured. Add the keys from SETUP.md to .env.local." }, { status: 503 });
    try {
      return await fn(req, { admin, db }, (await routeCtx?.params) as P);
    } catch (e) {
      console.error("[admin]", e);
      return NextResponse.json({ error: (e as Error).message || "Server error" }, { status: 500 });
    }
  };
}

export function refreshStorefront() {
  revalidateTag(PRODUCTS_TAG);
  revalidatePath("/", "layout");
}
