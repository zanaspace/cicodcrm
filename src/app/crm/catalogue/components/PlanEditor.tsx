"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Archive, EyeOff, Rocket, RotateCcw, Save, Plus, Tag, ListChecks, Banknote, Gift, ClipboardCheck, SearchX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RowActionsMenu } from "@/components/ui/RowActionsMenu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { CURRENT_USER, daysFromToday, formatDate } from "@/lib/format";
import {
  BILLING_MODEL_LABEL, PRODUCTS, addFeature, bundlesUsingPlan, plansStore, pricingGaps, productByCode, upsertPlan,
  useBundles, useFeatures, usePlans, type Plan,
} from "@/lib/mock/catalogue";
import {
  BillingModelPicker, Card, Field, OfferPreview, PriceSummary, PricingMatrix, Readiness, Stepper, SwitchRow, inputClass,
  type ReadinessCheck,
} from "./editor";

const STEPS = ["Basics", "Features", "Pricing", "Trial & extras", "Review & publish"];

const normalise = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "").replace(/(one|1)$/, "");

function nextCode(productCode: string) {
  const nums = plansStore.get().filter((p) => p.productCode === productCode).map((p) => Number(p.code.replace(/\D/g, "")) || 0);
  return `${productCode}${String(Math.max(0, ...nums) + 1).padStart(3, "0")}`;
}

function blankPlan(productCode: string): Plan {
  return {
    code: nextCode(productCode), productCode, name: "", tenantType: "MERCHANT", billingModel: "PER_USER",
    prices: [], featureIds: [], trialDays: 0, recommended: false, priority: 5, status: "Draft", customers: 0,
    updatedAt: daysFromToday(0), updatedBy: CURRENT_USER,
  };
}

export function PlanEditor({ code, productCode }: { code: string; productCode?: string }) {
  const plans = usePlans();
  const isNew = code === "new";
  const original = isNew ? undefined : plans.find((p) => p.code === code);

  if (!isNew && !original) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-3 py-24 border border-dashed border-[var(--border)] rounded-xl bg-[var(--card)]">
        <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center"><SearchX className="w-5 h-5 text-[var(--primary)]" /></div>
        <p className="font-heading font-bold text-[1.1rem] m-0">No plan with code “{code}”</p>
        <Link href="/crm/catalogue"><Button variant="outline">Back to Products & Plans</Button></Link>
      </div>
    );
  }
  // Keyed so switching between plans starts from fresh state.
  return <PlanForm key={code} original={original} initial={original ?? blankPlan(PRODUCTS.find((p) => p.code === productCode)?.code ?? PRODUCTS[0].code)} />;
}

