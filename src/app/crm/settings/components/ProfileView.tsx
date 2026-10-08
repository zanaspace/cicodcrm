"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Circle, Eye, EyeOff, KeyRound, Lock, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { CURRENT_USER, formatPhone, toE164 } from "@/lib/format";
import { changePassword, roleName, updateProfile, useAudit, useCurrentUser } from "@/lib/mock/settings";
import { inputClass } from "@/app/crm/catalogue/components/editor";
import { Avatar, Panel, ago, dateTime } from "./shared";

export function ProfileView() {
  const me = useCurrentUser();
  const auditLog = useAudit();
  const mine = auditLog.filter((a) => a.actor === CURRENT_USER).slice(0, 6);

  return (
    <div className="max-w-[1600px] w-full mx-auto">
      <PageHeader title="My profile" subtitle="Your details and password. Your role is set by an admin." />
      <div className="grid grid-cols-[1fr_380px] gap-6 items-start">
        <div className="flex flex-col gap-6 min-w-0">
          <PersonalInfo key={`${me.name}|${me.phone}`} />
          <PasswordCard />
        </div>
        <div className="flex flex-col gap-6">
          <Panel title="Access">
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3"><Avatar name={me.name} /><div><div className="font-heading font-bold">{me.name}</div><div className="text-[0.82rem] text-[var(--muted-foreground)]">{me.email}</div></div></div>
              <dl className="grid grid-cols-[110px_1fr] gap-y-3 text-[0.88rem] m-0">
                <dt className="text-[var(--muted-foreground)]">Role</dt><dd className="m-0 flex items-center gap-2"><Badge variant="secondary">{roleName(me.roleId)}</Badge><Link href={`/crm/settings/roles?role=${me.roleId}`} className="text-[0.8rem] font-semibold text-[var(--primary)]">What it allows</Link></dd>
                <dt className="text-[var(--muted-foreground)]">Status</dt><dd className="m-0"><StatusBadge status="Active" /></dd>
                <dt className="text-[var(--muted-foreground)]">Signed in</dt><dd className="m-0">{ago(me.lastActiveAt)}</dd>
              </dl>
            </div>
          </Panel>
          <Panel title="Your recent changes" actions={<Link href="/crm/settings/audit?person=me" className="text-[0.82rem] font-semibold text-[var(--primary)]">Audit log</Link>}>
            {mine.length === 0 ? <p className="m-0 p-6 text-[0.85rem] text-[var(--muted-foreground)]">Nothing yet.</p> : (
              <ul className="m-0 p-6 list-none flex flex-col gap-3">
                {mine.map((a) => <li key={a.id} className="text-[0.85rem]"><b>{a.action}</b> · {a.target}<span className="block text-[0.78rem] text-[var(--muted-foreground)]">{dateTime(a.at)}</span></li>)}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

/** Keyed by the saved values, so it starts fresh after every save. */
function PersonalInfo() {
  const me = useCurrentUser();
  const [name, setName] = React.useState(me.name);
  const [phone, setPhone] = React.useState(formatPhone(me.phone).replace("+234 ", "0"));
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const e164 = phone.trim() ? toE164(phone) : "";
  const dirty = name.trim() !== me.name || (e164 ?? phone) !== me.phone;

  const save = () => {
    const e: Record<string, string> = {};
    if (name.trim().split(/\s+/).length < 2) e.name = "Enter your first and last name";
    if (e164 === null) e.phone = "Enter a Nigerian mobile number, e.g. 0803 123 4567";
    if (Object.keys(e).length) return setErrors(e);
    updateProfile(me.id, { name: name.trim(), phone: e164 || "" });
    toast.success("Profile saved");
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
        <Button onClick={save} disabled={!dirty}><Save className="w-4 h-4 mr-2" /> Save changes</Button>
      </div>
    </Panel>
  );
}

function PasswordCard() {
  const [v, setV] = React.useState({ current: "", next: "", confirm: "" });
  const [show, setShow] = React.useState(false);
  const rules = [
    { label: "At least 8 characters", ok: v.next.length >= 8 },
    { label: "Includes a letter and a number", ok: /[a-z]/i.test(v.next) && /\d/.test(v.next) },
    { label: "Different from your current password", ok: !!v.next && v.next !== v.current },
    { label: "Both new passwords match", ok: !!v.confirm && v.next === v.confirm },
  ];
  const ready = !!v.current && rules.every((r) => r.ok);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    changePassword();
    setV({ current: "", next: "", confirm: "" });
    toast.success("Password changed. Other devices will be signed out.");
  };
  const field = (k: keyof typeof v, label: string, autoComplete: string) => (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.85rem] font-bold">{label}</span>
      <input type={show ? "text" : "password"} autoComplete={autoComplete} className={inputClass} value={v[k]} onChange={(e) => setV((p) => ({ ...p, [k]: e.target.value }))} />
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
          <Button type="submit" disabled={!ready}><KeyRound className="w-4 h-4 mr-2" /> Change password</Button>
        </div>
      </form>
    </Panel>
  );
}
