import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let admin: SupabaseClient | null = null;

export const supabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

/** Service-role client. Server only: bypasses RLS, so every route using it must authorise the caller first. */
export function supabaseAdmin(): SupabaseClient | null {
  if (!supabaseConfigured()) return null;
  if (!admin) {
    admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return admin;
}

export const PRODUCT_BUCKET = process.env.SUPABASE_PRODUCT_BUCKET || "product-images";
