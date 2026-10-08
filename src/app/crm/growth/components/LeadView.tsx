"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Shuffle, Check, UserPlus, XCircle, RotateCcw, Phone, Mail, StickyNote, Flag, UserCheck, CalendarClock, Send, SearchX, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { RowActionsMenu } from "@/components/ui/RowActionsMenu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { daysFromToday, daysUntil, formatDate, formatMoney, formatPhone, formatRelative } from "@/lib/format";
import { useSectors } from "@/lib/mock/settings";
import {
  LOST_REASONS, OWNERS, WON_STAGE, isOpenStage, useStages, addLeadNote, assignLead, markLost, markWon, moveLead, partnersStore, reopenLead, updateLead, useLeads,
  type Lead, type LeadActivity, type PipelineStage,
} from "@/lib/mock/growth";
import { AddCustomerModal } from "@/app/crm/customer-mgt/customers/components/AddCustomerModal";
import { MoveStageModal, StageBadge } from "./stages";

const KIND_ICON: Record<LeadActivity["kind"], React.ElementType> = { note: StickyNote, stage: Flag, call: Phone, created: UserPlus, owner: UserCheck };

export function LeadView({ id }: { id: string }) {
  const leads = useLeads();
  const SECTORS = useSectors();
  const lead = leads.find((l) => l.id === id);
  const params = useSearchParams();
  const [converting, setConverting] = React.useState(() => params.get("convert") === "1" && !!lead && isOpenStage(lead.stage));
  const [losing, setLosing] = React.useState(false);
  const [changing, setChanging] = React.useState(false);

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-3 py-24 border border-dashed border-[var(--border)] rounded-xl bg-[var(--card)]">
        <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center"><SearchX className="w-5 h-5 text-[var(--primary)]" /></div>
        <p className="font-heading font-bold text-[1.1rem] m-0">No lead with ID “{id}”</p>
        <Link href="/crm/growth/leads"><Button variant="outline">Back to leads</Button></Link>
      </div>
    );
  }

  const isOpen = isOpenStage(lead.stage);
  const partner = lead.partnerId ? partnersStore.get().find((p) => p.id === lead.partnerId) : undefined;
  const sector = Object.keys(SECTORS).includes(lead.sector) ? lead.sector : "";

  return (
    <div className="max-w-[1600px] w-full mx-auto flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <Link href="/crm/growth/leads" className="inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-2"><ArrowLeft className="w-4 h-4" /> Leads</Link>
          <h1 className="text-2xl font-heading font-extrabold m-0 flex items-center gap-3 flex-wrap">
            {lead.company}
            <StageBadge stage={lead.stage} />
          </h1>
          <p className="text-[0.88rem] text-[var(--muted-foreground)] mt-1.5 mb-0 flex items-center gap-2 flex-wrap">
            <span>{lead.contact}{lead.designation ? `, ${lead.designation}` : ""}</span><span aria-hidden>·</span>
            <span>Source: {lead.source}{partner ? ` (${partner.name})` : ""}</span><span aria-hidden>·</span>
            <span>Created {formatDate(lead.createdAt)}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 pt-7">
          {isOpen && <Button onClick={() => setConverting(true)}><PartyPopper className="w-4 h-4 mr-2" /> Convert to customer</Button>}
          {lead.stage === "won" && lead.customerCicod && <Link href={`/crm/customer-mgt/customers/${lead.customerCicod}`}><Button variant="outline">Open customer</Button></Link>}
          {lead.stage === "lost" && <Button variant="outline" onClick={() => { reopenLead(lead.id); toast.success("Lead reopened"); }}><RotateCcw className="w-4 h-4 mr-2" /> Reopen</Button>}
          {isOpen && (
            <RowActionsMenu label="More lead actions" triggerClassName="w-10 h-10" actions={[
              { label: "Change stage…", icon: Shuffle, onSelect: () => setChanging(true) },
              { label: "Assign to me", icon: UserCheck, onSelect: () => { assignLead(lead.id, OWNERS[0]); toast.success("Assigned to you"); } },
              { label: "Mark as lost", icon: XCircle, danger: true, onSelect: () => setLosing(true) },
            ]} />
          )}
        </div>
      </div>

      {lead.stage === "lost" && <Alert tone="default" title={`Lost: ${lead.lostReason ?? "no reason given"}`}>Reopen the lead if the conversation starts again.</Alert>}
      {lead.stage === "won" && <Alert tone="info" title="Won and converted">This lead became customer #{lead.customerCicod}. Billing, onboarding and support now happen on the customer page.</Alert>}
      {isOpen && !lead.owner && <Alert tone="warning" title="Nobody owns this lead yet">Website sign-ups arrive unassigned. Pick an owner so someone follows up.</Alert>}

      <StageCard lead={lead} onConvert={() => setConverting(true)} onChange={() => setChanging(true)} onLose={() => setLosing(true)} />

      <div className="grid grid-cols-3 gap-6 items-start">
        <div className="col-span-2 flex flex-col gap-6">
          <ActivityCard lead={lead} />
        </div>
        <div className="col-span-1 flex flex-col gap-6">
          <section className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]"><h3 className="text-[0.95rem] font-heading font-bold m-0">Ownership and follow-up</h3></div>
            <div className="p-6 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[0.85rem] font-bold">Owner</span>
                <Select options={OWNERS} value={lead.owner ?? ""} placeholder="Unassigned" onChange={(o) => { assignLead(lead.id, o); toast.success(`Assigned to ${o}`); }} ariaLabel="Owner" />
              </label>
              <div className="flex flex-col gap-1.5">
                <span className="text-[0.85rem] font-bold">Next follow-up</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {[1, 3, 7].map((d) => (
                    <button key={d} type="button" disabled={!isOpen} onClick={() => { updateLead(lead.id, { nextFollowUp: daysFromToday(d) }); toast.success(`Follow-up set for ${formatDate(daysFromToday(d))}`); }}
                      className="px-3 h-8 rounded-full border-[1.5px] border-[var(--border)] text-[0.8rem] font-semibold hover:border-[var(--primary)] disabled:opacity-50">
                      {d === 1 ? "Tomorrow" : `In ${d} days`}
                    </button>
                  ))}
                </div>
                <span className={cn("text-[0.82rem]", lead.nextFollowUp && daysUntil(lead.nextFollowUp) < 0 ? "text-[var(--destructive)] font-semibold" : "text-[var(--muted-foreground)]")}>
                  <CalendarClock className="w-3.5 h-3.5 inline mr-1" />
                  {lead.nextFollowUp ? `${formatDate(lead.nextFollowUp)} (${formatRelative(lead.nextFollowUp)})` : "No follow-up set"}
                </span>
              </div>
            </div>
          </section>

          <section className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]"><h3 className="text-[0.95rem] font-heading font-bold m-0">Details</h3></div>
            <dl className="p-6 grid grid-cols-[120px_1fr] gap-y-3 text-[0.88rem] m-0">
              <dt className="text-[var(--muted-foreground)]">Interested in</dt><dd className="m-0 font-medium">{lead.interest}</dd>
              <dt className="text-[var(--muted-foreground)]">Est. value</dt><dd className="m-0 font-medium">{lead.estMonthly ? `${formatMoney(lead.estMonthly)}/month` : "Not known yet"}</dd>
              <dt className="text-[var(--muted-foreground)]">Email</dt><dd className="m-0">{lead.email ? <a className="hover:text-[var(--primary)]" href={`mailto:${lead.email}`}><Mail className="w-3.5 h-3.5 inline mr-1" />{lead.email}</a> : "—"}</dd>
              <dt className="text-[var(--muted-foreground)]">Phone</dt><dd className="m-0">{lead.phone ? formatPhone(lead.phone) : "—"}</dd>
              <dt className="text-[var(--muted-foreground)]">Sector</dt><dd className="m-0">{lead.sector}</dd>
              <dt className="text-[var(--muted-foreground)]">State</dt><dd className="m-0">{lead.state || "—"}</dd>
            </dl>
          </section>
        </div>
      </div>

      <AddCustomerModal
        isOpen={converting}
        onClose={() => setConverting(false)}
        prefill={{ company: lead.company, sector, contactName: lead.contact, contactEmail: lead.email, contactPhone: lead.phone ? formatPhone(lead.phone).replace("+234 ", "0") : "", state: lead.state }}
        onCreated={(c) => { markWon(lead.id, c.cicod, c.company); }}
      />
      <MoveStageModal lead={changing ? lead : null} onClose={() => setChanging(false)} onConvert={() => setConverting(true)} onLose={() => setLosing(true)} />
      <ConfirmDialog
        isOpen={losing}
        onClose={() => setLosing(false)}
        onConfirm={(r) => { markLost(lead.id, r?.reason ?? "Other", r?.note ?? ""); setLosing(false); toast.success(`${lead.company} marked as lost`); }}
        tone="danger"
        icon={<XCircle className="w-6 h-6" />}
        title={`Mark ${lead.company} as lost?`}
        description="The lead leaves the open pipeline. You can reopen it later."
        reasons={LOST_REASONS}
        confirmLabel="Mark as lost"
      />
    </div>
  );
}

