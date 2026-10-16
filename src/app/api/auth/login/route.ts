import { NextResponse } from "next/server";
import { AuthError, login } from "@/lib/auth/backend-auth";
import { isEmail } from "@/lib/auth/password-rules";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth/session";
import { serverEnv } from "@/lib/env";

const REMEMBER_DAYS = 14;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string; remember?: boolean };
  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");
  const fieldErrors: Record<string, string> = {};
  if (!isEmail(email)) fieldErrors.email = "Enter your work email.";
  if (!password) fieldErrors.password = "Enter your password.";
  if (Object.keys(fieldErrors).length) return NextResponse.json({ message: "Check the highlighted fields.", errors: fieldErrors }, { status: 422 });

  try {
    const { user, token } = await login(email, password);
    const maxAge = body.remember ? REMEMBER_DAYS * 86_400 : serverEnv.sessionTtlMinutes() * 60;
    const cookie = await signSession({ ...user, token, exp: Date.now() + maxAge * 1000 });
    const res = NextResponse.json({ user });
    res.cookies.set(SESSION_COOKIE, cookie, sessionCookieOptions(maxAge));
    return res;
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 500;
    const message = e instanceof AuthError ? e.message : "Sign-in is unavailable right now. Try again shortly.";
    return NextResponse.json({ message }, { status });
  }
}
