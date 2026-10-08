"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { daysFromToday, formatMoney, formatPhone, toE164 } from "@/lib/format";
import { addCustomer, customersStore, type Contact } from "@/lib/mock/customers";
import { useCountries, useSectors } from "@/lib/mock/settings";
import {
  BILLING_MODEL_LABEL, BUNDLE_GROUPS, PERIOD_LABEL, PRODUCTS, productByCode, unitLabel, useBundles, usePlans,
  type Period,
} from "@/lib/mock/catalogue";

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-fill fields, e.g. when converting a lead. */
  prefill?: Partial<typeof EMPTY>;
  /** Called with the new customer before the page navigates to it. */
  onCreated?: (customer: { cicod: string; company: string }) => void;
}

const STEPS = ["Business", "Primary contact", "Plan", "Review"];

const EMPTY = {
  company: "", domain: "", sector: "", businessType: "", country: "Nigeria", state: "", address: "",
  contactName: "", contactEmail: "", contactPhone: "", contactRole: "Admin" as Contact["role"],
  offeringKind: "bundle" as "bundle" | "plan", groupOrProduct: "", code: "", period: "MONTHLY" as Period, users: 1, startTrial: true,
};

const inputClass = "w-full h-10 px-3 rounded-md border-[1.5px] border-[var(--input)] bg-[var(--background)] text-[0.9rem] focus:outline-none focus:border-[var(--ring)]";

