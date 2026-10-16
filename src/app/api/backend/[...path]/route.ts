import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";
import { isMockMode, serverEnv } from "@/lib/env";

/**
 * Same-origin proxy to the CRM backend. The browser calls /api/backend/<path>; this handler checks the
 * session and forwards the request with the backend token, which never leaves the server.
 * The backend remains the authority on permissions: its 401/403 responses pass straight through.
 */
async function forward(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  if (isMockMode()) return NextResponse.json({ message: "The backend proxy is disabled in mock mode." }, { status: 501 });
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ message: "Your session has expired. Sign in again." }, { status: 401 });
  const base = serverEnv.crmApiBaseUrl();
  if (!base) return NextResponse.json({ message: "CRM_API_BASE_URL is not configured on the server." }, { status: 500 });

  const { path } = await ctx.params;
  const target = `${base}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  const headers = new Headers();
  for (const name of ["accept", "content-type"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (session.token) headers.set("Authorization", `Bearer ${session.token}`);

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: "no-store",
  }).catch(() => null);
  if (!upstream) return NextResponse.json({ message: "We couldn't reach the CRM service." }, { status: 502 });

  const out = new Headers();
  for (const name of ["content-type", "content-disposition"]) {
    const value = upstream.headers.get(name);
    if (value) out.set(name, value);
  }
  return new NextResponse(upstream.body, { status: upstream.status, headers: out });
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