/**
 * Where the lead is in the pipeline, and the obvious ways to move it:
 * Back / Move to buttons, clicking any step, or Change stage for a jump with a note.
 * Won only via Convert; Lost only via Mark as lost (it needs a reason).
 */
function StageCard({ lead, onConvert, onChange, onLose }: { lead: Lead; onConvert: () => void; onChange: () => void; onLose: () => void }) {
  const stages = useStages();
  const idx = stages.findIndex((s) => s.id === lead.stage);
  const won = lead.stage === "won";
  const lost = lead.stage === "lost";
  const editable = idx >= 0;
  const prev = editable ? stages[idx - 1] : undefined;
  const next = editable ? stages[idx + 1] : undefined;
  const since = lead.activity.find((a) => a.kind === "stage" || a.kind === "created")?.at ?? lead.createdAt;
  const days = Math.max(0, -daysUntil(since.slice(0, 10)));
  const move = (to: PipelineStage) => { moveLead(lead.id, to.id); toast.success(`Moved to ${to.label}`); };
  const steps: (PipelineStage & { win?: boolean })[] = [...stages, { ...WON_STAGE, win: true }];

  return (
    <section className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden" aria-labelledby="stage-title">
      <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h3 id="stage-title" className="text-[0.95rem] font-heading font-bold m-0">Pipeline stage</h3>
          <StageBadge stage={lead.stage} />
          <span className="text-[0.8rem] text-[var(--muted-foreground)]">
            {editable ? `Step ${idx + 1} of ${stages.length} · ${days === 0 ? "moved here today" : `${days} day${days === 1 ? "" : "s"} in this stage`}` : won ? "Converted to a customer" : lost ? "Out of the pipeline" : "Its stage was removed; pick a new one"}
          </span>
        </div>
        {(editable || (!won && !lost)) && (
          <div className="flex items-center gap-2">
            {prev && <Button variant="outline" size="sm" onClick={() => move(prev)}><ArrowLeft className="w-4 h-4 mr-1.5" /> Back to {prev.label}</Button>}
            <Button variant="outline" size="sm" onClick={onChange}><Shuffle className="w-4 h-4 mr-1.5" /> Change stage</Button>
            {next
              ? <Button size="sm" onClick={() => move(next)}>Move to {next.label} <ArrowRight className="w-4 h-4 ml-1.5" /></Button>
              : editable && <Button size="sm" onClick={onConvert}><PartyPopper className="w-4 h-4 mr-1.5" /> Convert to customer</Button>}
          </div>
        )}
      </div>

      <ol className="flex items-center gap-2 px-5 py-4 m-0 list-none" aria-label="Stages">
        {steps.map((st, i) => {
          const reached = won || (editable && i <= idx);
          const current = st.id === lead.stage;
          const clickable = editable && !current;
          const action = st.win ? "Convert to customer" : `Move to ${st.label}`;
          return (
            <li key={st.id} className="flex items-center gap-2 flex-1 last:flex-none min-w-0">
              <button type="button" disabled={!clickable} onClick={() => (st.win ? onConvert() : move(st))}
                aria-current={current ? "step" : undefined} title={clickable ? action : undefined} aria-label={clickable ? `${st.label}: ${action}` : st.label}
                className={cn("flex items-center gap-2.5 rounded-full pr-3 -ml-1 pl-1 py-1 transition-colors disabled:cursor-default group min-w-0", clickable && "hover:bg-[var(--accent)]")}>
                <span className={cn("w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[0.75rem] font-bold transition-colors",
                  reached && !current ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : current ? "border-2 border-[var(--primary)] text-[var(--primary)]" : "bg-[var(--muted)] text-[var(--muted-foreground)]",
                  clickable && !reached && "group-hover:bg-[var(--primary)] group-hover:text-[var(--primary-foreground)]",
                  lost && "opacity-50")}>
                  {reached && !current ? <Check className="w-4 h-4" /> : st.win ? <PartyPopper className="w-3.5 h-3.5" /> : i + 1}
                </span>
                <span className={cn("text-[0.85rem] font-heading font-semibold whitespace-nowrap truncate", reached || current ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]", clickable && "group-hover:text-[var(--primary)]")}>
                  {st.label}
                </span>
              </button>
              {i < steps.length - 1 && <span className={cn("h-0.5 flex-1 rounded-full min-w-4", won || (editable && i < idx) ? "bg-[var(--primary)]" : "bg-[var(--muted)]")} />}
            </li>
          );
        })}
      </ol>

      {editable && (
        <div className="px-5 pb-3 -mt-1 flex items-center justify-between gap-4 text-[0.78rem] text-[var(--muted-foreground)]">
          <span>Tip: click any stage above to move the lead there. Every move is logged in Activity.</span>
          <button type="button" onClick={onLose} className="font-semibold text-[var(--destructive)] hover:underline">Mark as lost</button>
        </div>
      )}
    </section>
  );
}


function ActivityCard({ lead }: { lead: Lead }) {
  const [text, setText] = React.useState("");
  const [kind, setKind] = React.useState<"note" | "call">("call");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const [first, ...rest] = text.trim().split("\n");
    addLeadNote(lead.id, kind === "call" ? `Call: ${first.slice(0, 70)}` : first.slice(0, 80), rest.join("\n") || undefined, kind);
    setText("");
    toast.success(kind === "call" ? "Call logged" : "Note added");
  };
  return (
    <section className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]"><h3 className="text-[0.95rem] font-heading font-bold m-0">Activity</h3></div>
      <form onSubmit={submit} className="p-6 border-b border-[var(--border)] flex flex-col gap-3">
        <div className="flex gap-1" role="tablist" aria-label="Activity type">
          {(["call", "note"] as const).map((k) => (
            <button key={k} type="button" role="tab" aria-selected={kind === k} onClick={() => setKind(k)}
              className={cn("px-3 py-1 rounded-full text-[0.78rem] font-semibold", kind === k ? "bg-[var(--secondary)] text-[var(--secondary-foreground)]" : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]")}>
              {k === "call" ? "Log a call" : "Add a note"}
            </button>
          ))}
        </div>
        <label htmlFor="lead-activity" className="sr-only">Activity</label>
        <textarea id="lead-activity" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={kind === "call" ? "What did you discuss? First line is the summary." : "First line becomes the title."}
          className="p-3 rounded-md border-[1.5px] border-[var(--input)] bg-[var(--background)] text-[0.9rem] focus:outline-none focus:border-[var(--ring)] resize-none" />
        <Button type="submit" disabled={!text.trim()} className="self-end"><Send className="w-4 h-4 mr-2" /> Save</Button>
      </form>
      <ol className="p-6 flex flex-col">
        {lead.activity.map((a, i) => {
          const Icon = KIND_ICON[a.kind];
          return (
            <li key={a.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[var(--accent)] text-[var(--primary)]"><Icon className="w-4 h-4" /></span>
                {i < lead.activity.length - 1 && <span className="w-px flex-1 bg-[var(--border)] my-1" />}
              </div>
              <div className="pb-5 flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-semibold text-[0.9rem]">{a.title}</span>
                  <span className="text-[0.75rem] text-[var(--muted-foreground)] whitespace-nowrap">{formatDate(a.at)}</span>
                </div>
                {a.body && <p className="m-0 mt-1 text-[0.85rem] text-[var(--muted-foreground)] whitespace-pre-line">{a.body}</p>}
                <span className="text-[0.75rem] text-[var(--muted-foreground)]">by {a.by}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
