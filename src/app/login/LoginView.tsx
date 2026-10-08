"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { useCurrentUser } from "@/lib/mock/settings";

/** Sign-in screen shown after Log out. The prototype has no real authentication. */
export function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const me = useCurrentUser();
  const [email, setEmail] = React.useState(me.email);
  const [password, setPassword] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [error, setError] = React.useState("");
  const signedOut = params.get("signedout") === "1";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Enter your work email");
    if (!password) return setError("Enter your password");
    toast.success(`Welcome back, ${me.name.split(" ")[0]}`);
    router.push("/");
  };
  const input = "w-full h-[2.8rem] px-3 rounded-[8px] border-[1.5px] border-[var(--input)] bg-[var(--card)] text-[0.95rem] focus:outline-none focus:border-[var(--ring)]";

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center mb-6 h-[64px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/cicod-crm-logo-light.png" alt="CICOD CRM" className="logo-light h-full w-auto object-contain" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/cicod-crm-logo-dark.png" alt="CICOD CRM" className="logo-dark h-full w-auto object-contain" />
        </div>
        {signedOut && (
          <div role="status" className="mb-4 rounded-xl border border-[rgba(31,157,115,.3)] bg-[rgba(31,157,115,.06)] px-4 py-3 text-[0.88rem] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[var(--success)] shrink-0" /> You&apos;ve signed out.
          </div>
        )}
        <form onSubmit={submit} className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm p-7 flex flex-col gap-5" aria-labelledby="signin-title">
          <div>
            <h1 id="signin-title" className="m-0 text-[1.4rem] font-heading font-extrabold">Sign in</h1>
            <p className="m-0 mt-1 text-[0.88rem] text-[var(--muted-foreground)]">Use your CICOD work account.</p>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.85rem] font-bold">Work email</span>
            <input type="email" autoComplete="username" className={input} value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} />
          </label>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="signin-password" className="text-[0.85rem] font-bold">Password</label>
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="text-[0.8rem] font-semibold text-[var(--primary)] flex items-center gap-1">{show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}{show ? "Hide" : "Show"}</button>
            </div>
            <input id="signin-password" type={show ? "text" : "password"} autoComplete="current-password" autoFocus className={input} value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} />
          </div>
          {error && <p role="alert" className="m-0 text-[0.84rem] text-[var(--destructive)]">{error}</p>}
          <Button type="submit" className="w-full h-11"><LogIn className="w-4 h-4 mr-2" /> Sign in</Button>
          <p className="m-0 text-[0.8rem] text-[var(--muted-foreground)] text-center">Forgot your password? Ask an admin to resend your invite.</p>
        </form>
      </div>
    </main>
  );
}
