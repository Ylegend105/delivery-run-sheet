import { cookies } from "next/headers";
import { getSupabaseForToken } from "@/lib/supabase/server";
import { verifySessionJWT, type SessionClaims } from "@/lib/auth/jwt";

export const SESSION_COOKIE = "drs_session";

export async function getSession(): Promise<SessionClaims | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionJWT(token);
}

/** Session + a Supabase client scoped to that session's JWT (RLS-enforced). */
export async function getSessionAndSupabase() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return { session: null, supabase: null, token: null };
  const session = await verifySessionJWT(token);
  if (!session) return { session: null, supabase: null, token: null };
  return { session, supabase: getSupabaseForToken(token), token };
}
