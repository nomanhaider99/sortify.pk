import { NextResponse } from "next/server";
import { auth } from "@/auth";

/** Routes reachable without a session. */
const PUBLIC = [/^\/login$/, /^\/invite\/[^/]+$/, /^\/reset\/[^/]+$/];

/**
 * Authentication gate (Next 16 "proxy", formerly middleware). Authorization is NOT done here —
 * every page, server action and route handler re-checks permissions on the server.
 */
export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const isPublic = PUBLIC.some((r) => r.test(pathname));
  const session = req.auth;

  if (!session && !isPublic) {
    const url = new URL("/login", req.nextUrl);
    if (pathname !== "/") url.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }
  // NOTE: no "signed in → leave /login" redirect here: the JWT can be valid while the user was
  // disabled/revoked in the DB. The login page decides using the DB-validated session.
  // Forced password change on first login.
  if (session?.mustChangePassword && pathname !== "/account/password" && !isPublic) {
    return NextResponse.redirect(new URL("/account/password", req.nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};
