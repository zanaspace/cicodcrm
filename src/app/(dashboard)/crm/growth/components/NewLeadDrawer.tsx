"use client";

import * as React from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { CURRENT_USER, formatPhone, toE164 } from "@/lib/format";
import { OWNERS, SOURCES, type Lead } from "@/lib/mock/growth";
import { useSectorOptions } from "@/features/reference/queries";
import { useCreateLead } from "@/features/growth/queries";
import type { NewLead } from "@/services/growth";

const inputClass = "w-full h-10 px-3 rounded-md border-[1.5px] border-[var(--input)] bg-[var(--background)] text-[0.9rem] focus:outline-none focus:border-[var(--ring)]";

/** A short first form: just enough to start working the lead. Address and the rest live on the lead page. */
export function NewLeadDrawer({ isOpen, onClose, onCreated }: { isOpen: boolean; onClose: () => void; onCreated: (l: Lead) => void }) {
  const create = useCreateLead({
    success: (lead) => `${lead.company} added to leads`,
    onSuccess: (lead) => { onClose(); onCreated(lead); },
  });
  const close = () => { if (!create.isPending) { create.reset(); onClose(); } };
  return (
    <Drawer
      isOpen={isOpen}
      onClose={close}
      title="New lead"
      subtitle="Company and one way to reach them is enough to start."
      footer={<><Button variant="outline" onClick={close} disabled={create.isPending}>Cancel</Button><Button type="submit" form="new-lead-form" disabled={create.isPending}>{create.isPending ? "Saving…" : "Create lead"}</Button></>}
    >
      {isOpen && <NewLeadForm onSubmit={create.run} serverErrors={create.fieldErrors} />}
    </Drawer>
  );
}

function NewLeadForm({ onSubmit, serverErrors }: { onSubmit: (input: NewLead) => void; serverErrors: Record<string, string> }) {
  const [v, setV] = React.useState({ company: "", contact: "", email: "", phone: "", sector: "", source: "", owner: CURRENT_USER, interest: "" });
  const SECTORS = useSectorOptions();
  const [localErrors, setErrors] = React.useState<Record<string, string>>({});
  const errors = { ...serverErrors, ...Object.fromEntries(Object.entries(localErrors).filter(([, m]) => m)) };
  const set = (k: keyof typeof v, val: string) => { setV((p) => ({ ...p, [k]: val })); setErrors((e) => ({ ...e, [k]: "" })); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!v.company.trim()) err.company = "Company is required";
    if (!v.contact.trim()) err.contact = "Contact person is required";
    if (!v.email.trim() && !v.phone.trim()) err.email = "Add an email or a phone number";
    if (v.email && !/^\S+@\S+\.\S+$/.test(v.email)) err.email = "Enter a valid email";
    if (v.phone && !toE164(v.phone)) err.phone = "Use a Nigerian mobile number, e.g. 0803 123 4567";
    if (!v.source) err.source = "Where did this lead come from?";
    setErrors(err);
    if (Object.keys(err).length) return;
    onSubmit({
      company: v.company.trim(), contact: v.contact.trim(), designation: "", email: v.email.trim(), phone: toE164(v.phone) ?? "",
      sector: v.sector || "Others", state: "", source: v.source, owner: v.owner || null, stage: "new",
      interest: v.interest.trim() || "Not stated yet", estMonthly: 0, nextFollowUp: null,
    });
  };

  return (
    <form id="new-lead-form" onSubmit={submit} className="flex flex-col gap-5">
      <F label="Company" required error={errors.company}><input className={inputClass} value={v.company} onChange={(e) => set("company", e.target.value)} placeholder="e.g. Adaeze Stores" /></F>
      <F label="Contact person" required error={errors.contact}><input className={inputClass} value={v.contact} onChange={(e) => set("contact", e.target.value)} placeholder="Full name" /></F>
      <div className="grid grid-cols-2 gap-4">
        <F label="Email" error={errors.email}><input type="email" className={inputClass} value={v.email} onChange={(e) => set("email", e.target.value)} placeholder="name@company.com" /></F>
        <F label="Phone" error={errors.phone} hint={toE164(v.phone) ? `Saved as ${formatPhone(toE164(v.phone)!)}` : undefined}><input inputMode="tel" className={inputClass} value={v.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0803 123 4567" /></F>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <F label="Source" required error={errors.source}><Select options={SOURCES.filter((s) => s.active).map((s) => s.name)} value={v.source} onChange={(s) => set("source", s)} placeholder="Select source" ariaLabel="Source" invalid={!!errors.source} /></F>
        <F label="Owner"><Select options={OWNERS} value={v.owner} onChange={(s) => set("owner", s)} ariaLabel="Owner" /></F>
      </div>
      <F label="Sector"><Select options={Object.keys(SECTORS)} value={v.sector} onChange={(s) => set("sector", s)} placeholder="Select sector" searchable ariaLabel="Sector" /></F>
      <F label="Interested in" hint="Product, bundle or problem they mentioned"><input className={inputClass} value={v.interest} onChange={(e) => set("interest", e.target.value)} placeholder="e.g. Online store and payments" /></F>
    </form>
  );
}

function F({ label, required, error, hint, children }: { label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.85rem] font-bold">{label}{required && <span className="text-[var(--destructive)]"> *</span>}</span>
      {children}
      {error ? <span role="alert" className="text-[0.78rem] text-[var(--destructive)]">{error}</span> : hint ? <span className="text-[0.78rem] text-[var(--muted-foreground)]">{hint}</span> : null}
    </label>
  );
}
