import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logout } from "@/lib/auth/backend-auth";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

export async function POST() {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  await logout(session?.token);
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
