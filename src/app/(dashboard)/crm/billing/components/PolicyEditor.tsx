"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Rocket, Save, Trash2, Send, Mail, MessageSquare, Clock, ShieldAlert, Users, SearchX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { ErrorState, LoadingState } from "@/components/feedback/States";
import { cn } from "@/lib/utils";
import { daysFromToday, daysUntil, formatDate } from "@/lib/format";
import { usePermissions } from "@/lib/permissions";
import type { Customer } from "@/lib/mock/customers";
import type { Template } from "@/lib/mock/messaging";
import { BILLING_MODEL_LABEL, type BillingModel } from "@/lib/mock/catalogue";
import {
  billingModelOf, getDunningState, renderTemplate,
  type DunningPolicy, type DunningStep, type Pause, type StepType,
} from "@/lib/mock/billing";
import { usePausesQuery, usePoliciesQuery, useSavePolicy } from "@/features/billing/queries";
import { useCustomersQuery } from "@/features/customers/queries";
import { useTemplatesQuery } from "@/features/messaging/queries";
import { useSessionUser } from "@/features/auth/hooks";
import { NO_EDIT, NO_FULL } from "./actions";
import { Card, Field, Readiness, SwitchRow, inputClass, type ReadinessCheck } from "@/app/(dashboard)/crm/catalogue/components/editor";
import { useBundlesQuery, usePlansQuery } from "@/features/catalogue/queries";
import { Timeline } from "./Timeline";

const MODELS = Object.keys(BILLING_MODEL_LABEL) as BillingModel[];
const STEP_TYPES: StepType[] = ["Reminder", "Warning", "Final notice"];
const NONE = "None";

function blank(by: string, model?: BillingModel, from?: DunningPolicy): DunningPolicy {
  const models = model ? [model] : [];
  return {
    id: `policy-${Date.now()}`,
    name: model ? `${BILLING_MODEL_LABEL[model]} dunning` : "",
    billingModels: models,
    steps: from ? from.steps.map((s) => ({ ...s, id: `${s.id}-${Date.now()}` })) : [{ id: "s1", offsetDays: -7, type: "Reminder", emailTemplate: "em-reminder", smsTemplate: "sms-short" }],
    graceDays: from?.graceDays ?? 3,
    autoSuspend: false,
    skipPaused: true,
    skipPendingTransfers: true,
    status: "Draft",
    updatedAt: daysFromToday(0),
    updatedBy: by,
  };
}

export function PolicyEditor({ id, model, from }: { id: string; model?: string; from?: string }) {
  const user = useSessionUser();
  const policiesQuery = usePoliciesQuery();
  const customersQuery = useCustomersQuery();
  const pausesQuery = usePausesQuery();
  const templatesQuery = useTemplatesQuery();
  // The impact panel, publish confirmation and template pickers all need these, so the editor waits for them.
  const queries = [policiesQuery, customersQuery, pausesQuery, templatesQuery];
  const failed = queries.find((q) => q.isError);
  if (failed) return <ErrorState error={failed.error} onRetry={() => queries.forEach((q) => q.isError && q.refetch())} />;
  if (!policiesQuery.data || !customersQuery.data || !pausesQuery.data || !templatesQuery.data) return <LoadingState rows={8} label="Loading dunning policy" />;

  const policies = policiesQuery.data;
  const isNew = id === "new";
  const original = isNew ? undefined : policies.find((p) => p.id === id);
  if (!isNew && !original) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-3 py-24 border border-dashed border-[var(--border)] rounded-xl bg-[var(--card)]">
        <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center"><SearchX className="w-5 h-5 text-[var(--primary)]" /></div>
        <p className="font-heading font-bold text-[1.1rem] m-0">No dunning policy “{id}”</p>
        <Link href="/crm/billing/dunning"><Button variant="outline">Back to policies</Button></Link>
      </div>
    );
  }
  const source = policies.find((p) => p.id === from);
  const initial = original ?? blank(user?.name ?? "", MODELS.includes(model as BillingModel) ? (model as BillingModel) : undefined, source);
  return <PolicyForm key={id} original={original} initial={initial} policies={policies} customers={customersQuery.data} pauses={pausesQuery.data} templates={templatesQuery.data} />;
}

