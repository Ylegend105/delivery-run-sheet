import { createClient } from "@supabase/supabase-js";

/**
 * Per-request Supabase client that carries the caller's signed session JWT
 * as the Authorization bearer token. PostgREST verifies that JWT and
 * executes the request as the `role` claim it contains (dispatcher/driver),
 * so Postgres RLS — not this code — is what actually enforces access.
 */
export function getSupabaseForToken(jwt: string) {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY is not set");
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      // Always hit Postgres fresh — RLS-scoped reads must never be served
      // from Next.js's fetch cache (e.g. right after a settings update).
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}
