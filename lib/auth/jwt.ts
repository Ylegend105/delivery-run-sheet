import { SignJWT, jwtVerify } from "jose";

export type AppRole = "dispatcher" | "driver";

export type SessionClaims = {
  sub: string; // users.id
  email: string;
  role: AppRole; // doubles as the Postgres role PostgREST switches to
  name: string | null;
};

function getSecret() {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error("SUPABASE_JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function signSessionJWT(claims: SessionClaims): Promise<string> {
  return new SignJWT({
    email: claims.email,
    role: claims.role,
    name: claims.name,
    aud: "authenticated",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS)
    .sign(getSecret());
}

export async function verifySessionJWT(
  token: string,
): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      (payload.role !== "dispatcher" && payload.role !== "driver")
    ) {
      return null;
    }
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      name: typeof payload.name === "string" ? payload.name : null,
    };
  } catch {
    return null;
  }
}
