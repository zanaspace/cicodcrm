"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Circle, Eye, EyeOff, KeyRound, Lock, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState, LoadingState } from "@/components/feedback/States";
import { cn } from "@/lib/utils";
import { formatPhone, toE164 } from "@/lib/format";
import { PASSWORD_MIN_LENGTH, passwordProblem } from "@/lib/auth/password-rules";
import { usePermissions } from "@/lib/permissions";
import { useSessionUser } from "@/features/auth/hooks";
import { useAuditQuery, useChangePassword, useProfileQuery, useUpdateProfile } from "@/features/settings/queries";
import type { Profile } from "@/services/settings";
import { inputClass } from "@/app/(dashboard)/crm/catalogue/components/editor";
import { Avatar, Panel, ago, dateTime } from "./shared";

const TITLE = "My profile";
const SUBTITLE = "Your details and password. Your role is set by an admin.";

/** The signed-in user's own page, open to every role. */
export function ProfileView() {
  const session = useSessionUser();
  const profile = useProfileQuery();
  const { can } = usePermissions();
  const canSeeSettings = can("settings", "view");
  // The audit log is a Settings area; people without Settings access don't load it.
  const audit = useAuditQuery({ enabled: canSeeSettings });

  if (!session || profile.isPending || profile.isError) {
    return (
      <div className="max-w-[1600px] w-full mx-auto">
        <PageHeader title={TITLE} subtitle={SUBTITLE} />
        {profile.isError ? <ErrorState error={profile.error} onRetry={() => profile.refetch()} /> : <LoadingState />}
      </div>
    );
  }
  const me = { ...profile.data, name: profile.data.name || session.name, email: profile.data.email || session.email };
  const mine = (audit.data ?? []).filter((a) => a.actor === me.name).slice(0, 6);

  return (
    <div className="max-w-[1600px] w-full mx-auto">
      <PageHeader title={TITLE} subtitle={SUBTITLE} />
      <div className="grid grid-cols-[1fr_380px] gap-6 items-start">
        <div className="flex flex-col gap-6 min-w-0">
          <PersonalInfo key={`${me.name}|${me.phone}`} me={me} />
          <PasswordCard />
        </div>
        <div className="flex flex-col gap-6">
          <Panel title="Access">
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3"><Avatar name={me.name} /><div><div className="font-heading font-bold">{me.name}</div><div className="text-[0.82rem] text-[var(--muted-foreground)]">{me.email}</div></div></div>
              <dl className="grid grid-cols-[110px_1fr] gap-y-3 text-[0.88rem] m-0">
                <dt className="text-[var(--muted-foreground)]">Role</dt><dd className="m-0 flex items-center gap-2"><Badge variant="secondary">{session.role.name}</Badge>{canSeeSettings && <Link href={`/crm/settings/roles?role=${session.role.id}`} className="text-[0.8rem] font-semibold text-[var(--primary)]">What it allows</Link>}</dd>
                <dt className="text-[var(--muted-foreground)]">Status</dt><dd className="m-0"><StatusBadge status="Active" /></dd>
                <dt className="text-[var(--muted-foreground)]">Signed in</dt><dd className="m-0">{ago(me.lastActiveAt)}</dd>
              </dl>
            </div>
          </Panel>
          {canSeeSettings && <Panel title="Your recent changes" actions={<Link href="/crm/settings/audit?person=me" className="text-[0.82rem] font-semibold text-[var(--primary)]">Audit log</Link>}>
            {audit.isPending ? <p className="m-0 p-6 text-[0.85rem] text-[var(--muted-foreground)]">Loading…</p>
              : audit.isError ? <p className="m-0 p-6 text-[0.85rem] text-[var(--muted-foreground)]">Couldn&apos;t load your changes. <button type="button" onClick={() => audit.refetch()} className="font-semibold text-[var(--primary)]">Try again</button></p>
              : mine.length === 0 ? <p className="m-0 p-6 text-[0.85rem] text-[var(--muted-foreground)]">Nothing yet.</p> : (
              <ul className="m-0 p-6 list-none flex flex-col gap-3">
                {mine.map((a) => <li key={a.id} className="text-[0.85rem]"><b>{a.action}</b> · {a.target}<span className="block text-[0.78rem] text-[var(--muted-foreground)]">{dateTime(a.at)}</span></li>)}
              </ul>
            )}
          </Panel>}
        </div>
      </div>
    </div>
  );
}

