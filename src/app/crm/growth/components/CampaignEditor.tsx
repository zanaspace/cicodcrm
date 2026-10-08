"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Rocket, Tag, Users, Mail, MessageSquare, CalendarClock, ClipboardCheck, Copy, Ban, SearchX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BarList } from "@/components/ui/BarList";
import { RowActionsMenu } from "@/components/ui/RowActionsMenu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { CURRENT_USER, newId, daysFromToday, daysUntil, formatDate, formatMoney } from "@/lib/format";
import { SEGMENTS, monthlyValue, subscriptionLabel, useCustomers } from "@/lib/mock/customers";
import { SMS_SEGMENT, fillTemplate, useTemplates } from "@/lib/mock/messaging";
import {
  GOALS, PARTNER_TYPES, audienceLabel, campaignStatus, campaignsStore, resolveAudience, stageLabel, upsertCampaign,
  useCampaigns, useLeads, usePartners, useStages, type AudienceRef, type Campaign, type Recipient,
} from "@/lib/mock/growth";
import { Card, Field, Readiness, Stepper, inputClass, type ReadinessCheck } from "@/app/crm/catalogue/components/editor";
import { CAMPAIGN_BADGE } from "./CampaignsView";

const STEPS = ["Basics", "Audience", "Message", "Schedule", "Review & launch"];

export function CampaignEditor({ id }: { id: string }) {
  const campaigns = useCampaigns();
  // Generated once per page, so the new draft keeps the same id (and form state) across renders.
  const [draftId] = React.useState(() => newId("cmp"));
  const isNew = id === "new";
  const existing = isNew ? undefined : campaigns.find((c) => c.id === id);
  if (!isNew && !existing) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-3 py-24 border border-dashed border-[var(--border)] rounded-xl bg-[var(--card)]">
        <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center"><SearchX className="w-5 h-5 text-[var(--primary)]" /></div>
        <p className="font-heading font-bold text-[1.1rem] m-0">No campaign “{id}”</p>
        <Link href="/crm/growth/campaigns"><Button variant="outline">Back to campaigns</Button></Link>
      </div>
    );
  }
  if (existing && campaignStatus(existing) !== "Draft") return <CampaignResults campaign={existing} />;
  const initial: Campaign = existing ?? { id: draftId, name: "", goal: GOALS[0], audience: null, channel: "email", templateId: null, startAt: null, endAt: null, draft: true, cancelled: false, createdBy: CURRENT_USER, createdAt: daysFromToday(0) };
  return <CampaignBuilder key={initial.id} initial={initial} isNew={isNew} />;
}

/* ---------------- Audience helpers ---------------- */

function useRecipients(a: AudienceRef | null): Recipient[] {
  const customers = useCustomers();
  const leads = useLeads();
  const partners = usePartners();
  return React.useMemo(() => resolveAudience(a, leads, partners, customers), [a, leads, partners, customers]);
}

function previewFor(body: string, r?: Recipient) {
  const c = r?.customer;
  const sub = c ? subscriptionLabel(c.subscription) : undefined;
  return fillTemplate(body, {
    contactName: r?.contact.split(" ")[0], company: r?.name,
    plan: sub ? `${sub.group} ${sub.name}` : undefined, amount: c ? formatMoney(monthlyValue(c)) : undefined,
    dueDate: c ? formatDate(c.subscription.trialEndsAt ?? c.subscription.renewsAt) : undefined, domain: c?.domain,
  });
}

/* ---------------- Builder (drafts) ---------------- */

