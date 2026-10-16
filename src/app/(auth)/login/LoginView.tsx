"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLogin } from "@/features/auth/hooks";
import { isEmail } from "@/lib/auth/password-rules";
import { isMockMode } from "@/lib/env";
import { AuthCard, FieldError, authInput } from "../AuthCard";

/** Sign in with a CICOD work account. Returns the user to the page they were trying to open. */
export function LoginView() {
  const params = useSearchParams();
  const login = useLogin(params.get("next"));
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(false);
  const [show, setShow] = React.useState(false);
  const [local, setLocal] = React.useState<Record<string, string>>({});

  const errors = { ...login.fieldErrors, ...local };
  const formError = login.error && !Object.keys(login.fieldErrors).length ? login.error.message : "";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!isEmail(email)) next.email = "Enter your work email.";
    if (!password) next.password = "Enter your password.";
    setLocal(next);
    if (Object.keys(next).length) return;
    login.run({ email: email.trim(), password, remember });
  };

  const notice = params.get("signedout") === "1"
    ? { tone: "success" as const, text: "You've signed out." }
    : params.get("expired") === "1"
      ? { tone: "info" as const, text: "Your session ended. Sign in again to continue." }
      : params.get("reset") === "1"
        ? { tone: "success" as const, text: "Password updated. Sign in with your new password." }
        : null;

  return (
    <AuthCard title="Sign in" subtitle="Use your CICOD work account." notice={notice} onSubmit={submit}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="signin-email" className="text-[0.85rem] font-bold">Work email</label>
        <input id="signin-email" type="email" autoComplete="username" autoFocus className={authInput} value={email}
          aria-invalid={!!errors.email} aria-describedby={errors.email ? "signin-email-error" : undefined}
          onChange={(e) => { setEmail(e.target.value); setLocal((l) => ({ ...l, email: "" })); }} />
        <FieldError id="signin-email-error" message={errors.email} />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="signin-password" className="text-[0.85rem] font-bold">Password</label>
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="text-[0.8rem] font-semibold text-[var(--primary)] flex items-center gap-1">
            {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}{show ? "Hide" : "Show"}
          </button>
        </div>
        <input id="signin-password" type={show ? "text" : "password"} autoComplete="current-password" className={authInput} value={password}
          aria-invalid={!!errors.password} aria-describedby={errors.password ? "signin-password-error" : undefined}
          onChange={(e) => { setPassword(e.target.value); setLocal((l) => ({ ...l, password: "" })); }} />
        <FieldError id="signin-password-error" message={errors.password} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-[0.85rem]">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 accent-[var(--primary)]" />
          Keep me signed in
        </label>
        <Link href="/forgot-password" className="text-[0.85rem] font-semibold text-[var(--primary)] hover:underline">Forgot password?</Link>
      </div>
      {formError && <p role="alert" className="m-0 text-[0.84rem] text-[var(--destructive)]">{formError}</p>}
      <Button type="submit" className="w-full h-11" disabled={login.isPending}>
        <LogIn className="w-4 h-4 mr-2" /> {login.isPending ? "Signing in…" : "Sign in"}
      </Button>
      {isMockMode() && (
        <p className="m-0 text-[0.78rem] text-[var(--muted-foreground)] text-center">
          Sample data mode: sign in as adeola.adesina@cicod.com (Admin) or any active sample user, password <code>cicod-demo</code>.
        </p>
      )}
    </AuthCard>
  );
}
