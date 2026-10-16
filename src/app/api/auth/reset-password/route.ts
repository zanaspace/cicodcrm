import { NextResponse } from "next/server";
import { AuthError, resetPassword } from "@/lib/auth/backend-auth";
import { passwordProblem } from "@/lib/auth/password-rules";

export async function POST(request: Request) {
  const { token, password } = (await request.json().catch(() => ({}))) as { token?: string; password?: string };
  const problem = passwordProblem(String(password ?? ""));
  if (problem) return NextResponse.json({ message: problem, errors: { password: problem } }, { status: 422 });
  try {
    await resetPassword(String(token ?? ""), String(password));
    return NextResponse.json({ message: "Password updated. Sign in with your new password." });
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 500;
    const message = e instanceof AuthError ? e.message : "We couldn't reset the password. Try again shortly.";
    return NextResponse.json({ message }, { status });
  }
}
