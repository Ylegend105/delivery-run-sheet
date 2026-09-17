import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { signSessionJWT } from "@/lib/auth/jwt";
import { SESSION_COOKIE } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, name, role")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json(
      { error: "This email is not authorized. Ask a dispatcher to add you." },
      { status: 403 },
    );
  }

  const token = await signSessionJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  const response = NextResponse.json({ role: user.role });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
