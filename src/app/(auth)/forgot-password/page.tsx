"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useForgotPassword } from "@/features/auth/hooks";
import { isEmail } from "@/lib/auth/password-rules";
import { AuthCard, FieldError, authInput } from "../AuthCard";

/** Request a password reset link. The response is the same whether or not the email has an account. */
export default function ForgotPasswordPage() {
  const forgot = useForgotPassword();
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmail(email)) return setError("Enter your work email.");
    setError("");
    forgot.run(email.trim());
  };

  if (forgot.isSuccess) {
    return (
      <AuthCard title="Check your email" notice={{ tone: "success", text: forgot.data.message }} onSubmit={(e) => e.preventDefault()}>
        <p className="m-0 text-[0.9rem] text-[var(--muted-foreground)]">The link expires after a short time. If nothing arrives, check spam or ask an admin to resend your invite.</p>
        <Link href="/login" className="font-semibold text-[var(--primary)] hover:underline text-center">Back to sign in</Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Reset your password" subtitle="We'll email you a link to choose a new password." onSubmit={submit}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="forgot-email" className="text-[0.85rem] font-bold">Work email</label>
        <input id="forgot-email" type="email" autoComplete="username" autoFocus className={authInput} value={email}
          aria-invalid={!!(error || forgot.fieldErrors.email)} aria-describedby="forgot-email-error"
          onChange={(e) => { setEmail(e.target.value); setError(""); }} />
        <FieldError id="forgot-email-error" message={error || forgot.fieldErrors.email} />
      </div>
      <Button type="submit" className="w-full h-11" disabled={forgot.isPending}>{forgot.isPending ? "Sending…" : "Send reset link"}</Button>
      <Link href="/login" className="text-[0.85rem] font-semibold text-[var(--primary)] hover:underline text-center">Back to sign in</Link>
    </AuthCard>
  );
}
