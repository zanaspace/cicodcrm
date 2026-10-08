"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Archive, EyeOff, Rocket, RotateCcw, Save, Tag, Layers, Banknote, Gauge, ClipboardCheck, SearchX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RowActionsMenu } from "@/components/ui/RowActionsMenu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { CURRENT_USER, daysFromToday, formatDate, formatMoney } from "@/lib/format";
import {
  BILLING_MODEL_LABEL, BUNDLE_GROUPS, PRODUCTS, bundlesStore, groupByKey, pricingGaps, productByCode, upsertBundle,
  useBundles, usePlans, type Bundle,
} from "@/lib/mock/catalogue";
import {
  BillingModelPicker, Card, Field, OfferPreview, PriceSummary, PricingMatrix, Readiness, Stepper, SwitchRow, inputClass,
  type ReadinessCheck,
} from "./editor";

const STEPS = ["Basics", "Included plans", "Pricing", "Limits & trial", "Review & publish"];

function blankBundle(groupKey: string): Bundle {
  const n = bundlesStore.get().filter((b) => b.groupKey === groupKey).length + 1;
  return {
    code: `${groupKey.toUpperCase()}${String(n).padStart(3, "0")}`, name: "", groupKey, planCodes: [], billingModel: "PER_USER",
    prices: [], minUsers: 1, maxUsers: 10, storageGb: 500, trialDays: 0, status: "Draft", customers: 0,
    updatedAt: daysFromToday(0), updatedBy: CURRENT_USER,
  };
}

export function BundleEditor({ code, groupKey }: { code: string; groupKey?: string }) {
  const bundles = useBundles();
  const isNew = code === "new";
  const original = isNew ? undefined : bundles.find((b) => b.code === code);
  if (!isNew && !original) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-3 py-24 border border-dashed border-[var(--border)] rounded-xl bg-[var(--card)]">
        <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center"><SearchX className="w-5 h-5 text-[var(--primary)]" /></div>
        <p className="font-heading font-bold text-[1.1rem] m-0">No bundle with code “{code}”</p>
        <Link href="/crm/catalogue/bundles"><Button variant="outline">Back to Bundles</Button></Link>
      </div>
    );
  }
  return <BundleForm key={code} original={original} initial={original ?? blankBundle(groupByKey(groupKey ?? "")?.key ?? BUNDLE_GROUPS[0].key)} />;
}