function PlanForm({ original, initial }: { original?: Plan; initial: Plan }) {
  const router = useRouter();
  const plans = usePlans();
  const bundles = useBundles();
  const features = useFeatures();
  const isNew = !original;

  const [plan, setPlan] = React.useState<Plan>(initial);
  const [step, setStep] = React.useState(isNew ? 0 : 4);
  const [maxReached, setMaxReached] = React.useState(isNew ? 0 : STEPS.length - 1);
  const [trialOn, setTrialOn] = React.useState(initial.trialDays > 0);
  const [newFeature, setNewFeature] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [confirm, setConfirm] = React.useState<null | "publish" | "save-live" | "unpublish" | "archive">(null);

  const set = <K extends keyof Plan>(k: K, v: Plan[K]) => { setPlan((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };
  const product = productByCode(plan.productCode)!;
  const productFeatures = features.filter((f) => f.productCode === plan.productCode);
  const selectedFeatureNames = productFeatures.filter((f) => plan.featureIds.includes(f.id)).map((f) => f.name);
  const usedBy = bundlesUsingPlan(bundles, plan.code);
  const dirty = JSON.stringify({ ...plan, trialDays: trialOn ? plan.trialDays : 0 }) !== JSON.stringify(initial);

  const codeTaken = plans.some((p) => p.code === plan.code && p.code !== original?.code);
  const similar = plans.find((p) => p.productCode === plan.productCode && p.code !== original?.code && p.status !== "Archived" && plan.name && normalise(p.name) === normalise(plan.name));
  const gaps = pricingGaps(plan.prices);
  const hasNgnMonthly = plan.prices.some((p) => p.currency === "NGN" && p.period === "MONTHLY" && p.amount > 0);

  const checks: ReadinessCheck[] = [
    { label: "Name and a unique code", ok: !!plan.name.trim() && !!plan.code.trim() && !codeTaken },
    { label: "At least one feature", ok: plan.featureIds.length > 0 },
    { label: "Monthly price in NGN", ok: hasNgnMonthly },
    ...(trialOn ? [{ label: "Trial length set", ok: plan.trialDays > 0 }] : []),
    ...gaps.map((g) => ({ label: g, ok: false, warn: true })),
    ...(similar ? [{ label: `Similar to the existing “${similar.name}” plan (${similar.code})`, ok: false, warn: true }] : []),
  ];
  const canPublish = checks.every((c) => c.ok || c.warn);

  const validateBasics = () => {
    const e: Record<string, string> = {};
    if (!plan.name.trim()) e.name = "Give the plan a name customers will see";
    if (!/^[A-Z0-9-]{3,20}$/.test(plan.code)) e.code = "3–20 capital letters, numbers or dashes";
    else if (codeTaken) e.code = `${plan.code} is already used`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const go = (i: number) => {
    if (i > step && step === 0 && !validateBasics()) return;
    setStep(i);
    setMaxReached((m) => Math.max(m, i));
  };

  const commit = (status: Plan["status"], message: string) => {
    const saved: Plan = { ...plan, name: plan.name.trim(), trialDays: trialOn ? plan.trialDays : 0, status, updatedAt: daysFromToday(0), updatedBy: CURRENT_USER };
    upsertPlan(saved);
    setConfirm(null);
    toast.success(message);
    if (status === "Live" || status === "Archived") router.push(`/crm/catalogue?product=${saved.productCode}`);
    else if (isNew) router.replace(`/crm/catalogue/plans/${saved.code}`);
  };

  const saveDraft = () => { if (validateBasics()) commit("Draft", isNew ? `Draft “${plan.name}” saved` : "Draft saved"); else setStep(0); };

  /* ---------------- Header ---------------- */
  const status = original?.status ?? "Draft";
  const primary =
    status === "Live" ? <Button onClick={() => setConfirm("save-live")} disabled={!dirty || !canPublish}><Save className="w-4 h-4 mr-2" /> Save changes</Button>
    : status === "Archived" ? <Button onClick={() => commit("Draft", "Restored as a draft")}><RotateCcw className="w-4 h-4 mr-2" /> Restore as draft</Button>
    : <Button onClick={() => (validateBasics() ? setConfirm("publish") : setStep(0))} disabled={!canPublish} title={canPublish ? undefined : "Finish the checklist first"}><Rocket className="w-4 h-4 mr-2" /> Publish</Button>;

  const archiveBlocked = plan.customers > 0 || usedBy.length > 0;

  return (
    <div className="max-w-[1600px] w-full mx-auto flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <Link href={`/crm/catalogue?product=${plan.productCode}`} className="inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-2">
            <ArrowLeft className="w-4 h-4" /> {product.name}
          </Link>
          <h1 className="text-2xl font-heading font-extrabold m-0 flex items-center gap-3">
            {isNew ? "New plan" : original!.name}
            {!isNew && <StatusBadge status={status} />}
            {dirty && <span className="text-[0.75rem] font-semibold text-[var(--accent-foreground)] bg-[var(--accent)] px-2 py-0.5 rounded-full">Unsaved changes</span>}
          </h1>
          <p className="text-[0.85rem] text-[var(--muted-foreground)] mt-1.5 mb-0">
            {isNew ? `Plans start as drafts. Nobody can subscribe until you publish.` : <>Code <span className="font-mono">{original!.code}</span> · {original!.customers.toLocaleString()} customers · used in {usedBy.length} bundle{usedBy.length === 1 ? "" : "s"} · last updated {formatDate(original!.updatedAt)} by {original!.updatedBy}</>}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 pt-7">
          {status !== "Archived" && status !== "Live" && <Button variant="outline" onClick={saveDraft}><Save className="w-4 h-4 mr-2" /> Save draft</Button>}
          {primary}
          {!isNew && status !== "Archived" && (
            <RowActionsMenu
              label="More plan actions"
              triggerClassName="w-10 h-10"
              actions={[
                ...(status === "Live" ? [{ label: "Unpublish (back to draft)", icon: EyeOff, onSelect: () => setConfirm("unpublish") }] : []),
                { label: "Archive plan", icon: Archive, danger: true, disabled: archiveBlocked, hint: archiveBlocked ? "Customers or bundles still use this plan" : undefined, onSelect: () => setConfirm("archive") },
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
                <Field label="Product" required hint={isNew ? undefined : "A plan can't move to another product."}>
                  {isNew ? (
                    <Select options={PRODUCTS.map((p) => p.name)} value={product.name} onChange={(n) => { const pc = PRODUCTS.find((p) => p.name === n)!.code; setPlan((p) => ({ ...p, productCode: pc, code: nextCode(pc), featureIds: [] })); }} ariaLabel="Product" />
                  ) : (
                    <input className={inputClass} value={product.name} disabled />
                  )}
                </Field>
                <Field label="Tenant type" hint="All plans are sold to merchants today.">
                  <input className={inputClass} value="Merchant" disabled />
                </Field>
                <Field label="Plan name" required error={errors.name} hint="Shown to customers on the pricing page.">
                  <input className={inputClass} value={plan.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Growth" autoFocus={isNew} />
                </Field>
                <Field label="Plan code" required error={errors.code} hint={isNew ? "Suggested automatically. Used on invoices." : "Codes can't change after creation."}>
                  <input className={cn(inputClass, "font-mono")} value={plan.code} onChange={(e) => set("code", e.target.value.toUpperCase())} disabled={!isNew} />
                </Field>
                <Field label="How is it billed?" required className="col-span-2" group>
                  <BillingModelPicker value={plan.billingModel} onChange={(m) => set("billingModel", m)} disabled={!isNew && plan.customers > 0} />
                </Field>
              </div>
            </Card>
          )}

          {step === 1 && (
            <Card title={`Features from ${product.name}`} icon={ListChecks}
              actions={<span className="text-[0.8rem] text-[var(--muted-foreground)]">{plan.featureIds.length} of {productFeatures.length} selected</span>}>
              <div className="flex gap-3 mb-4 text-[0.8rem] font-semibold">
                <button type="button" className="text-[var(--primary)]" onClick={() => set("featureIds", productFeatures.map((f) => f.id))}>Select all</button>
                <button type="button" className="text-[var(--muted-foreground)]" onClick={() => set("featureIds", [])}>Clear</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {productFeatures.map((f) => {
                  const on = plan.featureIds.includes(f.id);
                  return (
                    <label key={f.id} className={cn("flex items-center gap-3 p-3 rounded-lg border-[1.5px] cursor-pointer transition-colors", on ? "border-[var(--primary)] bg-[var(--accent)]" : "border-[var(--border)] hover:border-[var(--primary)]/50")}>
                      <input type="checkbox" checked={on} onChange={() => set("featureIds", on ? plan.featureIds.filter((x) => x !== f.id) : [...plan.featureIds, f.id])} className="w-4 h-4 accent-[var(--primary)]" />
                      <span className="text-[0.88rem]">{f.name}</span>
                    </label>
                  );
                })}
              </div>
              <form
                className="mt-5 flex gap-3"
                onSubmit={(e) => { e.preventDefault(); if (!newFeature.trim()) return; const f = addFeature(plan.productCode, newFeature.trim()); set("featureIds", [...plan.featureIds, f.id]); setNewFeature(""); toast.success("Feature added to the product"); }}
              >
                <input className={inputClass} value={newFeature} onChange={(e) => setNewFeature(e.target.value)} placeholder={`Add a new ${product.name} feature`} aria-label="New feature" />
                <Button type="submit" variant="outline" disabled={!newFeature.trim()}><Plus className="w-4 h-4 mr-1" /> Add</Button>
              </form>
            </Card>
          )}

          {step === 2 && (
            <Card title="Pricing" icon={Banknote} actions={<span className="text-[0.8rem] text-[var(--muted-foreground)]">{BILLING_MODEL_LABEL[plan.billingModel]}</span>}>
              <p className="text-[0.85rem] text-[var(--muted-foreground)] mt-0 mb-4">Leave a cell empty if this plan isn’t sold in that currency or period. NGN monthly is required.</p>
              <PricingMatrix prices={plan.prices} onChange={(p) => set("prices", p)} model={plan.billingModel} />
              {plan.customers > 0 && <p className="mt-4 mb-0 text-[0.82rem] text-[var(--info)]">Existing customers keep their current price until their next renewal.</p>}
            </Card>
          )}

          {step === 3 && (
            <Card title="Trial & extras" icon={Gift}>
              <div className="flex flex-col gap-4">
                <SwitchRow title="Free trial" description="New customers can try the plan before paying." checked={trialOn} onChange={(v) => { setTrialOn(v); if (v && !plan.trialDays) set("trialDays", 30); }} />
                {trialOn && (
                  <div className="flex items-center gap-2 pl-4">
                    {[7, 14, 30].map((d) => (
                      <button key={d} type="button" onClick={() => set("trialDays", d)} className={cn("px-4 h-9 rounded-full border-[1.5px] text-[0.85rem] font-semibold", plan.trialDays === d ? "border-[var(--primary)] bg-[var(--accent)] text-[var(--accent-foreground)]" : "border-[var(--border)]")}>{d} days</button>
                    ))}
                    <input type="number" min={1} max={90} aria-label="Custom trial days" className={cn(inputClass, "w-24")} value={plan.trialDays} onChange={(e) => set("trialDays", Math.max(0, Number(e.target.value)))} />
                  </div>
                )}
                <SwitchRow title="Recommended plan" description="Highlighted on the pricing page. Only one plan per product should be recommended." checked={plan.recommended} onChange={(v) => set("recommended", v)} />
                <Field label="Display order" hint="Lower numbers appear first on the pricing page.">
                  <input type="number" min={1} className={cn(inputClass, "w-32")} value={plan.priority} onChange={(e) => set("priority", Number(e.target.value))} />
                </Field>
              </div>
            </Card>
          )}

          {step === 4 && (
            <Card title="Review" icon={ClipboardCheck}>
              <dl className="grid grid-cols-[180px_1fr] gap-y-4 text-[0.9rem] m-0">
                <ReviewRow label="Plan" onEdit={() => go(0)}>{plan.name || "—"} <span className="font-mono text-[var(--muted-foreground)]">({plan.code})</span> · {product.name}</ReviewRow>
                <ReviewRow label="Billing">{BILLING_MODEL_LABEL[plan.billingModel]}</ReviewRow>
                <ReviewRow label="Features" onEdit={() => go(1)}>{selectedFeatureNames.length ? selectedFeatureNames.join(", ") : "None selected"}</ReviewRow>
                <ReviewRow label="Prices" onEdit={() => go(2)}><PriceSummary prices={plan.prices} model={plan.billingModel} /></ReviewRow>
                <ReviewRow label="Trial" onEdit={() => go(3)}>{trialOn && plan.trialDays ? `${plan.trialDays} days` : "No trial"}{plan.recommended ? " · Recommended" : ""} · Display order {plan.priority}</ReviewRow>
                {usedBy.length > 0 && <ReviewRow label="Used in bundles">{usedBy.map((b) => b.name).join(", ")}</ReviewRow>}
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
          <OfferPreview eyebrow={product.name} name={plan.name} prices={plan.prices} model={plan.billingModel} features={selectedFeatureNames} trialDays={trialOn ? plan.trialDays : 0} recommended={plan.recommended} />
          <Readiness checks={checks} />
        </aside>
      </div>

      <ConfirmDialog
        isOpen={confirm === "publish"}
        onClose={() => setConfirm(null)}
        onConfirm={() => commit("Live", `“${plan.name}” is live`)}
        icon={<Rocket className="w-6 h-6" />}
        title={`Publish “${plan.name}”?`}
        description="The plan becomes available to new customers straight away."
        impact={[`Shown on the public pricing page for ${product.name}`, "Ops can assign it when creating customers", ...gaps.map((g) => `Heads-up: ${g}`)]}
        confirmLabel="Publish plan"
      />
      <ConfirmDialog
        isOpen={confirm === "save-live"}
        onClose={() => setConfirm(null)}
        onConfirm={() => commit("Live", "Live plan updated")}
        icon={<Save className="w-6 h-6" />}
        title="Update a live plan?"
        description="Changes apply to the pricing page immediately."
        impact={[`${plan.customers.toLocaleString()} existing customers keep their current price until renewal`, ...(usedBy.length ? [`${usedBy.length} bundle${usedBy.length === 1 ? "" : "s"} include this plan: ${usedBy.map((b) => b.name).join(", ")}`] : [])]}
        confirmLabel="Save changes"
      />
      <ConfirmDialog
        isOpen={confirm === "unpublish"}
        onClose={() => setConfirm(null)}
        onConfirm={() => commit("Draft", "Plan unpublished")}
        tone="danger"
        icon={<EyeOff className="w-6 h-6" />}
        title={`Unpublish “${plan.name}”?`}
        description="New customers can't choose it any more. Existing customers keep it."
        impact={[`Removed from the ${product.name} pricing page`]}
        confirmLabel="Unpublish"
      />
      <ConfirmDialog
        isOpen={confirm === "archive"}
        onClose={() => setConfirm(null)}
        onConfirm={() => commit("Archived", "Plan archived")}
        tone="danger"
        icon={<Archive className="w-6 h-6" />}
        title={`Archive “${plan.name}”?`}
        description="Archived plans are hidden everywhere. You can restore them as a draft later."
        confirmLabel="Archive plan"
      />
    </div>
  );
}

function ReviewRow({ label, onEdit, children }: { label: string; onEdit?: () => void; children: React.ReactNode }) {
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