/** Keyed by the saved values, so it starts fresh after every save. */
function PersonalInfo({ me }: { me: Profile }) {
  const update = useUpdateProfile({ success: "Profile saved" });
  const [name, setName] = React.useState(me.name);
  const [phone, setPhone] = React.useState(formatPhone(me.phone).replace("+234 ", "0"));
  const [localErrors, setErrors] = React.useState<Record<string, string>>({});
  const errors: Record<string, string> = { ...update.fieldErrors, ...localErrors };
  const e164 = phone.trim() ? toE164(phone) : "";
  const dirty = name.trim() !== me.name || (e164 ?? phone) !== me.phone;

  const save = () => {
    const e: Record<string, string> = {};
    if (name.trim().split(/\s+/).length < 2) e.name = "Enter your first and last name";
    if (e164 === null) e.phone = "Enter a Nigerian mobile number, e.g. 0803 123 4567";
    if (Object.keys(e).length) return setErrors(e);
    update.run({ id: me.id, name: name.trim(), phone: e164 || "" });
  };

  return (
    <Panel title="Personal info">
      <div className="p-6 grid grid-cols-2 gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.85rem] font-bold">Full name</span>
          <input className={inputClass} value={name} onChange={(e) => { setName(e.target.value); setErrors({}); }} />
          {errors.name && <span className="text-[0.78rem] text-[var(--destructive)]">{errors.name}</span>}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.85rem] font-bold">Phone</span>
          <input className={inputClass} value={phone} onChange={(e) => { setPhone(e.target.value); setErrors({}); }} placeholder="0803 123 4567" />
          {errors.phone ? <span className="text-[0.78rem] text-[var(--destructive)]">{errors.phone}</span> : e164 && <span className="text-[0.78rem] text-[var(--muted-foreground)]">Saved as {formatPhone(e164)}</span>}
        </label>
        <div className="flex flex-col gap-1.5 col-span-2">
          <span className="text-[0.85rem] font-bold">Sign-in email</span>
          <div className="h-[2.8rem] px-3 rounded-[8px] border-[1.5px] border-dashed border-[var(--border)] bg-[var(--muted)]/40 flex items-center gap-2 text-[0.95rem] text-[var(--muted-foreground)]">
            <Lock className="w-4 h-4" />{me.email}
          </div>
          <span className="text-[0.78rem] text-[var(--muted-foreground)]">You sign in with this address. Ask an admin to change it.</span>
        </div>
      </div>
      <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--background)] flex justify-end">
        <Button onClick={save} disabled={!dirty || update.isPending}><Save className="w-4 h-4 mr-2" /> {update.isPending ? "Saving…" : "Save changes"}</Button>
      </div>
    </Panel>
  );
}

function PasswordCard() {
  const [v, setV] = React.useState({ current: "", next: "", confirm: "" });
  const [show, setShow] = React.useState(false);
  const reset = () => setV({ current: "", next: "", confirm: "" });
  const change = useChangePassword({ success: "Password changed. Other devices will be signed out.", onSuccess: reset });
  const rules = [
    { label: `At least ${PASSWORD_MIN_LENGTH} characters`, ok: v.next.length >= PASSWORD_MIN_LENGTH },
    { label: "Includes a letter and a number", ok: /[a-z]/i.test(v.next) && /\d/.test(v.next) },
    { label: "Different from your current password", ok: !!v.next && v.next !== v.current },
    { label: "Both new passwords match", ok: !!v.confirm && v.next === v.confirm },
  ];
  // The checklist mirrors passwordProblem (the shared policy); passwordProblem decides.
  const ready = !!v.current && rules.every((r) => r.ok) && passwordProblem(v.next) === null;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    change.run({ current: v.current, next: v.next });
  };
  const fieldError = (k: keyof typeof v) => change.fieldErrors[k] ?? (k === "next" ? change.fieldErrors.password : undefined);
  const field = (k: keyof typeof v, label: string, autoComplete: string) => (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.85rem] font-bold">{label}</span>
      <input type={show ? "text" : "password"} autoComplete={autoComplete} className={inputClass} value={v[k]} onChange={(e) => setV((p) => ({ ...p, [k]: e.target.value }))} />
      {fieldError(k) && <span className="text-[0.78rem] text-[var(--destructive)]">{fieldError(k)}</span>}
    </label>
  );
  return (
    <Panel title="Password" actions={<button type="button" onClick={() => setShow((s) => !s)} className="text-[0.82rem] font-semibold text-[var(--primary)] flex items-center gap-1">{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}{show ? "Hide" : "Show"} passwords</button>}>
      <form onSubmit={submit}>
        <div className="p-6 grid grid-cols-[1fr_260px] gap-6">
          <div className="flex flex-col gap-4">
            {field("current", "Current password", "current-password")}
            {field("next", "New password", "new-password")}
            {field("confirm", "Confirm new password", "new-password")}
          </div>
          <div className="rounded-lg bg-[var(--background)] border border-[var(--border)] p-4 self-start">
            <div className="text-[0.8rem] font-bold mb-2">Your new password needs</div>
            <ul className="m-0 p-0 list-none flex flex-col gap-2 text-[0.83rem]" aria-label="Password rules">
              {rules.map((r) => (
                <li key={r.label} className={cn("flex items-center gap-2", r.ok ? "text-[var(--success)]" : "text-[var(--muted-foreground)]")}>
                  {r.ok ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4" />}{r.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--background)] flex justify-end">
          <Button type="submit" disabled={!ready || change.isPending}><KeyRound className="w-4 h-4 mr-2" /> {change.isPending ? "Changing…" : "Change password"}</Button>
        </div>
      </form>
    </Panel>
  );
}
