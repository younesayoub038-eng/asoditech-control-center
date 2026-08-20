import { NextResponse, type NextRequest } from "next/server";

// Fast, cookie-presence-only redirect. This is NOT the authorization
// boundary — it only exists to avoid flashing protected UI before a full,
// database-backed check runs in `requireUser()` (see src/lib/auth/guards.ts)
// inside the protected layout. Never add authorization logic here that the
// server components don't also enforce themselves.
const SESSION_COOKIE = "acc_session";
const PUBLIC_PATHS = new Set(["/connexion"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const hasSessionCookie = request.cookies.has(SESSION_COOKIE);
  if (!hasSessionCookie) {
    const loginUrl = new URL("/connexion", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
