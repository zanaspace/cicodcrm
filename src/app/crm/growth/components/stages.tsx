"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Check, Lock, Plus, Trash2, ArrowRight, PartyPopper, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { newId } from "@/lib/format";
import {
  LOST_STAGE, MAX_STAGES, STAGE_TONES, WON_STAGE, moveLead, saveStages, stageById, stageErrors, useLeads, useStages,
  type Lead, type PipelineStage, type StageId, type StageTone,
} from "@/lib/mock/growth";

const DOT: Record<StageTone, string> = {
  info: "bg-[var(--info)]",
  warning: "bg-[var(--warning)]",
  success: "bg-[var(--success)]",
  secondary: "bg-[var(--secondary)] border border-[var(--border)]",
  muted: "bg-[var(--muted-foreground)]",
  destructive: "bg-[var(--destructive)]",
};

/** Stage badge in the stage's own colour. Re-renders when stages are renamed or recoloured. */
export function StageBadge({ stage, suffix }: { stage: StageId; suffix?: string }) {
  useStages();
  const s = stageById(stage);
  return (
    <Badge variant={s?.tone ?? "muted"} className="gap-1.5 whitespace-nowrap">
      <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-current" />
      {s?.label ?? "Removed stage"}{suffix ? ` · ${suffix}` : ""}
    </Badge>
  );
}

/* ---------------- Change stage ---------------- */

/**
 * Pick any open stage for a lead. Won and Lost are not plain moves: they go through
 * Convert to customer and Mark as lost, which are offered here as shortcuts.
 */
