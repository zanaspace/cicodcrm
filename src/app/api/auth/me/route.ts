import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, publicUser, verifySession } from "@/lib/auth/session";

/** The signed-in user, role and module access. 401 when there is no valid session. */
export async function GET() {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ message: "Your session has expired. Sign in again." }, { status: 401 });
  return NextResponse.json({ user: publicUser(session), expiresAt: session.exp });
}
