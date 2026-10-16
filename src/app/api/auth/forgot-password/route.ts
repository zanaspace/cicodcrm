import { NextResponse } from "next/server";
import { AuthError, requestPasswordReset } from "@/lib/auth/backend-auth";
import { isEmail } from "@/lib/auth/password-rules";

export async function POST(request: Request) {
  const { email } = (await request.json().catch(() => ({}))) as { email?: string };
  if (!isEmail(String(email ?? ""))) {
    return NextResponse.json({ message: "Enter your work email.", errors: { email: "Enter your work email." } }, { status: 422 });
  }
  try {
    await requestPasswordReset(String(email));
  } catch (e) {
    // Only infrastructure failures surface; whether the account exists is never revealed.
    if (!(e instanceof AuthError) || e.status >= 500) {
      return NextResponse.json({ message: "We couldn't send the email right now. Try again shortly." }, { status: 502 });
    }
  }
  return NextResponse.json({ message: "If that email has an account, we've sent a link to reset the password." });
}
