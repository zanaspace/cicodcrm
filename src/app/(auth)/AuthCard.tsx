import * as React from "react";
import { CheckCircle2, Info } from "lucide-react";

/** Shared frame for the signed-out pages: logo, optional notice, and the form card. */
export function AuthCard({ title, subtitle, notice, children, onSubmit }: {
  title: string;
  subtitle?: string;
  notice?: { tone: "success" | "info"; text: React.ReactNode } | null;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center mb-6 h-[64px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/cicod-crm-logo-light.png" alt="CICOD CRM" className="logo-light h-full w-auto object-contain" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/cicod-crm-logo-dark.png" alt="CICOD CRM" className="logo-dark h-full w-auto object-contain" />
        </div>
        {notice && (
          <div role="status" className={`mb-4 rounded-xl border px-4 py-3 text-[0.88rem] flex items-center gap-2 ${notice.tone === "success" ? "border-[rgba(31,157,115,.3)] bg-[rgba(31,157,115,.06)]" : "border-[var(--border)] bg-[var(--card)]"}`}>
            {notice.tone === "success" ? <CheckCircle2 className="w-4 h-4 text-[var(--success)] shrink-0" /> : <Info className="w-4 h-4 text-[var(--info)] shrink-0" />}
            {notice.text}
          </div>
        )}
        <form onSubmit={onSubmit} noValidate className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm p-7 flex flex-col gap-5" aria-labelledby="auth-title">
          <div>
            <h1 id="auth-title" className="m-0 text-[1.4rem] font-heading font-extrabold">{title}</h1>
            {subtitle && <p className="m-0 mt-1 text-[0.88rem] text-[var(--muted-foreground)]">{subtitle}</p>}
          </div>
          {children}
        </form>
      </div>
    </main>
  );
}

export const authInput = "w-full h-[2.8rem] px-3 rounded-[8px] border-[1.5px] border-[var(--input)] bg-[var(--card)] text-[0.95rem] focus:outline-none focus:border-[var(--ring)] aria-[invalid=true]:border-[var(--destructive)]";

export function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} className="m-0 text-[0.8rem] text-[var(--destructive)]">{message}</p> : null;
}