function PolicyForm({ original, initial, policies, customers, pauses, templates }: {
  original?: DunningPolicy; initial: DunningPolicy; policies: DunningPolicy[]; customers: Customer[]; pauses: Record<string, Pause>; templates: Template[];
}) {
  const catalogue = { plans: usePlansQuery().data ?? [], bundles: useBundlesQuery().data ?? [] };
  const router = useRouter();
  const user = useSessionUser();
  const { can } = usePermissions();
  const canEdit = can("billing", "edit");
  const canFull = can("billing", "full");
  const templateById = (tid?: string) => templates.find((t) => t.id === tid);
  const isNew = !original;
  const [p, setP] = React.useState<DunningPolicy>(initial);
  const [previewStep, setPreviewStep] = React.useState<string>(initial.steps[0]?.id ?? "");
  const [previewChannel, setPreviewChannel] = React.useState<"email" | "sms">("email");
  const [confirm, setConfirm] = React.useState<null | "publish" | "save-live">(null);

  const set = <K extends keyof DunningPolicy>(k: K, v: DunningPolicy[K]) => setP((x) => ({ ...x, [k]: v }));
  const setStep = (sid: string, patch: Partial<DunningStep>) => set("steps", p.steps.map((s) => (s.id === sid ? { ...s, ...patch } : s)));
  const dirty = JSON.stringify(p) !== JSON.stringify(initial);
  const status = original?.status ?? "Draft";

  // Billing models already owned by another live policy can't be claimed twice.
  const takenBy = (m: BillingModel) => policies.find((x) => x.id !== p.id && x.status === "Live" && x.billingModels.includes(m));

  // Impact: run the draft against today's customers.
  const asLive: DunningPolicy = { ...p, status: "Live" };
  const scenario = [...policies.filter((x) => x.id !== p.id), asLive];
  const covered = customers.filter((c) => c.status === "Active" && p.billingModels.includes(billingModelOf(c, catalogue) as BillingModel));
  const states = covered.map((c) => ({ c, s: getDunningState(c, scenario, pauses, catalogue) })).filter((x) => x.s?.policy?.id === p.id);
  const readyToSuspend = states.filter((x) => x.s!.stage === "ready_to_suspend");
  const sample = states[0]?.c ?? covered[0] ?? customers[0];

  const sorted = [...p.steps].sort((a, b) => a.offsetDays - b.offsetDays);
  const offsets = p.steps.map((s) => s.offsetDays);
  const checks: ReadinessCheck[] = [
    { label: "Has a name", ok: !!p.name.trim() },
    { label: "Applies to at least one billing model", ok: p.billingModels.length > 0 },
    { label: "Has at least one step", ok: p.steps.length > 0 },
    { label: "Every step sends email or SMS", ok: p.steps.every((s) => s.emailTemplate || s.smsTemplate) },
    { label: "No two steps on the same day", ok: new Set(offsets).size === offsets.length },
    ...p.steps.flatMap((s) => [s.emailTemplate, s.smsTemplate]).filter((id, i, a) => id && a.indexOf(id) === i).map((id) => templates.find((t) => t.id === id)).filter((t) => t && t.category !== "Billing").map((t) => ({ label: `“${t!.name}” is a ${t!.category} template; its wording may not suit a payment reminder`, ok: false, warn: true })),
    ...(p.steps.some((s) => !s.emailTemplate) ? [{ label: "Some steps are SMS-only: customers without a mobile number get nothing", ok: false, warn: true }] : []),
    ...(p.autoSuspend ? [{ label: `Suspends automatically ${p.graceDays ? `${p.graceDays} days after the due date` : "on the due date"}`, ok: false, warn: true }] : []),
  ];
  const canPublish = checks.every((c) => c.ok || c.warn);

  const save = useSavePolicy({
    // Draft: "Draft saved"; publishing a draft: "... is live"; saving an already-live policy: "Policy updated".
    success: (_, { policy }) => (policy.status === "Draft" ? "Draft saved" : status === "Live" ? "Policy updated" : `“${policy.name}” is live`),
    onSuccess: (saved, { policy }) => {
      setConfirm(null);
      if (policy.status === "Live") router.push("/crm/billing/dunning");
      else if (isNew) router.replace(`/crm/billing/dunning/${saved?.id ?? policy.id}`);
    },
  });
  // Drafts need edit access; anything that makes a policy live (publish, or changing a live one) needs full access.
  const commit = (st: DunningPolicy["status"]) => {
    if (st === "Live" ? !canFull : !canEdit) return;
    save.run({ policy: { ...p, name: p.name.trim(), status: st, updatedAt: daysFromToday(0), updatedBy: user?.name ?? p.updatedBy }, isNew });
  };
  const nameError = save.fieldErrors.name;

  const addStep = () => {
    const last = sorted[sorted.length - 1]?.offsetDays ?? -10;
    const step: DunningStep = { id: `s${Date.now()}`, offsetDays: last + 3, type: last + 3 > 0 ? "Final notice" : "Warning", emailTemplate: "em-warning", smsTemplate: "sms-broadcast" };
    set("steps", [...p.steps, step]);
    setPreviewStep(step.id);
  };

  const selected = p.steps.find((s) => s.id === previewStep) ?? sorted[0];
  const tpl = selected ? templateById(previewChannel === "email" ? selected.emailTemplate : selected.smsTemplate) : undefined;
  const dueDate = sample ? formatDate(sample.subscription.renewsAt) : formatDate(daysFromToday(7));
  const suspendDate = formatDate(daysFromToday((sample ? daysUntil(sample.subscription.renewsAt) : 7) + p.graceDays + 1));

  const tplOptions = (channel: "email" | "sms") => [NONE, ...templates.filter((t) => t.channel === channel).map((t) => t.name)];
  const tplId = (channel: "email" | "sms", name: string) => (name === NONE ? undefined : templates.find((t) => t.channel === channel && t.name === name)?.id);

  return (
    <div className="max-w-[1600px] w-full mx-auto flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <Link href="/crm/billing/dunning" className="inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-2"><ArrowLeft className="w-4 h-4" /> Dunning policies</Link>
          <h1 className="text-2xl font-heading font-extrabold m-0 flex items-center gap-3">
            {isNew ? "New dunning policy" : original!.name}
            {!isNew && <StatusBadge status={status} />}
            {dirty && <span className="text-[0.75rem] font-semibold text-[var(--accent-foreground)] bg-[var(--accent)] px-2 py-0.5 rounded-full">Unsaved changes</span>}
          </h1>
          <p className="text-[0.85rem] text-[var(--muted-foreground)] mt-1.5 mb-0">
            {isNew ? "Policies start as drafts. Nothing is sent until you publish." : `Last updated ${formatDate(original!.updatedAt)} by ${original!.updatedBy}`}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 pt-7">
          <Button variant="outline" onClick={() => toast.success(`Test ${previewChannel === "email" ? "email" : "SMS"} sent to you`)} disabled={!tpl || !canEdit} title={canEdit ? undefined : NO_EDIT}><Send className="w-4 h-4 mr-2" /> Send test to me</Button>
          {status === "Live" ? (
            <Button onClick={() => setConfirm("save-live")} disabled={!canFull || !dirty || !canPublish || save.isPending} title={canFull ? undefined : NO_FULL}>
              <Save className="w-4 h-4 mr-2" /> {save.isPending ? "Saving…" : "Save changes"}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => commit("Draft")} disabled={!canEdit || !p.name.trim() || save.isPending} title={canEdit ? undefined : NO_EDIT}>
                <Save className="w-4 h-4 mr-2" /> {save.isPending && save.variables?.policy.status === "Draft" ? "Saving…" : "Save draft"}
              </Button>
              <Button onClick={() => setConfirm("publish")} disabled={!canFull || !canPublish || save.isPending} title={canFull ? undefined : NO_FULL}><Rocket className="w-4 h-4 mr-2" /> Publish</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_380px] gap-6 items-start">
        <div className="flex flex-col gap-6 min-w-0">
          <Card title="Basics">
            <div className="grid grid-cols-2 gap-5">
              <Field label="Policy name" required error={nameError}><input className={inputClass} value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Per transaction dunning" /></Field>
              <Field label="Applies to billing models" required group hint="A billing model can only have one live policy.">
                <div className="flex flex-wrap gap-2">
                  {MODELS.map((m) => {
                    const on = p.billingModels.includes(m);
                    const owner = takenBy(m);
                    return (
                      <button key={m} type="button" role="checkbox" aria-checked={on} disabled={!!owner && !on} title={owner ? `Covered by ${owner.name}` : undefined}
                        onClick={() => set("billingModels", on ? p.billingModels.filter((x) => x !== m) : [...p.billingModels, m])}
                        className={cn("px-4 h-9 rounded-full border-[1.5px] text-[0.85rem] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed", on ? "border-[var(--primary)] bg-[var(--accent)] text-[var(--accent-foreground)]" : "border-[var(--border)]")}>
                        {BILLING_MODEL_LABEL[m]}{owner && !on ? ` (${owner.name})` : ""}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          </Card>

          <Card title="Timeline" icon={Clock} actions={<Button size="sm" variant="outline" onClick={addStep}><Plus className="w-3.5 h-3.5 mr-1" /> Add step</Button>}>
            <div className="px-6 pb-2"><Timeline steps={p.steps} graceDays={p.graceDays} autoSuspend={p.autoSuspend} /></div>
            <div className="mt-4 flex flex-col gap-3">
              {sorted.map((s) => (
                <div key={s.id} onClick={() => setPreviewStep(s.id)}
                  className={cn("grid grid-cols-[190px_170px_minmax(0,1fr)_36px] gap-3 items-end p-4 rounded-lg border-[1.5px] cursor-pointer", previewStep === s.id ? "border-[var(--primary)] bg-[var(--accent)]/40" : "border-[var(--border)]")}>
                  <Field label="When">
                    <div className="flex items-center gap-1.5">
                      <input type="number" min={0} max={60} aria-label="Days" className={cn(inputClass, "w-16 px-2")} value={Math.abs(s.offsetDays)}
                        onChange={(e) => setStep(s.id, { offsetDays: Math.sign(s.offsetDays || -1) * Math.abs(Number(e.target.value)) })} />
                      <Select ariaLabel="Before or after due date" options={["before", "after"]} value={s.offsetDays <= 0 ? "before" : "after"} className="h-10"
                        onChange={(v) => setStep(s.id, { offsetDays: (v === "before" ? -1 : 1) * Math.max(1, Math.abs(s.offsetDays)) })} />
                    </div>
                  </Field>
                  <Field label="Message type"><Select options={STEP_TYPES} value={s.type} onChange={(v) => setStep(s.id, { type: v as StepType })} ariaLabel="Message type" /></Field>
                  <div className="col-start-3 row-start-1" aria-hidden />
                  <div className="col-span-3 grid grid-cols-2 gap-3">
                  <Field label="Email"><Select options={tplOptions("email")} value={templateById(s.emailTemplate)?.name ?? NONE} onChange={(v) => setStep(s.id, { emailTemplate: tplId("email", v) })} ariaLabel="Email template" /></Field>
                  <Field label="SMS"><Select options={tplOptions("sms")} value={templateById(s.smsTemplate)?.name ?? NONE} onChange={(v) => setStep(s.id, { smsTemplate: tplId("sms", v) })} ariaLabel="SMS template" /></Field>
                  </div>
                  <button type="button" aria-label={`Remove ${s.type} step`} onClick={(e) => { e.stopPropagation(); set("steps", p.steps.filter((x) => x.id !== s.id)); }}
                    className="col-start-4 row-start-1 h-10 w-9 flex items-center justify-center rounded-md text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:bg-[rgba(239,68,68,.08)]">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {p.steps.length === 0 && <p className="m-0 text-[0.88rem] text-[var(--muted-foreground)]">No steps yet. Add at least one reminder.</p>}
            </div>
          </Card>

          <Card title="After the due date" icon={ShieldAlert}>
            <div className="flex flex-col gap-4">
              <Field label="Grace period (days)" hint="Days after the due date before suspension is considered. Customers keep full access during grace.">
                <input type="number" min={0} max={30} className={cn(inputClass, "w-28")} value={p.graceDays} onChange={(e) => set("graceDays", Math.max(0, Math.min(30, Number(e.target.value))))} />
              </Field>
              <SwitchRow title="Suspend automatically" description={p.autoSuspend ? "Customers are suspended when the grace period ends, without review." : "Off: customers wait in Collections › Ready to suspend for a person to decide (recommended)."} checked={p.autoSuspend} onChange={(v) => set("autoSuspend", v)} />
              <SwitchRow title="Skip paused customers" description="Disputes and key accounts paused in Collections get no messages." checked={p.skipPaused} onChange={(v) => set("skipPaused", v)} />
              <SwitchRow title="Skip customers with a pending bank transfer" description="Don't chase someone whose transfer is still clearing." checked={p.skipPendingTransfers} onChange={(v) => set("skipPendingTransfers", v)} />
            </div>
          </Card>
        </div>

        <aside className="flex flex-col gap-4 sticky top-0">
          <section className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between">
              <span className="font-heading font-bold text-[0.9rem]">Message preview{selected ? ` · ${selected.type}` : ""}</span>
              <div className="flex gap-1" role="tablist">
                {(["email", "sms"] as const).map((ch) => (
                  <button key={ch} role="tab" aria-selected={previewChannel === ch} onClick={() => setPreviewChannel(ch)}
                    className={cn("px-2.5 py-1 rounded-full text-[0.75rem] font-semibold flex items-center gap-1", previewChannel === ch ? "bg-[var(--secondary)] text-[var(--secondary-foreground)]" : "text-[var(--muted-foreground)]")}>
                    {ch === "email" ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}{ch === "email" ? "Email" : "SMS"}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5 text-[0.85rem] whitespace-pre-line leading-relaxed min-h-[140px]">
              {tpl ? renderTemplate(tpl.body, sample, { dueDate, suspendDate }, catalogue) : <span className="text-[var(--muted-foreground)]">This step doesn’t send {previewChannel === "email" ? "an email" : "an SMS"}.</span>}
            </div>
            {sample && tpl && <div className="px-5 pb-4 text-[0.75rem] text-[var(--muted-foreground)]">Shown with {sample.company}’s details</div>}
          </section>

          <section className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm p-5">
            <div className="font-heading font-bold text-[0.9rem] mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-[var(--primary)]" /> Impact today</div>
            <dl className="grid grid-cols-[1fr_auto] gap-y-2 text-[0.85rem] m-0">
              <dt className="text-[var(--muted-foreground)]">Active customers covered</dt><dd className="m-0 font-semibold">{covered.length}</dd>
              <dt className="text-[var(--muted-foreground)]">In the dunning cycle now</dt><dd className="m-0 font-semibold">{states.length}</dd>
              <dt className="text-[var(--muted-foreground)]">{p.autoSuspend ? "Would be suspended tonight" : "Waiting for suspension review"}</dt>
              <dd className={cn("m-0 font-semibold", readyToSuspend.length && "text-[var(--destructive)]")}>{readyToSuspend.length}</dd>
            </dl>
          </section>

          <Readiness checks={checks} />
        </aside>
      </div>

      <ConfirmDialog
        isOpen={confirm === "publish" || confirm === "save-live"}
        onClose={() => { if (!save.isPending) setConfirm(null); }}
        onConfirm={() => commit("Live")}
        pending={save.isPending}
        icon={<Rocket className="w-6 h-6" />}
        title={confirm === "publish" ? `Publish “${p.name}”?` : "Update a live policy?"}
        description="Reminders follow these rules from tonight's run."
        impact={[
          `${covered.length} active customers on ${p.billingModels.map((m) => BILLING_MODEL_LABEL[m].toLowerCase()).join(", ")} plans are covered`,
          `${states.length} are in the dunning cycle right now`,
          p.autoSuspend ? `${readyToSuspend.length} would be suspended automatically tonight` : `${readyToSuspend.length} will wait in Collections for suspension review`,
        ]}
        confirmLabel={save.isPending ? "Saving…" : confirm === "publish" ? "Publish policy" : "Save changes"}
      />
    </div>
  );
}
