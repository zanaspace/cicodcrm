"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useResetPassword } from "@/features/auth/hooks";
import { PASSWORD_MIN_LENGTH, passwordProblem } from "@/lib/auth/password-rules";
import { AuthCard, FieldError, authInput } from "../AuthCard";

/** Choose a new password from the emailed link (/reset-password?token=...). */
export function ResetPasswordView() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const reset = useResetPassword();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const problem = passwordProblem(password);
    if (problem) next.password = problem;
    if (confirm !== password) next.confirm = "The passwords don't match.";
    setErrors(next);
    if (Object.keys(next).length) return;
    reset.mutate({ token, password }, { onSuccess: () => router.replace("/login?reset=1") });
  };

  if (!token) {
    return (
      <AuthCard title="This link doesn't work" onSubmit={(e) => e.preventDefault()}>
        <p className="m-0 text-[0.9rem] text-[var(--muted-foreground)]">The reset link is missing or incomplete. Request a new one.</p>
        <Link href="/forgot-password" className="font-semibold text-[var(--primary)] hover:underline text-center">Request a new link</Link>
      </AuthCard>
    );
  }

  const fieldError = (k: string) => errors[k] || reset.fieldErrors[k];
  const formError = reset.error && !Object.keys(reset.fieldErrors).length ? reset.error.message : "";

  return (
    <AuthCard title="Choose a new password" subtitle={`At least ${PASSWORD_MIN_LENGTH} characters, with a letter and a number.`} onSubmit={submit}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reset-password" className="text-[0.85rem] font-bold">New password</label>
        <input id="reset-password" type="password" autoComplete="new-password" autoFocus className={authInput} value={password}
          aria-invalid={!!fieldError("password")} aria-describedby="reset-password-error" onChange={(e) => setPassword(e.target.value)} />
        <FieldError id="reset-password-error" message={fieldError("password")} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reset-confirm" className="text-[0.85rem] font-bold">Confirm new password</label>
        <input id="reset-confirm" type="password" autoComplete="new-password" className={authInput} value={confirm}
          aria-invalid={!!fieldError("confirm")} aria-describedby="reset-confirm-error" onChange={(e) => setConfirm(e.target.value)} />
        <FieldError id="reset-confirm-error" message={fieldError("confirm")} />
      </div>
      {formError && <p role="alert" className="m-0 text-[0.84rem] text-[var(--destructive)]">{formError}</p>}
      <Button type="submit" className="w-full h-11" disabled={reset.isPending}>{reset.isPending ? "Saving…" : "Save new password"}</Button>
    </AuthCard>
  );
}
