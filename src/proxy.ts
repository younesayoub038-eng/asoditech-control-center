import { NextResponse, type NextRequest } from "next/server";

// Fast, cookie-presence-only redirect. This is NOT the authorization
// boundary — it only exists to avoid flashing protected UI before a full,
// database-backed check runs in `requireUser()` (see src/lib/auth/guards.ts)
// inside the protected layout. Never add authorization logic here that the
// server components don't also enforce themselves.
const SESSION_COOKIE = "acc_session";
const PUBLIC_PATHS = new Set(["/connexion"]);
// Static assets (brand images, the generated favicon route, anything in
// /public) are never sensitive — gating them behind login would break the
// logo/favicon on the login page itself for a signed-out visitor.
const STATIC_ASSET_PATTERN = /\.(?:png|svg|jpg|jpeg|webp|gif|ico)$/i;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    STATIC_ASSET_PATTERN.test(pathname)
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