export function MoveStageModal({ lead, onClose, onConvert, onLose }: { lead: Lead | null; onClose: () => void; onConvert?: () => void; onLose?: () => void }) {
  const stages = useStages();
  const [to, setTo] = React.useState<StageId | null>(null);
  const [note, setNote] = React.useState("");
  const close = () => { setTo(null); setNote(""); onClose(); };
  const target = stages.find((s) => s.id === to);

  const submit = () => {
    if (!lead || !target) return;
    moveLead(lead.id, target.id, note);
    toast.success(`${lead.company} moved to ${target.label}`);
    close();
  };

  return (
    <Modal
      isOpen={!!lead}
      onClose={close}
      title={`Change stage: ${lead?.company ?? ""}`}
      footer={<><Button variant="outline" onClick={close}>Cancel</Button><Button onClick={submit} disabled={!target}>{target ? `Move to ${target.label}` : "Choose a stage"}</Button></>}
    >
      {lead && (
        <div className="flex flex-col gap-5">
          <div role="radiogroup" aria-label="Stage" className="flex flex-col gap-2">
            {stages.map((s, i) => {
              const current = s.id === lead.stage;
              const chosen = s.id === to;
              return (
                <button key={s.id} type="button" role="radio" aria-checked={chosen} disabled={current} onClick={() => setTo(s.id)}
                  className={cn("flex items-center gap-3 px-4 py-3 rounded-lg border-[1.5px] text-left transition-colors",
                    chosen ? "border-[var(--primary)] bg-[var(--accent)]" : "border-[var(--border)] hover:border-[var(--primary)]/50",
                    current && "opacity-60 cursor-default hover:border-[var(--border)]")}>
                  <span className="w-6 text-[0.8rem] font-bold text-[var(--muted-foreground)]">{i + 1}</span>
                  <span aria-hidden className={cn("w-2.5 h-2.5 rounded-full", DOT[s.tone])} />
                  <span className="font-heading font-semibold text-[0.9rem] flex-1">{s.label}</span>
                  {current ? <span className="text-[0.75rem] font-semibold text-[var(--muted-foreground)]">Current stage</span> : chosen && <Check className="w-4 h-4 text-[var(--primary)]" />}
                </button>
              );
            })}
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.85rem] font-bold">Note <span className="font-normal text-[var(--muted-foreground)]">(optional)</span></span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Why it moved, e.g. demo booked for Friday"
              className="w-full p-3 rounded-md border-[1.5px] border-[var(--input)] bg-[var(--background)] text-[0.9rem] focus:outline-none focus:border-[var(--ring)] resize-none" />
          </label>
          {(onConvert || onLose) && (
            <div className="flex items-center gap-2 flex-wrap text-[0.82rem] text-[var(--muted-foreground)] border-t border-[var(--border)] pt-4">
              <span>Closing it instead?</span>
              {onConvert && <button type="button" onClick={() => { close(); onConvert(); }} className="font-semibold text-[var(--success)] flex items-center gap-1"><PartyPopper className="w-3.5 h-3.5" /> Convert to customer (Won)</button>}
              {onLose && <button type="button" onClick={() => { close(); onLose(); }} className="font-semibold text-[var(--destructive)] flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Mark as lost</button>}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/* ---------------- Manage stages ---------------- */

/** Mount only while open, so each opening starts from the saved stages. */
export function ManageStagesDrawer({ onClose }: { onClose: () => void }) {
  const saved = useStages();
  const leads = useLeads();
  const [list, setList] = React.useState<PipelineStage[]>(saved);
  const [moves, setMoves] = React.useState<Record<string, string>>({});
  const [removing, setRemoving] = React.useState<{ id: string; to: string } | null>(null);
  const [newName, setNewName] = React.useState("");
  const [addError, setAddError] = React.useState("");

  const errors = stageErrors(list);
  const removed = saved.filter((s) => !list.some((x) => x.id === s.id));
  const changed = JSON.stringify(list) !== JSON.stringify(saved);
  const countIn = (id: string) => leads.filter((l) => l.stage === id || moves[l.stage] === id).length;

  const patch = (id: string, p: Partial<PipelineStage>) => setList((prev) => prev.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const shift = (i: number, d: -1 | 1) => setList((prev) => { const n = [...prev]; [n[i], n[i + d]] = [n[i + d], n[i]]; return n; });

  const remove = (id: string, to?: string) => {
    setList((prev) => prev.filter((s) => s.id !== id));
    if (to) setMoves((prev) => ({ ...Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, v === id ? to : v])), [id]: to }));
    setRemoving(null);
  };
  const askRemove = (s: PipelineStage) => {
    if (countIn(s.id) === 0) remove(s.id);
    else setRemoving({ id: s.id, to: list.find((x) => x.id !== s.id)!.id });
  };

  const add = () => {
    const name = newName.trim();
    const probe = stageErrors([...list, { id: "_new", label: name, tone: "info" }])["_new"];
    if (probe) { setAddError(probe); return; }
    setList((prev) => [...prev, { id: newId("stg"), label: name, tone: STAGE_TONES[prev.length % STAGE_TONES.length].tone }]);
    setNewName(""); setAddError("");
  };

  const save = () => {
    saveStages(list, moves);
    const moved = removed.reduce((t, s) => t + leads.filter((l) => l.stage === s.id).length, 0);
    toast.success(moved ? `Stages saved · ${moved} lead${moved === 1 ? "" : "s"} moved` : "Stages saved");
    onClose();
  };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title="Pipeline stages"
      subtitle="Leads move through these stages from left to right. Changes apply to everyone's pipeline."
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={!changed || Object.keys(errors).length > 0 || !!removing}>Save changes</Button>
      </>}
    >
      <ol className="flex flex-col gap-3 m-0 p-0 list-none" aria-label="Open stages">
        {list.map((s, i) => {
          const n = countIn(s.id);
          const confirming = removing?.id === s.id;
          return (
            <li key={s.id} className={cn("rounded-xl border-[1.5px] bg-[var(--card)] p-4 flex flex-col gap-3", confirming ? "border-[var(--destructive)]" : errors[s.id] ? "border-[var(--destructive)]/60" : "border-[var(--border)]")}>
              <div className="flex items-center gap-2">
                <span className="w-6 text-center text-[0.8rem] font-bold text-[var(--muted-foreground)]">{i + 1}</span>
                <input aria-label={`Stage ${i + 1} name`} value={s.label} onChange={(e) => patch(s.id, { label: e.target.value })}
                  className="flex-1 min-w-0 h-10 px-3 rounded-md border-[1.5px] border-[var(--input)] bg-[var(--background)] text-[0.92rem] font-semibold focus:outline-none focus:border-[var(--ring)]" />
                <IconBtn label={`Move ${s.label} up`} disabled={i === 0} onClick={() => shift(i, -1)}><ArrowUp className="w-4 h-4" /></IconBtn>
                <IconBtn label={`Move ${s.label} down`} disabled={i === list.length - 1} onClick={() => shift(i, 1)}><ArrowDown className="w-4 h-4" /></IconBtn>
                <IconBtn label={`Remove ${s.label}`} danger disabled={list.length === 1 || confirming} onClick={() => askRemove(s)}><Trash2 className="w-4 h-4" /></IconBtn>
              </div>
              {errors[s.id] && <p className="m-0 ml-8 text-[0.78rem] text-[var(--destructive)]">{errors[s.id]}</p>}
              <div className="flex items-center justify-between gap-3 ml-8">
                <div role="radiogroup" aria-label={`${s.label} colour`} className="flex items-center gap-1.5">
                  {STAGE_TONES.map((t) => (
                    <button key={t.tone} type="button" role="radio" aria-checked={s.tone === t.tone} aria-label={t.name} title={t.name} onClick={() => patch(s.id, { tone: t.tone })}
                      className={cn("w-5 h-5 rounded-full flex items-center justify-center ring-offset-2 ring-offset-[var(--card)]", DOT[t.tone], s.tone === t.tone && "ring-2 ring-[var(--ring)]")} />
                  ))}
                </div>
                <span className="text-[0.78rem] text-[var(--muted-foreground)]">{plural(n, "lead")}</span>
              </div>
              {confirming && (
                <div className="ml-8 rounded-lg bg-[rgba(239,68,68,.06)] p-3 flex flex-col gap-2.5">
                  <p className="m-0 text-[0.85rem]"><b>{n} lead{n === 1 ? " is" : "s are"} in {s.label}.</b> Choose where they go before the stage is removed.</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[0.82rem] font-semibold">Move them to</span>
                    <Select ariaLabel="Move leads to" className="w-[180px] h-9" options={list.filter((x) => x.id !== s.id).map((x) => x.label)}
                      value={list.find((x) => x.id === removing!.to)?.label} onChange={(label) => setRemoving({ id: s.id, to: list.find((x) => x.label === label)!.id })} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" onClick={() => remove(s.id, removing!.to)}>Remove stage</Button>
                    <Button size="sm" variant="outline" onClick={() => setRemoving(null)}>Keep it</Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-4 rounded-xl border-[1.5px] border-dashed border-[var(--border)] p-4">
        <label htmlFor="new-stage" className="text-[0.85rem] font-bold block mb-1.5">Add a stage</label>
        <div className="flex gap-2">
          <input id="new-stage" value={newName} onChange={(e) => { setNewName(e.target.value); setAddError(""); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
            disabled={list.length >= MAX_STAGES} placeholder={list.length >= MAX_STAGES ? `Up to ${MAX_STAGES} stages` : "e.g. Demo booked"}
            className="flex-1 min-w-0 h-10 px-3 rounded-md border-[1.5px] border-[var(--input)] bg-[var(--background)] text-[0.92rem] focus:outline-none focus:border-[var(--ring)] disabled:opacity-60" />
          <Button variant="outline" onClick={add} disabled={!newName.trim() || list.length >= MAX_STAGES}><Plus className="w-4 h-4 mr-1.5" /> Add</Button>
        </div>
        {addError && <p className="m-0 mt-1.5 text-[0.78rem] text-[var(--destructive)]">{addError}</p>}
        <p className="m-0 mt-1.5 text-[0.78rem] text-[var(--muted-foreground)]">New stages go to the end. Use the arrows to place them.</p>
      </div>

      <div className="mt-6">
        <div className="text-[0.75rem] font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">Fixed stages</div>
        {[{ s: WON_STAGE, why: "Reached by converting the lead into a customer." }, { s: LOST_STAGE, why: "Reached with Mark as lost, which records a reason." }].map(({ s, why }) => (
          <div key={s.id} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--background)] border border-[var(--border)] mb-2">
            <Lock className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
            <span aria-hidden className={cn("w-2.5 h-2.5 rounded-full", DOT[s.tone])} />
            <div className="flex-1"><div className="font-heading font-semibold text-[0.9rem]">{s.label}</div><div className="text-[0.78rem] text-[var(--muted-foreground)]">{why}</div></div>
            <span className="text-[0.78rem] text-[var(--muted-foreground)]">{plural(leads.filter((l) => l.stage === s.id).length, "lead")}</span>
          </div>
        ))}
      </div>

      {removed.length > 0 && (
        <p className="mt-4 mb-0 text-[0.82rem] text-[var(--muted-foreground)] flex items-start gap-1.5">
          <ArrowRight className="w-4 h-4 shrink-0 mt-0.5" />
          On save: {removed.map((s) => `${s.label} is removed${moves[s.id] ? ` and its leads move to ${list.find((x) => x.id === moves[s.id])?.label}` : ""}`).join("; ")}.
        </p>
      )}
    </Drawer>
  );
}

function IconBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}
      className={cn("w-9 h-9 shrink-0 rounded-md border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)] disabled:opacity-35 disabled:cursor-not-allowed",
        danger ? "hover:text-[var(--destructive)] hover:border-[var(--destructive)]" : "hover:text-[var(--foreground)] hover:border-[var(--foreground)]/40")}>
      {children}
    </button>
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