function CampaignBuilder({ initial, isNew }: { initial: Campaign; isNew: boolean }) {
  const router = useRouter();
  const templates = useTemplates();
  const [c, setC] = React.useState<Campaign>(initial);
  const [step, setStep] = React.useState(0);
  const [maxReached, setMaxReached] = React.useState(isNew ? 0 : STEPS.length - 1);
  const [sendNow, setSendNow] = React.useState(!initial.startAt);
  const [confirm, setConfirm] = React.useState(false);
  const set = <K extends keyof Campaign>(k: K, v: Campaign[K]) => setC((p) => ({ ...p, [k]: v }));
  const stages = useStages();
  const recipients = useRecipients(c.audience);
  const reachable = recipients.filter((r) => (c.channel === "email" ? r.email : r.phone));
  const tpl = templates.find((t) => t.id === c.templateId);
  const preview = tpl ? previewFor(tpl.body, recipients[0]) : "";
  const startAt = sendNow ? daysFromToday(0) : c.startAt;

  const checks: ReadinessCheck[] = [
    { label: "Has a name", ok: !!c.name.trim() },
    { label: "Audience reaches at least one person", ok: reachable.length > 0 },
    { label: "Message template chosen", ok: !!tpl },
    { label: "Start date is today or later", ok: !!startAt && daysUntil(startAt) >= 0 },
    { label: "End date is after the start", ok: !c.endAt || (!!startAt && daysUntil(c.endAt) >= daysUntil(startAt)) },
    ...(recipients.length > reachable.length ? [{ label: `${recipients.length - reachable.length} recipients have no ${c.channel === "email" ? "email" : "phone number"} and will be skipped`, ok: false, warn: true }] : []),
    ...(tpl?.category === "Billing" ? [{ label: "This is a billing template; marketing messages usually need their own", ok: false, warn: true }] : []),
    ...(c.channel === "sms" && preview.length > SMS_SEGMENT ? [{ label: `SMS is ${preview.length} characters: ${Math.ceil(preview.length / SMS_SEGMENT)} messages each`, ok: false, warn: true }] : []),
  ];
  const canLaunch = checks.every((x) => x.ok || x.warn);
  const go = (i: number) => { setStep(i); setMaxReached((m) => Math.max(m, i)); };

  const saveDraft = () => {
    if (!c.name.trim()) { toast.error("Give the campaign a name first"); setStep(0); return; }
    upsertCampaign({ ...c, name: c.name.trim(), startAt: sendNow ? null : c.startAt, draft: true });
    toast.success("Draft saved");
    if (isNew) router.replace(`/crm/growth/campaigns/${c.id}`);
  };

  const launch = () => {
    const starting = startAt!;
    const live = daysUntil(starting) <= 0;
    upsertCampaign({
      ...c, name: c.name.trim(), startAt: starting, endAt: c.endAt ?? daysFromToday(daysUntil(starting) + 14), draft: false,
      results: live ? { recipients: reachable.length, delivered: Math.round(reachable.length * 0.96), opened: 0, clicked: 0, leads: 0, won: 0 } : undefined,
    });
    setConfirm(false);
    toast.success(live ? `Sending to ${reachable.length} recipients` : `Scheduled for ${formatDate(starting)}`);
    router.push(`/crm/growth/campaigns/${c.id}`);
  };

  const audienceKind = c.audience?.kind ?? "segment";
  const setAudience = (a: AudienceRef) => set("audience", a);

  return (
    <div className="max-w-[1600px] w-full mx-auto flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <Link href="/crm/growth/campaigns" className="inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-2"><ArrowLeft className="w-4 h-4" /> Campaigns</Link>
          <h1 className="text-2xl font-heading font-extrabold m-0 flex items-center gap-3">{isNew ? "New campaign" : initial.name}<StatusBadge status="Draft" /></h1>
          <p className="text-[0.85rem] text-[var(--muted-foreground)] mt-1.5 mb-0">Nothing is sent until you launch.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0 pt-7">
          <Button variant="outline" onClick={saveDraft}><Save className="w-4 h-4 mr-2" /> Save draft</Button>
          <Button onClick={() => setConfirm(true)} disabled={!canLaunch}><Rocket className="w-4 h-4 mr-2" /> {sendNow ? "Launch" : "Schedule"}</Button>
        </div>
      </div>

      <Stepper steps={STEPS} current={step} maxReached={maxReached} onGo={go} />

      <div className="grid grid-cols-[1fr_360px] gap-6 items-start">
        <div className="flex flex-col gap-6 min-w-0">
          {step === 0 && (
            <Card title="Basics" icon={Tag}>
              <div className="grid grid-cols-2 gap-5">
                <Field label="Campaign name" required><input className={inputClass} value={c.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Trial ending: keep your plan" autoFocus /></Field>
                <Field label="Goal" hint="Used to judge results"><Select options={GOALS} value={c.goal} onChange={(g) => set("goal", g)} ariaLabel="Goal" /></Field>
              </div>
            </Card>
          )}

          {step === 1 && (
            <Card title="Audience" icon={Users} actions={<span className="text-[0.85rem] font-semibold">{recipients.length} recipient{recipients.length === 1 ? "" : "s"} today</span>}>
              <div role="radiogroup" className="grid grid-cols-3 gap-3 mb-5">
                {([["segment", "Customers", "A saved customer segment"], ["partners", "Partners", "Verified sales partners"], ["leads", "Leads", "Leads at a pipeline stage"]] as const).map(([k, label, hint]) => (
                  <button key={k} type="button" role="radio" aria-checked={audienceKind === k}
                    onClick={() => setAudience(k === "segment" ? { kind: "segment", id: "all" } : k === "partners" ? { kind: "partners", type: "All" } : { kind: "leads", stage: "open" })}
                    className={cn("text-left p-4 rounded-xl border-[1.5px] transition-colors", audienceKind === k && c.audience ? "border-[var(--primary)] bg-[var(--accent)]" : "border-[var(--border)] hover:border-[var(--primary)]/50")}>
                    <div className="font-heading font-bold text-[0.9rem]">{label}</div>
                    <div className="text-[0.78rem] text-[var(--muted-foreground)] mt-0.5">{hint}</div>
                  </button>
                ))}
              </div>
              {c.audience?.kind === "segment" && (
                <Field label="Customer segment" hint="The same segments as the Customers list"><Select options={SEGMENTS.map((s) => s.label)} value={SEGMENTS.find((s) => s.id === (c.audience as { id: string }).id)?.label} onChange={(l) => setAudience({ kind: "segment", id: SEGMENTS.find((s) => s.label === l)!.id })} ariaLabel="Customer segment" /></Field>
              )}
              {c.audience?.kind === "partners" && (
                <Field label="Partner type"><Select options={["All", ...PARTNER_TYPES]} value={c.audience.type} onChange={(t) => setAudience({ kind: "partners", type: t as "All" })} ariaLabel="Partner type" /></Field>
              )}
              {c.audience?.kind === "leads" && (
                <Field label="Lead stage"><Select options={["All open", ...stages.map((x) => x.label)]} value={c.audience.stage === "open" ? "All open" : stageLabel(c.audience.stage)} onChange={(s) => setAudience({ kind: "leads", stage: s === "All open" ? "open" : stages.find((x) => x.label === s)!.id })} ariaLabel="Lead stage" /></Field>
              )}
              {c.audience && (
                <div className="mt-5 rounded-lg border border-[var(--border)] overflow-hidden">
                  <div className="px-4 py-2 bg-[var(--background)] text-[0.75rem] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">First recipients</div>
                  {recipients.length === 0 ? <p className="m-0 px-4 py-3 text-[0.85rem] text-[var(--muted-foreground)]">Nobody matches this audience today.</p> : (
                    <ul className="divide-y divide-[var(--border)] m-0 p-0 list-none">
                      {recipients.slice(0, 5).map((r) => <li key={r.name + r.email} className="px-4 py-2 text-[0.85rem] flex justify-between gap-4"><span className="font-medium">{r.name}</span><span className="text-[var(--muted-foreground)] truncate">{r.contact}</span></li>)}
                      {recipients.length > 5 && <li className="px-4 py-2 text-[0.8rem] text-[var(--muted-foreground)]">and {recipients.length - 5} more</li>}
                    </ul>
                  )}
                </div>
              )}
            </Card>
          )}

          {step === 2 && (
            <Card title="Message" icon={c.channel === "email" ? Mail : MessageSquare} actions={<Link href="/crm/growth/messaging" className="text-[0.82rem] font-semibold text-[var(--primary)]">Manage templates</Link>}>
              <div className="flex items-center bg-[var(--muted)] p-1.5 rounded-lg w-max gap-1 mb-5" role="tablist" aria-label="Channel">
                {(["email", "sms"] as const).map((ch) => (
                  <button key={ch} role="tab" aria-selected={c.channel === ch} onClick={() => { set("channel", ch); set("templateId", null); }}
                    className={cn("px-5 py-2 rounded-md font-heading font-semibold text-[0.85rem] flex items-center gap-1.5", c.channel === ch ? "bg-[var(--card)] shadow-sm" : "text-[var(--muted-foreground)]")}>
                    {ch === "email" ? <Mail className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}{ch === "email" ? "Email" : "SMS"}
                  </button>
                ))}
              </div>
              <Field label="Template" required>
                <Select options={templates.filter((t) => t.channel === c.channel).map((t) => `${t.name} · ${t.category}`)} value={tpl ? `${tpl.name} · ${tpl.category}` : ""} placeholder="Choose a template"
                  onChange={(v) => set("templateId", templates.find((t) => `${t.name} · ${t.category}` === v)!.id)} ariaLabel="Template" />
              </Field>
            </Card>
          )}

          {step === 3 && (
            <Card title="Schedule" icon={CalendarClock}>
              <div role="radiogroup" className="grid grid-cols-2 gap-3 mb-5">
                {([[true, "Send now", "Starts as soon as you launch"], [false, "Schedule", "Pick a start date"]] as const).map(([now, label, hint]) => (
                  <button key={label} type="button" role="radio" aria-checked={sendNow === now} onClick={() => setSendNow(now)}
                    className={cn("text-left p-4 rounded-xl border-[1.5px]", sendNow === now ? "border-[var(--primary)] bg-[var(--accent)]" : "border-[var(--border)]")}>
                    <div className="font-heading font-bold text-[0.9rem]">{label}</div><div className="text-[0.78rem] text-[var(--muted-foreground)]">{hint}</div>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-5">
                {!sendNow && <Field label="Start date"><input type="date" min={daysFromToday(0)} className={inputClass} value={c.startAt ?? ""} onChange={(e) => set("startAt", e.target.value)} /></Field>}
                <Field label="End date" hint="When you stop counting results. Defaults to 14 days after the start."><input type="date" min={startAt ?? daysFromToday(0)} className={inputClass} value={c.endAt ?? ""} onChange={(e) => set("endAt", e.target.value || null)} /></Field>
              </div>
            </Card>
          )}

          {step === 4 && (
            <Card title="Review" icon={ClipboardCheck}>
              <dl className="grid grid-cols-[160px_1fr] gap-y-4 text-[0.9rem] m-0">
                <Row label="Campaign" onEdit={() => go(0)}>{c.name || "—"} · {c.goal}</Row>
                <Row label="Audience" onEdit={() => go(1)}>{audienceLabel(c.audience)} · {reachable.length} reachable</Row>
                <Row label="Message" onEdit={() => go(2)}>{c.channel === "email" ? "Email" : "SMS"} · {tpl?.name ?? "No template"}</Row>
                <Row label="Schedule" onEdit={() => go(3)}>{sendNow ? "Send now" : startAt ? formatDate(startAt) : "No date"} → {c.endAt ? formatDate(c.endAt) : "14 days later"}</Row>
              </dl>
            </Card>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => go(step - 1)} disabled={step === 0}>Back</Button>
            {step < STEPS.length - 1 && <Button variant="secondary" onClick={() => go(step + 1)}>Continue</Button>}
          </div>
        </div>

        <aside className="flex flex-col gap-4 sticky top-0">
          <section className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--background)] font-heading font-bold text-[0.9rem] flex items-center gap-2">
              {c.channel === "email" ? <Mail className="w-4 h-4 text-[var(--primary)]" /> : <MessageSquare className="w-4 h-4 text-[var(--primary)]" />} Message preview
            </div>
            <div className="p-5 text-[0.85rem] leading-relaxed whitespace-pre-line min-h-[120px]">
              {tpl ? (
                <>
                  {tpl.subject && <div className="font-semibold mb-2">{previewFor(tpl.subject, recipients[0])}</div>}
                  {preview}
                  {c.channel === "sms" && <div className="mt-3 text-[0.75rem] text-[var(--muted-foreground)]">{preview.length} characters</div>}
                </>
              ) : <span className="text-[var(--muted-foreground)]">Choose a template to see it here.</span>}
            </div>
            {tpl && recipients[0] && <div className="px-5 pb-4 text-[0.75rem] text-[var(--muted-foreground)]">Shown with {recipients[0].name}&apos;s details</div>}
          </section>
          <Readiness checks={checks} />
        </aside>
      </div>

      <ConfirmDialog
        isOpen={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={launch}
        icon={<Rocket className="w-6 h-6" />}
        title={sendNow ? `Send “${c.name}” now?` : `Schedule “${c.name}”?`}
        description={sendNow ? "Messages start going out straight away and can't be recalled." : `It starts on ${startAt ? formatDate(startAt) : ""}. You can cancel it until then.`}
        impact={[`${reachable.length} recipients by ${c.channel === "email" ? "email" : "SMS"}`, `Audience: ${audienceLabel(c.audience)}`, `Template: ${tpl?.name ?? ""}`]}
        confirmLabel={sendNow ? "Send now" : "Schedule campaign"}
      />
    </div>
  );
}

function Row({ label, onEdit, children }: { label: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-[var(--muted-foreground)] font-semibold">{label}</dt>
      <dd className="m-0 flex items-start justify-between gap-4"><div className="min-w-0">{children}</div><button type="button" onClick={onEdit} className="text-[0.8rem] font-semibold text-[var(--primary)] shrink-0">Edit</button></dd>
    </>
  );
}

/* ---------------- Results (scheduled, running, completed) ---------------- */

function CampaignResults({ campaign: c }: { campaign: Campaign }) {
  const router = useRouter();
  const templates = useTemplates();
  const [cancelling, setCancelling] = React.useState(false);
  const st = campaignStatus(c);
  const tpl = templates.find((t) => t.id === c.templateId);
  const recipients = useRecipients(c.audience);
  const r = c.results;
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

  const duplicate = () => {
    const id = newId("cmp");
    upsertCampaign({ ...c, id, name: `${c.name} (copy)`, draft: true, cancelled: false, startAt: null, endAt: null, results: undefined, createdBy: CURRENT_USER, createdAt: daysFromToday(0) });
    toast.success("Copied as a draft");
    router.push(`/crm/growth/campaigns/${id}`);
  };

  const funnel = r ? [
    { key: "recipients", label: "Recipients", value: r.recipients },
    { key: "delivered", label: "Delivered", value: r.delivered },
    ...(c.channel === "email" ? [{ key: "opened", label: "Opened", value: r.opened }] : []),
    { key: "clicked", label: "Clicked", value: r.clicked },
    { key: "leads", label: "Leads created", value: r.leads },
    { key: "won", label: "Customers won", value: r.won },
  ] : [];

  return (
    <div className="max-w-[1600px] w-full mx-auto flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <Link href="/crm/growth/campaigns" className="inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-2"><ArrowLeft className="w-4 h-4" /> Campaigns</Link>
          <h1 className="text-2xl font-heading font-extrabold m-0 flex items-center gap-3 flex-wrap">{c.name}<StatusBadge status={CAMPAIGN_BADGE[st]} label={st} /></h1>
          <p className="text-[0.85rem] text-[var(--muted-foreground)] mt-1.5 mb-0">{c.goal} · {audienceLabel(c.audience)} · {c.startAt ? formatDate(c.startAt) : ""} → {c.endAt ? formatDate(c.endAt) : ""} · created by {c.createdBy}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0 pt-7">
          <Button variant="outline" onClick={duplicate}><Copy className="w-4 h-4 mr-2" /> Duplicate</Button>
          {(st === "Scheduled" || st === "Running") && (
            <RowActionsMenu label="More campaign actions" triggerClassName="w-10 h-10" actions={[{ label: st === "Scheduled" ? "Cancel campaign" : "Stop campaign", icon: Ban, danger: true, onSelect: () => setCancelling(true) }]} />
          )}
        </div>
      </div>

      {r ? (
        <div className="grid grid-cols-[1fr_380px] gap-6 items-start">
          <section className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]">
              <h2 className="text-[0.95rem] font-heading font-bold m-0">Results</h2>
              <p className="m-0 text-[0.8rem] text-[var(--muted-foreground)]">{pct(r.delivered, r.recipients)} delivered{c.channel === "email" ? ` · ${pct(r.opened, r.delivered)} opened` : ""} · {pct(r.leads, r.delivered)} became leads · {pct(r.won, r.leads)} of leads won</p>
            </div>
            <div className="p-6"><BarList rows={funnel.map((f) => ({ ...f, display: f.value.toLocaleString(), href: f.key === "leads" || f.key === "won" ? "/crm/growth/leads" : `/crm/growth/campaigns/${c.id}` }))} max={Math.max(1, r.recipients)} unit="people" /></div>
          </section>
          <MessageCard channel={c.channel} subject={tpl?.subject ? previewFor(tpl.subject, recipients[0]) : undefined} body={tpl ? previewFor(tpl.body, recipients[0]) : ""} name={tpl?.name} />
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_380px] gap-6 items-start">
          <section className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm p-6">
            <h2 className="text-[0.95rem] font-heading font-bold m-0">{st === "Cancelled" ? "Cancelled before sending" : `Starts ${c.startAt ? formatDate(c.startAt) : ""}`}</h2>
            <p className="text-[0.88rem] text-[var(--muted-foreground)] mt-1 mb-0">{st === "Cancelled" ? "Nothing was sent." : `${recipients.length} people match the audience today. The list is taken again on the start date.`}</p>
          </section>
          <MessageCard channel={c.channel} subject={tpl?.subject ? previewFor(tpl.subject, recipients[0]) : undefined} body={tpl ? previewFor(tpl.body, recipients[0]) : ""} name={tpl?.name} />
        </div>
      )}

      <ConfirmDialog
        isOpen={cancelling}
        onClose={() => setCancelling(false)}
        onConfirm={() => { const latest = campaignsStore.get().find((x) => x.id === c.id)!; upsertCampaign({ ...latest, cancelled: true }); setCancelling(false); toast.success("Campaign cancelled"); }}
        tone="danger"
        icon={<Ban className="w-6 h-6" />}
        title={st === "Scheduled" ? `Cancel “${c.name}”?` : `Stop “${c.name}”?`}
        description={st === "Scheduled" ? "Nothing has been sent yet. You can duplicate it later to try again." : "Messages already sent can't be recalled; no more will go out."}
        confirmLabel={st === "Scheduled" ? "Cancel campaign" : "Stop campaign"}
      />
    </div>
  );
}

function MessageCard({ channel, subject, body, name }: { channel: "email" | "sms"; subject?: string; body: string; name?: string }) {
  return (
    <section className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--background)] font-heading font-bold text-[0.9rem] flex items-center gap-2">
        {channel === "email" ? <Mail className="w-4 h-4 text-[var(--primary)]" /> : <MessageSquare className="w-4 h-4 text-[var(--primary)]" />} {name ?? "Message"}
      </div>
      <div className="p-5 text-[0.85rem] leading-relaxed whitespace-pre-line">
        {subject && <div className="font-semibold mb-2">{subject}</div>}
        {body || <span className="text-[var(--muted-foreground)]">No template</span>}
      </div>
    </section>
  );
}
