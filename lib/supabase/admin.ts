import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses RLS entirely — only ever used server-side,
 * and only for the one thing that must happen before a session JWT exists:
 * looking up an email in the `users` allowlist during login.
 */
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