export function AddCustomerModal({ isOpen, onClose, prefill, onCreated }: AddCustomerModalProps) {
  const router = useRouter();
  const SECTORS = useSectors();
  const COUNTRIES = useCountries();
  const plans = usePlans();
  const bundles = useBundles();
  const [step, setStep] = useState(1);
  const [v, setV] = useState(() => initialValues(prefill));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof EMPTY>(k: K, value: (typeof EMPTY)[K]) => {
    setV((prev) => ({ ...prev, [k]: value }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const domainTaken = !!v.domain && customersStore.get().some((c) => c.domain === v.domain);

  // Offerings the customer can actually be sold: live bundles in a group, or live plans of a product.
  const groupOptions = v.offeringKind === "bundle" ? BUNDLE_GROUPS.map((g) => g.name) : PRODUCTS.map((p) => p.name);
  const choices = v.offeringKind === "bundle"
    ? bundles.filter((b) => b.status === "Live" && BUNDLE_GROUPS.find((g) => g.key === b.groupKey)?.name === v.groupOrProduct)
    : plans.filter((p) => p.status === "Live" && productByCode(p.productCode)?.name === v.groupOrProduct);
  const chosen = choices.find((c) => c.code === v.code);
  const chosenPrice = chosen?.prices.find((p) => p.currency === "NGN" && p.period === v.period) ?? chosen?.prices.find((p) => p.currency === "NGN");
  const seats = chosen?.billingModel === "PER_USER" ? v.users : 1;
  const trialDays = chosen?.trialDays ?? 0;

  const validate = () => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!v.company.trim()) e.company = "Company name is required";
      if (!/^[a-z0-9-]{3,30}$/.test(v.domain)) e.domain = "3–30 lowercase letters, numbers or dashes";
      else if (domainTaken) e.domain = `${v.domain}.cicod.com is already taken`;
      if (!v.sector) e.sector = "Choose a sector";
      if (!v.state) e.state = "Choose a state";
    }
    if (step === 2) {
      if (!v.contactName.trim()) e.contactName = "Contact name is required";
      if (!/^\S+@\S+\.\S+$/.test(v.contactEmail)) e.contactEmail = "Enter a valid email";
      if (v.contactPhone && !toE164(v.contactPhone)) e.contactPhone = "Use a Nigerian mobile number, e.g. 0803 123 4567";
    }
    if (step === 3) {
      if (!v.groupOrProduct) e.groupOrProduct = "Choose one";
      if (!v.code) e.code = "Pick a bundle or plan";
      if (chosen && chosen.billingModel === "PER_USER" && (v.users < 1 || ("minUsers" in chosen && v.users < chosen.minUsers))) e.users = "Not enough users for this bundle";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const reset = () => { setStep(1); setV(initialValues(prefill)); setErrors({}); setSaving(false); };
  const close = () => { if (saving) return; onClose(); setTimeout(reset, 300); };

  const create = () => {
    setSaving(true);
    setTimeout(() => {
      const phone = toE164(v.contactPhone) ?? "";
      const trial = v.startTrial && trialDays > 0;
      const customer = addCustomer({
        company: v.company.trim(), domain: v.domain, status: "Active", sector: v.sector, businessType: v.businessType || "General",
        email: v.contactEmail, phone, country: v.country, state: v.state, address: v.address,
        lifecycle: "contact_added", createdAt: daysFromToday(0),
        contacts: [{ name: v.contactName.trim(), email: v.contactEmail, phone, role: v.contactRole }],
        subscription: {
          kind: v.offeringKind, code: v.code, period: v.period, currency: "NGN", users: v.users,
          startedAt: daysFromToday(0), renewsAt: daysFromToday(trial ? trialDays : v.period === "ANNUALLY" ? 365 : 30),
          trialEndsAt: trial ? daysFromToday(trialDays) : null, lastPaymentAt: null, addOns: [],
        },
      });
      onCreated?.(customer);
      toast.success(`${customer.company} created. Onboarding has started.`);
      onClose();
      reset();
      router.push(`/crm/customer-mgt/customers/${customer.cicod}`);
    }, 700);
  };

  const footer = (
    <div className="flex w-full items-center justify-between">
      <span className="text-[0.8rem] text-[var(--muted-foreground)]">Step {step} of {STEPS.length}</span>
      <div className="flex gap-3">
        <Button variant="outline" onClick={step === 1 ? close : () => setStep((s) => s - 1)} disabled={saving}>{step === 1 ? "Cancel" : "Back"}</Button>
        {step < STEPS.length ? (
          <Button onClick={() => validate() && setStep((s) => s + 1)}>Continue</Button>
        ) : (
          <Button onClick={create} disabled={saving} className="min-w-[150px]">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating…</> : "Create customer"}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={close} title="New customer" maxWidth="max-w-3xl" footer={footer}>
      {/* Stepper */}
      <ol className="flex items-center gap-3 mb-8">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const state = n < step ? "done" : n === step ? "current" : "todo";
          return (
            <li key={label} className="flex-1 flex flex-col gap-2">
              <div className={cn("h-1.5 rounded-full transition-colors duration-300", state === "todo" ? "bg-[var(--border)]" : "bg-[var(--primary)]")} />
              <span className={cn("text-[0.78rem] font-heading font-semibold flex items-center gap-1", state === "todo" ? "text-[var(--muted-foreground)]" : "text-[var(--foreground)]")}>
                {state === "done" && <Check className="w-3.5 h-3.5 text-[var(--success)]" />}{label}
              </span>
            </li>
          );
        })}
      </ol>

      {step === 1 && (
        <div className="grid grid-cols-2 gap-5">
          <Field label="Company name" required error={errors.company}>
            <input className={inputClass} value={v.company} onChange={(e) => { set("company", e.target.value); if (!v.domain || v.domain === slug(v.company)) set("domain", slug(e.target.value)); }} placeholder="e.g. Obiora Ventures" />
          </Field>
          <Field label="Workspace domain" required error={errors.domain} hint={!errors.domain && v.domain ? (domainTaken ? undefined : `${v.domain}.cicod.com is available`) : undefined}>
            <div className="flex items-center">
              <input className={cn(inputClass, "rounded-r-none")} value={v.domain} onChange={(e) => set("domain", e.target.value.toLowerCase())} placeholder="obiora" />
              <span className="h-10 px-3 flex items-center rounded-r-md border-[1.5px] border-l-0 border-[var(--input)] bg-[var(--muted)] text-[0.85rem] text-[var(--muted-foreground)]">.cicod.com</span>
            </div>
          </Field>
          <Field label="Sector" required error={errors.sector}>
            <Select options={Object.keys(SECTORS)} value={v.sector} onChange={(s) => { set("sector", s); set("businessType", ""); }} placeholder="Select sector" searchable invalid={!!errors.sector} ariaLabel="Sector" />
          </Field>
          <Field label="Business type">
            <Select options={SECTORS[v.sector] ?? []} value={v.businessType} onChange={(s) => set("businessType", s)} placeholder={v.sector ? "Select business type" : "Choose a sector first"} ariaLabel="Business type" />
          </Field>
          <Field label="Country" required>
            <Select options={Object.keys(COUNTRIES)} value={v.country} onChange={(c) => { set("country", c); set("state", ""); }} searchable ariaLabel="Country" />
          </Field>
          <Field label="State" required error={errors.state}>
            <Select options={COUNTRIES[v.country] ?? []} value={v.state} onChange={(s) => set("state", s)} placeholder="Select state" searchable invalid={!!errors.state} ariaLabel="State" />
          </Field>
          <Field label="Address" full>
            <input className={inputClass} value={v.address} onChange={(e) => set("address", e.target.value)} placeholder="Building number, street and area" />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-2 gap-5">
          <Field label="Full name" required error={errors.contactName}>
            <input className={inputClass} value={v.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="e.g. Obiora Lebechukwu" />
          </Field>
          <Field label="Role">
            <Select options={["Admin", "Technical", "Billing"]} value={v.contactRole} onChange={(r) => set("contactRole", r as Contact["role"])} ariaLabel="Role" />
          </Field>
          <Field label="Email" required error={errors.contactEmail} hint="Receives the workspace invitation">
            <input type="email" className={inputClass} value={v.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} placeholder="name@company.com" />
          </Field>
          <Field label="Phone" error={errors.contactPhone} hint={toE164(v.contactPhone) ? `Saved as ${formatPhone(toE164(v.contactPhone)!)}` : undefined}>
            <div className="flex items-center">
              <span className="h-10 px-3 flex items-center rounded-l-md border-[1.5px] border-r-0 border-[var(--input)] bg-[var(--muted)] text-[0.85rem] text-[var(--muted-foreground)]">🇳🇬 +234</span>
              <input inputMode="tel" className={cn(inputClass, "rounded-l-none")} value={v.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="803 123 4567" />
            </div>
          </Field>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center bg-[var(--muted)] p-1.5 rounded-lg w-max gap-1" role="tablist">
            {(["bundle", "plan"] as const).map((k) => (
              <button key={k} role="tab" aria-selected={v.offeringKind === k} onClick={() => { set("offeringKind", k); set("groupOrProduct", ""); set("code", ""); }}
                className={cn("px-5 py-2 rounded-md font-heading font-semibold text-[0.85rem] transition-all", v.offeringKind === k ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]")}>
                {k === "bundle" ? "Bundle" : "Single product"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Field label={v.offeringKind === "bundle" ? "Bundle group" : "Product"} required error={errors.groupOrProduct}>
              <Select options={groupOptions} value={v.groupOrProduct} onChange={(g) => { set("groupOrProduct", g); set("code", ""); }} placeholder="Select…" invalid={!!errors.groupOrProduct} ariaLabel="Bundle group or product" />
            </Field>
            <Field label="Billing period" required>
              <Select options={["Monthly", "Annually"]} value={PERIOD_LABEL[v.period]} onChange={(p) => set("period", p === "Annually" ? "ANNUALLY" : "MONTHLY")} ariaLabel="Billing period" />
            </Field>
          </div>

          {v.groupOrProduct && (
            <div className="flex flex-col gap-2">
              <span className="text-[0.85rem] font-bold text-[var(--foreground)]">{v.offeringKind === "bundle" ? "Bundle" : "Plan"} <span className="text-[var(--destructive)]">*</span></span>
              {choices.length === 0 ? (
                <p className="text-[0.85rem] text-[var(--muted-foreground)]">Nothing live in this {v.offeringKind === "bundle" ? "group" : "product"} yet.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3" role="radiogroup">
                  {choices.map((c) => {
                    const p = c.prices.find((x) => x.currency === "NGN" && x.period === v.period) ?? c.prices[0];
                    const selected = v.code === c.code;
                    return (
                      <button key={c.code} role="radio" aria-checked={selected} onClick={() => { set("code", c.code); if ("minUsers" in c) set("users", Math.max(v.users, c.minUsers)); }}
                        className={cn("text-left p-4 rounded-xl border-[1.5px] transition-colors", selected ? "border-[var(--primary)] bg-[var(--accent)]" : "border-[var(--border)] hover:border-[var(--primary)]/50 bg-[var(--card)]")}>
                        <div className="flex items-center justify-between">
                          <span className="font-heading font-bold">{c.name}</span>
                          {"recommended" in c && c.recommended && <span className="text-[0.65rem] font-bold uppercase text-[var(--accent-foreground)]">★ Popular</span>}
                        </div>
                        <div className="mt-2 text-[1.05rem] font-heading font-extrabold">{p ? formatMoney(p.amount) : "—"}<span className="text-[0.75rem] font-medium text-[var(--muted-foreground)]">{unitLabel(c.billingModel)}/{v.period === "ANNUALLY" ? "yr" : "mo"}</span></div>
                        <div className="mt-1 text-[0.75rem] text-[var(--muted-foreground)]">{BILLING_MODEL_LABEL[c.billingModel]}{c.trialDays ? ` · ${c.trialDays}-day trial` : ""}</div>
                      </button>
                    );
                  })}
                </div>
              )}
              {errors.code && <span className="text-[0.78rem] text-[var(--destructive)]">{errors.code}</span>}
            </div>
          )}

          {chosen && (
            <div className="grid grid-cols-2 gap-5 items-end">
              {chosen.billingModel === "PER_USER" && (
                <Field label="Number of users" error={errors.users} hint={"minUsers" in chosen ? `${chosen.minUsers}–${chosen.maxUsers} users on this bundle` : undefined}>
                  <input type="number" min={1} className={inputClass} value={v.users} onChange={(e) => set("users", Math.max(1, Number(e.target.value)))} />
                </Field>
              )}
              {trialDays > 0 && (
                <label className="flex items-center gap-3 h-10 cursor-pointer text-[0.9rem]">
                  <input type="checkbox" checked={v.startTrial} onChange={(e) => set("startTrial", e.target.checked)} className="w-4 h-4 accent-[var(--primary)]" />
                  Start with the {trialDays}-day free trial
                </label>
              )}
            </div>
          )}
        </div>
      )}

      {step === 4 && chosen && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 flex flex-col gap-4">
            <Summary title="Business" rows={[["Company", v.company], ["Workspace", `${v.domain}.cicod.com`], ["Sector", [v.sector, v.businessType].filter(Boolean).join(" › ")], ["Location", [v.address, v.state, v.country].filter(Boolean).join(", ")]]} onEdit={() => setStep(1)} />
            <Summary title="Primary contact" rows={[["Name", `${v.contactName} (${v.contactRole})`], ["Email", v.contactEmail], ["Phone", formatPhone(toE164(v.contactPhone) ?? undefined)]]} onEdit={() => setStep(2)} />
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5 flex flex-col gap-3 h-max">
            <span className="text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Subscription</span>
            <div className="font-heading font-bold">{v.groupOrProduct} · {chosen.name}</div>
            <div className="text-[0.85rem] text-[var(--muted-foreground)]">{PERIOD_LABEL[v.period]} · {seats} {chosen.billingModel === "PER_USER" ? `user${seats === 1 ? "" : "s"}` : BILLING_MODEL_LABEL[chosen.billingModel].toLowerCase()}</div>
            <div className="h-px bg-[var(--border)]" />
            <div className="flex justify-between items-baseline">
              <span className="text-[0.85rem] font-bold">{v.startTrial && trialDays ? "After trial" : "First invoice"}</span>
              <span className="font-heading font-extrabold text-[1.1rem]">{chosenPrice ? formatMoney(chosenPrice.amount * seats) : "—"}</span>
            </div>
            {v.startTrial && trialDays > 0 && <span className="text-[0.8rem] text-[var(--info)] font-semibold">Free for {trialDays} days, then billed {PERIOD_LABEL[v.period].toLowerCase()}.</span>}
            <button onClick={() => setStep(3)} className="text-left text-[0.8rem] font-semibold text-[var(--primary)]">Change plan</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 30);

function Field({ label, required, error, hint, full, children }: { label: string; required?: boolean; error?: string; hint?: string; full?: boolean; children: React.ReactNode }) {
  return (
    // Wrapping the control in the <label> ties the text to the input for screen readers and clicks.
    <label className={cn("flex flex-col gap-1.5", full && "col-span-2")}>
      <span className="text-[0.85rem] font-bold text-[var(--foreground)]">{label}{required && <span className="text-[var(--destructive)]"> *</span>}</span>
      {children}
      {error ? <span role="alert" className="text-[0.78rem] text-[var(--destructive)]">{error}</span> : hint ? <span className="text-[0.78rem] text-[var(--muted-foreground)]">{hint}</span> : null}
    </label>
  );
}

function Summary({ title, rows, onEdit }: { title: string; rows: [string, string][]; onEdit: () => void }) {
  return (
    <div className="rounded-xl border border-[var(--border)] p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{title}</span>
        <button onClick={onEdit} className="text-[0.8rem] font-semibold text-[var(--primary)]">Edit</button>
      </div>
      <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-[0.88rem]">
        {rows.map(([k, val]) => (
          <React.Fragment key={k}>
            <dt className="text-[var(--muted-foreground)]">{k}</dt>
            <dd className="font-medium m-0">{val || "—"}</dd>
          </React.Fragment>
        ))}
      </dl>
    </div>
  );
}

/** A converted lead brings its company name, so suggest the domain from it too. */
function initialValues(prefill?: Partial<typeof EMPTY>) {
  return { ...EMPTY, ...prefill, domain: prefill?.domain ?? (prefill?.company ? slug(prefill.company) : "") };
}