function BundleForm({ original, initial }: { original?: Bundle; initial: Bundle }) {
  const router = useRouter();
  const bundles = useBundles();
  const plans = usePlans();
  const isNew = !original;

  const [b, setB] = React.useState<Bundle>(initial);
  const [step, setStep] = React.useState(isNew ? 0 : 4);
  const [maxReached, setMaxReached] = React.useState(isNew ? 0 : STEPS.length - 1);
  const [trialOn, setTrialOn] = React.useState(initial.trialDays > 0);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [confirm, setConfirm] = React.useState<null | "publish" | "save-live" | "unpublish" | "archive">(null);

  const set = <K extends keyof Bundle>(k: K, v: Bundle[K]) => { setB((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };
  const group = groupByKey(b.groupKey)!;
  const included = b.planCodes.map((c) => plans.find((p) => p.code === c)).filter(Boolean) as typeof plans;
  const includedLabels = included.map((p) => `${productByCode(p.productCode)?.name} · ${p.name}`);
  const dirty = JSON.stringify({ ...b, trialDays: trialOn ? b.trialDays : 0 }) !== JSON.stringify(initial);
  const codeTaken = bundles.some((x) => x.code === b.code && x.code !== original?.code);
  const gaps = pricingGaps(b.prices);
  const ngnMonthly = b.prices.find((p) => p.currency === "NGN" && p.period === "MONTHLY")?.amount;
  const separately = included.reduce((s, p) => s + (p.prices.find((x) => x.currency === "NGN" && x.period === "MONTHLY")?.amount ?? 0), 0);
  const saving = ngnMonthly && separately ? Math.round((1 - ngnMonthly / separately) * 100) : null;

  const checks: ReadinessCheck[] = [
    { label: "Name and a unique code", ok: !!b.name.trim() && !codeTaken },
    { label: "Includes plans from at least two products", ok: included.length >= 2 },
    { label: "Monthly price in NGN", ok: !!ngnMonthly },
    { label: "User limits make sense (min ≤ max)", ok: b.minUsers >= 1 && b.minUsers <= b.maxUsers },
    ...(trialOn ? [{ label: "Trial length set", ok: b.trialDays > 0 }] : []),
    ...gaps.map((g) => ({ label: g, ok: false, warn: true })),
    ...(saving !== null && saving <= 0 ? [{ label: "Costs more than buying the plans separately", ok: false, warn: true }] : []),
    ...(included.some((p) => p.status !== "Live") ? [{ label: "Includes a plan that isn't live", ok: false, warn: true }] : []),
  ];
  const canPublish = checks.every((c) => c.ok || c.warn);

  const validateBasics = () => {
    const e: Record<string, string> = {};
    if (!b.name.trim()) e.name = "Give the bundle a name";
    if (!/^[A-Z0-9-]{3,24}$/.test(b.code)) e.code = "3–24 capital letters, numbers or dashes";
    else if (codeTaken) e.code = `${b.code} is already used`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const go = (i: number) => { if (i > step && step === 0 && !validateBasics()) return; setStep(i); setMaxReached((m) => Math.max(m, i)); };

  const commit = (status: Bundle["status"], message: string) => {
    const saved: Bundle = { ...b, name: b.name.trim(), trialDays: trialOn ? b.trialDays : 0, status, updatedAt: daysFromToday(0), updatedBy: CURRENT_USER };
    upsertBundle(saved);
    setConfirm(null);
    toast.success(message);
    if (status === "Live" || status === "Archived") router.push("/crm/catalogue/bundles");
    else if (isNew) router.replace(`/crm/catalogue/bundles/${saved.code}`);
  };
  const saveDraft = () => { if (validateBasics()) commit("Draft", isNew ? `Draft “${b.name}” saved` : "Draft saved"); else setStep(0); };

  const status = original?.status ?? "Draft";
  const archiveBlocked = b.customers > 0;
  const primary =
    status === "Live" ? <Button onClick={() => setConfirm("save-live")} disabled={!dirty || !canPublish}><Save className="w-4 h-4 mr-2" /> Save changes</Button>
    : status === "Archived" ? <Button onClick={() => commit("Draft", "Restored as a draft")}><RotateCcw className="w-4 h-4 mr-2" /> Restore as draft</Button>
    : <Button onClick={() => (validateBasics() ? setConfirm("publish") : setStep(0))} disabled={!canPublish}><Rocket className="w-4 h-4 mr-2" /> Publish</Button>;

  return (
    <div className="max-w-[1600px] w-full mx-auto flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <Link href="/crm/catalogue/bundles" className="inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-2">
            <ArrowLeft className="w-4 h-4" /> Bundles
          </Link>
          <h1 className="text-2xl font-heading font-extrabold m-0 flex items-center gap-3">
            {isNew ? "New bundle" : `${group.name} · ${original!.name}`}
            {!isNew && <StatusBadge status={status} />}
            {dirty && <span className="text-[0.75rem] font-semibold text-[var(--accent-foreground)] bg-[var(--accent)] px-2 py-0.5 rounded-full">Unsaved changes</span>}
          </h1>
          <p className="text-[0.85rem] text-[var(--muted-foreground)] mt-1.5 mb-0">
            {isNew ? "Bundles start as drafts. Nobody can subscribe until you publish." : <>Code <span className="font-mono">{original!.code}</span> · {original!.customers.toLocaleString()} customers · last updated {formatDate(original!.updatedAt)} by {original!.updatedBy}</>}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 pt-7">
          {status !== "Archived" && status !== "Live" && <Button variant="outline" onClick={saveDraft}><Save className="w-4 h-4 mr-2" /> Save draft</Button>}
          {primary}
          {!isNew && status !== "Archived" && (
            <RowActionsMenu
              label="More bundle actions"
              triggerClassName="w-10 h-10"
              actions={[
                ...(status === "Live" ? [{ label: "Unpublish (back to draft)", icon: EyeOff, onSelect: () => setConfirm("unpublish") }] : []),
                { label: "Archive bundle", icon: Archive, danger: true, disabled: archiveBlocked, hint: archiveBlocked ? "Customers are still on this bundle" : undefined, onSelect: () => setConfirm("archive") },
              ]}
            />
          )}
        </div>
      </div>

      <Stepper steps={STEPS} current={step} maxReached={maxReached} onGo={go} />

      <div className="grid grid-cols-[1fr_360px] gap-6 items-start">
        <div className="flex flex-col gap-6 min-w-0">
          {step === 0 && (
            <Card title="Basics" icon={Tag}>
              <div className="grid grid-cols-2 gap-5">
                <Field label="Bundle group" required hint="Manage groups in Settings › Catalogue Setup.">
                  <Select options={BUNDLE_GROUPS.map((g) => g.name)} value={group.name} onChange={(n) => set("groupKey", BUNDLE_GROUPS.find((g) => g.name === n)!.key)} ariaLabel="Bundle group" />
                </Field>
                <Field label="Tenant type"><input className={inputClass} value="Merchant" disabled /></Field>
                <Field label="Bundle name" required error={errors.name} hint="Shown to customers.">
                  <input className={inputClass} value={b.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Growth" autoFocus={isNew} />
                </Field>
                <Field label="Bundle code" required error={errors.code} hint={isNew ? "Used on invoices." : "Codes can't change after creation."}>
                  <input className={cn(inputClass, "font-mono")} value={b.code} onChange={(e) => set("code", e.target.value.toUpperCase())} disabled={!isNew} />
                </Field>
                <Field label="How is it billed?" required className="col-span-2" group>
                  <BillingModelPicker value={b.billingModel} onChange={(m) => set("billingModel", m)} disabled={!isNew && b.customers > 0} />
                </Field>
              </div>
            </Card>
          )}

          {step === 1 && (
            <Card title="Included plans" icon={Layers} actions={<span className="text-[0.8rem] text-[var(--muted-foreground)]">One plan per product</span>}>
              <div className="flex flex-col gap-5">
                {PRODUCTS.map((p) => {
                  const options = plans.filter((x) => x.productCode === p.code && x.status === "Live");
                  const chosen = b.planCodes.find((c) => options.some((o) => o.code === c));
                  const pick = (code?: string) => set("planCodes", [...b.planCodes.filter((c) => !options.some((o) => o.code === c)), ...(code ? [code] : [])]);
                  return (
                    <div key={p.code}>
                      <div className="text-[0.85rem] font-bold mb-2">{p.name}</div>
                      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={p.name}>
                        <Chip on={!chosen} onClick={() => pick(undefined)}>Not included</Chip>
                        {options.map((o) => <Chip key={o.code} on={chosen === o.code} onClick={() => pick(o.code)}>{o.name}</Chip>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {step === 2 && (
            <Card title="Bundle price" icon={Banknote} actions={<span className="text-[0.8rem] text-[var(--muted-foreground)]">{BILLING_MODEL_LABEL[b.billingModel]}</span>}>
              <PricingMatrix prices={b.prices} onChange={(p) => set("prices", p)} model={b.billingModel} />
              {separately > 0 && (
                <p className={cn("mt-4 mb-0 text-[0.85rem]", saving !== null && saving <= 0 ? "text-[var(--warning)]" : "text-[var(--muted-foreground)]")}>
                  Bought separately these plans cost {formatMoney(separately)}/month.
                  {saving !== null && (saving > 0 ? <> Customers save <b className="text-[var(--success)]">{saving}%</b>.</> : " The bundle is not cheaper.")}
                </p>
              )}
            </Card>
          )}

          {step === 3 && (
            <Card title="Limits & trial" icon={Gauge}>
              <div className="grid grid-cols-3 gap-5">
                <Field label="Minimum users"><input type="number" min={1} className={inputClass} value={b.minUsers} onChange={(e) => set("minUsers", Number(e.target.value))} /></Field>
                <Field label="Maximum users" error={b.minUsers > b.maxUsers ? "Must be at least the minimum" : undefined}><input type="number" min={1} className={inputClass} value={b.maxUsers} onChange={(e) => set("maxUsers", Number(e.target.value))} /></Field>
                <Field label="Storage (GB)"><input type="number" min={0} className={inputClass} value={b.storageGb} onChange={(e) => set("storageGb", Number(e.target.value))} /></Field>
              </div>
              <div className="mt-5 flex flex-col gap-4">
                <SwitchRow title="Free trial" description="New customers can try the bundle before paying." checked={trialOn} onChange={(v) => { setTrialOn(v); if (v && !b.trialDays) set("trialDays", 30); }} />
                {trialOn && (
                  <div className="flex items-center gap-2 pl-4">
                    {[7, 14, 30].map((d) => (
                      <Chip key={d} on={b.trialDays === d} onClick={() => set("trialDays", d)}>{d} days</Chip>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          {step === 4 && (
            <Card title="Review" icon={ClipboardCheck}>
              <dl className="grid grid-cols-[180px_1fr] gap-y-4 text-[0.9rem] m-0">
                <Row label="Bundle" onEdit={() => go(0)}>{b.name || "—"} <span className="font-mono text-[var(--muted-foreground)]">({b.code})</span> · {group.name}</Row>
                <Row label="Includes" onEdit={() => go(1)}>{includedLabels.length ? includedLabels.join(", ") : "No plans yet"}</Row>
                <Row label="Prices" onEdit={() => go(2)}><PriceSummary prices={b.prices} model={b.billingModel} /></Row>
                <Row label="Limits" onEdit={() => go(3)}>{b.minUsers}–{b.maxUsers} users · {b.storageGb.toLocaleString()} GB · {trialOn && b.trialDays ? `${b.trialDays}-day trial` : "No trial"}</Row>
              </dl>
            </Card>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => go(step - 1)} disabled={step === 0}>Back</Button>
            {step < STEPS.length - 1 && <Button variant="secondary" onClick={() => go(step + 1)}>Continue</Button>}
          </div>
        </div>

        <aside className="flex flex-col gap-4 sticky top-0">
          <span className="text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Pricing page preview</span>
          <OfferPreview eyebrow={group.name} name={b.name} prices={b.prices} model={b.billingModel} features={includedLabels} trialDays={trialOn ? b.trialDays : 0} recommended={false} />
          <Readiness checks={checks} />
        </aside>
      </div>

      <ConfirmDialog isOpen={confirm === "publish"} onClose={() => setConfirm(null)} onConfirm={() => commit("Live", `“${b.name}” is live`)}
        icon={<Rocket className="w-6 h-6" />} title={`Publish “${b.name}”?`} description="The bundle becomes available to new customers straight away."
        impact={[`Shown on the public pricing page under ${group.name}`, `Includes ${includedLabels.join(", ")}`, ...gaps.map((g) => `Heads-up: ${g}`)]} confirmLabel="Publish bundle" />
      <ConfirmDialog isOpen={confirm === "save-live"} onClose={() => setConfirm(null)} onConfirm={() => commit("Live", "Live bundle updated")}
        icon={<Save className="w-6 h-6" />} title="Update a live bundle?" description="Changes apply to the pricing page immediately."
        impact={[`${b.customers.toLocaleString()} existing customers keep their current price until renewal`]} confirmLabel="Save changes" />
      <ConfirmDialog isOpen={confirm === "unpublish"} onClose={() => setConfirm(null)} onConfirm={() => commit("Draft", "Bundle unpublished")} tone="danger"
        icon={<EyeOff className="w-6 h-6" />} title={`Unpublish “${b.name}”?`} description="New customers can't choose it any more. Existing customers keep it." confirmLabel="Unpublish" />
      <ConfirmDialog isOpen={confirm === "archive"} onClose={() => setConfirm(null)} onConfirm={() => commit("Archived", "Bundle archived")} tone="danger"
        icon={<Archive className="w-6 h-6" />} title={`Archive “${b.name}”?`} description="Archived bundles are hidden everywhere. You can restore them as a draft later." confirmLabel="Archive bundle" />
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" role="radio" aria-checked={on} onClick={onClick}
      className={cn("px-4 h-9 rounded-full border-[1.5px] text-[0.85rem] font-semibold transition-colors", on ? "border-[var(--primary)] bg-[var(--accent)] text-[var(--accent-foreground)]" : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)]/50")}>
      {children}
    </button>
  );
}

function Row({ label, onEdit, children }: { label: string; onEdit?: () => void; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-[var(--muted-foreground)] font-semibold">{label}</dt>
      <dd className="m-0 flex items-start justify-between gap-4">
        <div className="min-w-0">{children}</div>
        {onEdit && <button type="button" onClick={onEdit} className="text-[0.8rem] font-semibold text-[var(--primary)] shrink-0">Edit</button>}
      </dd>
    </>
  );
}
