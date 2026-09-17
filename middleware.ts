import { NextRequest, NextResponse } from "next/server";
import { verifySessionJWT } from "@/lib/auth/jwt";
import { SESSION_COOKIE } from "@/lib/auth/session";

const ROLE_HOME: Record<"dispatcher" | "driver", string> = {
  dispatcher: "/dispatcher",
  driver: "/driver",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionJWT(token) : null;

  if (!session) {
    if (pathname === "/login") return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Already signed in: bounce away from /login and away from the other
  // role's board. This runs server-side in middleware, not just as a
  // client-side redirect, so a driver cannot simply load /dispatcher.
  if (pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_HOME[session.role];
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/dispatcher") && session.role !== "dispatcher") {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_HOME[session.role];
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/driver") && session.role !== "driver") {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_HOME[session.role];
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/dispatcher/:path*", "/driver/:path*", "/settings/:path*"],
};
