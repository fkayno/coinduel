import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/play",
  "/matches",
  "/settings",
  "/profile",
  "/signup/wallet",
  "/subscriptions",
];
const AUTH_ONLY_PAGES = ["/login", "/signup"];

/**
 * Public match share card + its OG image (/matches/{id}/share, and the
 * opengraph-image route colocated under it) are meant to be viewable by
 * anyone with the link — including link-preview crawlers with no session
 * cookie at all — so they're carved out of the otherwise-blanket
 * "/matches" auth gate below.
 */
const PUBLIC_MATCH_SHARE_PATTERN = /^\/matches\/[^/]+\/share(\/.*)?$/;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_MATCH_SHARE_PATTERN.test(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const isLoggedIn = session !== null;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (AUTH_ONLY_PAGES.includes(pathname) && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/play/:path*",
    "/matches/:path*",
    "/settings/:path*",
    "/profile/:path*",
    "/subscriptions/:path*",
    "/login",
    "/signup",
    "/signup/wallet",
  ],
};
