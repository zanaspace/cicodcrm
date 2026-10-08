"use client";

import * as React from "react";
import { Plus, Mail, MessageSquare, Pencil, AlertTriangle, Save, FileText } from "lucide-react";
import { Table, TableActionsCell, TableActionsHead, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RowActionsMenu } from "@/components/ui/RowActionsMenu";
import { PageHeader } from "@/components/ui/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Drawer } from "@/components/ui/Drawer";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { CURRENT_USER, daysFromToday, formatDate, newId } from "@/lib/format";
import { CATEGORIES, SMS_SEGMENT, VARIABLES, fillTemplate, upsertTemplate, useTemplates, type Template, type TemplateCategory } from "@/lib/mock/messaging";
import { dunningUsage, usePolicies } from "@/lib/mock/billing";
import { campaignStatus, useCampaigns } from "@/lib/mock/growth";

type Usage = { dunning: { policy: string; step: string }[]; campaigns: { name: string; status: string }[] };

/** A template used for payment steps must be written for billing; anything else reads wrong to a late payer. */
export function mismatch(t: Template, u: Usage) {
  return u.dunning.length > 0 && t.category !== "Billing" ? `Used for payment reminders (${u.dunning.map((d) => `${d.policy} › ${d.step}`).join(", ")}) but written for ${t.category}` : null;
}

