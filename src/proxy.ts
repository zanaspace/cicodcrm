import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

/** Pages anyone can open without signing in. */
const PUBLIC_PAGES = ["/login", "/forgot-password", "/reset-password"];

/**
 * Early route check: signed-out visitors go to /login (and come back afterwards); signed-in users skip the
 * sign-in pages. This is a convenience, not the security boundary: route handlers verify the session
 * themselves and the backend authorizes every request.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(raw);
  const isPublic = PUBLIC_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!session && !isPublic) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    if (raw) url.searchParams.set("expired", "1");
    const res = NextResponse.redirect(url);
    if (raw) res.cookies.delete(SESSION_COOKIE);
    return res;
  }
  if (session && isPublic && pathname !== "/reset-password") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Everything except Next internals, API routes (they check the session themselves) and static files.
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|prds/|.*\\.(?:png|jpg|jpeg|svg|webp|ico|css|js|md|docx|pdf)$).*)"],
};