export function TemplatesView() {
  const templates = useTemplates();
  const policies = usePolicies();
  const campaigns = useCampaigns();
  const [editing, setEditing] = React.useState<Template | "new" | null>(null);

  const usage = (t: Template): Usage => ({
    dunning: dunningUsage(policies.filter((p) => p.status === "Live"), t.id),
    campaigns: campaigns.filter((c) => c.templateId === t.id).map((c) => ({ name: c.name, status: campaignStatus(c) })),
  });
  const problems = templates.map((t) => ({ t, issue: mismatch(t, usage(t)) })).filter((x) => x.issue);

  return (
    <div className="max-w-[1600px] w-full mx-auto">
      <PageHeader
        title="Message templates"
        subtitle="One library for campaigns and payment reminders. Editing a template changes every place that uses it."
        actions={<Button onClick={() => setEditing("new")}><Plus className="w-4 h-4 mr-2" /> New template</Button>}
      />

      {problems.map(({ t, issue }) => (
        <Alert key={t.id} tone="warning" className="mb-6" title={`“${t.name}” doesn't fit where it's used`} actions={<Button size="sm" onClick={() => setEditing(t)}>Fix wording</Button>}>
          {issue}. Today it says: &ldquo;{t.body}&rdquo;
        </Alert>
      ))}

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <Table className="min-w-full border-none shadow-none rounded-none">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {["Template", "Category", "Used by", "Updated"].map((h) => <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>)}
                <TableActionsHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t) => {
                const u = usage(t);
                const issue = mismatch(t, u);
                return (
                  <TableRow key={t.id} onClick={() => setEditing(t)} className="cursor-pointer group">
                    <TableCell className="whitespace-nowrap">
                      <div className="font-semibold flex items-center gap-2 group-hover:text-[var(--primary)]">
                        {t.channel === "email" ? <Mail className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}{t.name}
                        {issue && <AlertTriangle className="w-4 h-4 text-[var(--warning)]" aria-label="Wording doesn't fit its use" />}
                      </div>
                      <div className="text-[0.8rem] text-[var(--muted-foreground)] max-w-[360px] truncate">{t.subject ?? t.body}</div>
                    </TableCell>
                    <TableCell><StatusBadge status={t.category === "Billing" ? "trial" : t.category === "Marketing" ? "Live" : "Draft"} label={t.category} dot={false} /></TableCell>
                    <TableCell className="text-[0.85rem]">
                      {u.dunning.length === 0 && u.campaigns.length === 0 ? <span className="text-[var(--muted-foreground)]">Not used</span> : (
                        <div className="flex flex-col gap-0.5">
                          {u.dunning.length > 0 && <span>{u.dunning.length} dunning step{u.dunning.length === 1 ? "" : "s"}</span>}
                          {u.campaigns.length > 0 && <span>{u.campaigns.length} campaign{u.campaigns.length === 1 ? "" : "s"}</span>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-[0.85rem] text-[var(--muted-foreground)]">{formatDate(t.updatedAt)} · {t.updatedBy}</TableCell>
                    <TableActionsCell><RowActionsMenu label={`Actions for ${t.name}`} actions={[{ label: "Edit template", icon: Pencil, onSelect: () => setEditing(t) }]} /></TableActionsCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <TemplateEditor template={editing} onClose={() => setEditing(null)} usage={editing && editing !== "new" ? usage(editing) : { dunning: [], campaigns: [] }} />
    </div>
  );
}

const inputClass = "w-full h-10 px-3 rounded-md border-[1.5px] border-[var(--input)] bg-[var(--background)] text-[0.9rem] focus:outline-none focus:border-[var(--ring)]";

function TemplateEditor({ template, onClose, usage }: { template: Template | "new" | null; onClose: () => void; usage: Usage }) {
  const [pending, setPending] = React.useState<Template | null>(null);
  const isNew = template === "new";
  const inUse = usage.dunning.length + usage.campaigns.filter((c) => c.status === "Running" || c.status === "Scheduled").length;
  const save = (t: Template) => { upsertTemplate(t); setPending(null); onClose(); toast.success(isNew ? "Template created" : "Template saved"); };
  return (
    <>
      <Drawer
        isOpen={!!template && !pending}
        onClose={onClose}
        title={isNew ? "New template" : `Edit “${(template as Template | null)?.name ?? ""}”`}
        subtitle={isNew ? "Variables in curly brackets are filled in for each recipient." : inUse ? `Used in ${inUse} live place${inUse === 1 ? "" : "s"}` : "Not used in anything live"}
        footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" form="template-form"><Save className="w-4 h-4 mr-2" /> Save</Button></>}
      >
        {template && <TemplateForm key={isNew ? "new" : (template as Template).id} template={isNew ? null : (template as Template)} usage={usage} onSave={(t) => (inUse && !isNew ? setPending(t) : save(t))} />}
      </Drawer>
      <ConfirmDialog
        isOpen={!!pending}
        onClose={() => setPending(null)}
        onConfirm={() => pending && save(pending)}
        icon={<FileText className="w-6 h-6" />}
        title="Update a template that's in use?"
        description="Every place below sends the new wording from now on."
        impact={[...usage.dunning.map((d) => `Dunning: ${d.policy} › ${d.step}`), ...usage.campaigns.filter((c) => c.status === "Running" || c.status === "Scheduled").map((c) => `Campaign: ${c.name} (${c.status})`)]}
        confirmLabel="Save template"
      />
    </>
  );
}

function TemplateForm({ template, usage, onSave }: { template: Template | null; usage: Usage; onSave: (t: Template) => void }) {
  const [t, setT] = React.useState<Template>(() => template ?? { id: newId("tpl"), channel: "email", name: "", category: "Marketing", subject: "", body: "", updatedAt: daysFromToday(0), updatedBy: CURRENT_USER });
  const [error, setError] = React.useState("");
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);
  const set = <K extends keyof Template>(k: K, v: Template[K]) => { setT((p) => ({ ...p, [k]: v })); setError(""); };
  const preview = fillTemplate(t.body, {});
  const issue = mismatch(t, usage);

  const insert = (key: string) => {
    const el = bodyRef.current;
    const at = el ? el.selectionStart : t.body.length;
    set("body", t.body.slice(0, at) + key + t.body.slice(at));
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(at + key.length, at + key.length); });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!t.name.trim()) return setError("Give the template a name");
    if (!t.body.trim()) return setError("Write the message");
    if (t.channel === "email" && !t.subject?.trim()) return setError("Emails need a subject line");
    onSave({ ...t, name: t.name.trim(), updatedAt: daysFromToday(0), updatedBy: CURRENT_USER });
  };

  return (
    <form id="template-form" onSubmit={submit} className="flex flex-col gap-5">
      {!template && (
        <div className="flex items-center bg-[var(--muted)] p-1.5 rounded-lg w-max gap-1" role="tablist" aria-label="Channel">
          {(["email", "sms"] as const).map((ch) => (
            <button key={ch} type="button" role="tab" aria-selected={t.channel === ch} onClick={() => set("channel", ch)}
              className={cn("px-4 py-1.5 rounded-md font-heading font-semibold text-[0.85rem]", t.channel === ch ? "bg-[var(--card)] shadow-sm" : "text-[var(--muted-foreground)]")}>{ch === "email" ? "Email" : "SMS"}</button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5"><span className="text-[0.85rem] font-bold">Name</span><input className={inputClass} value={t.name} onChange={(e) => set("name", e.target.value)} /></label>
        <label className="flex flex-col gap-1.5"><span className="text-[0.85rem] font-bold">Category</span><Select options={CATEGORIES} value={t.category} onChange={(c) => set("category", c as TemplateCategory)} ariaLabel="Category" /></label>
      </div>
      {issue && <p className="m-0 text-[0.82rem] text-[var(--warning)] flex gap-1.5"><AlertTriangle className="w-4 h-4 shrink-0" />{issue}. Rewrite it as a payment reminder and set the category to Billing.</p>}
      {t.channel === "email" && <label className="flex flex-col gap-1.5"><span className="text-[0.85rem] font-bold">Subject</span><input className={inputClass} value={t.subject ?? ""} onChange={(e) => set("subject", e.target.value)} /></label>}
      <label className="flex flex-col gap-1.5">
        <span className="text-[0.85rem] font-bold">Message</span>
        <textarea ref={bodyRef} rows={t.channel === "sms" ? 4 : 8} value={t.body} onChange={(e) => set("body", e.target.value)}
          className="p-3 rounded-md border-[1.5px] border-[var(--input)] bg-[var(--background)] text-[0.9rem] leading-relaxed focus:outline-none focus:border-[var(--ring)] resize-none" />
        {t.channel === "sms" && <span className={cn("text-[0.78rem]", preview.length > SMS_SEGMENT ? "text-[var(--warning)]" : "text-[var(--muted-foreground)]")}>About {preview.length} characters once filled in ({Math.max(1, Math.ceil(preview.length / SMS_SEGMENT))} SMS)</span>}
      </label>
      <div className="flex flex-col gap-1.5" role="group" aria-label="Insert a variable">
        <span className="text-[0.85rem] font-bold">Insert a variable</span>
        <div className="flex flex-wrap gap-1.5">
          {VARIABLES.map((v) => <button key={v.key} type="button" onClick={() => insert(v.key)} title={v.label} className="px-2.5 py-1 rounded-full border border-[var(--border)] text-[0.75rem] font-mono hover:border-[var(--primary)]">{v.key}</button>)}
        </div>
      </div>
      <div className="rounded-lg border border-[var(--border)] overflow-hidden">
        <div className="px-4 py-2 bg-[var(--background)] text-[0.75rem] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Preview with sample details</div>
        <div className="p-4 text-[0.85rem] whitespace-pre-line leading-relaxed">
          {t.channel === "email" && t.subject && <div className="font-semibold mb-2">{fillTemplate(t.subject, {})}</div>}
          {preview || <span className="text-[var(--muted-foreground)]">Start typing to see the message.</span>}
        </div>
      </div>
      {error && <p role="alert" className="m-0 text-[0.85rem] text-[var(--destructive)]">{error}</p>}
    </form>
  );
}
