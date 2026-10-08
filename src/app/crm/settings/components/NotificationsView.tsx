"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Mail, MessageSquare, Pencil, Bell } from "lucide-react";
import { Table, TableActionsCell, TableActionsHead, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { RowActionsMenu } from "@/components/ui/RowActionsMenu";
import { PageHeader } from "@/components/ui/PageHeader";
import { Drawer } from "@/components/ui/Drawer";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { fillTemplate, useTemplates, type Template } from "@/lib/mock/messaging";
import { updateNotification, useNotifications, type NotificationRule } from "@/lib/mock/settings";
import { Switch } from "./shared";

const BUILT_IN = "Built-in message (not editable)";
/** A template fits when it was written for the kind of message this event sends. */
const mismatch = (n: NotificationRule, t?: Template) => !!t && n.expects !== "Internal" && t.category !== n.expects;

export function NotificationsView() {
  const rules = useNotifications();
  const templates = useTemplates();
  const [editing, setEditing] = React.useState<NotificationRule | null>(null);
  const bad = rules.filter((n) => n.enabled && mismatch(n, templates.find((t) => t.id === n.templateId)));
  const noTemplate = rules.filter((n) => n.enabled && !n.templateId && n.expects !== "Internal");

  return (
    <div className="max-w-[1600px] w-full mx-auto">
      <PageHeader title="Notifications" subtitle="Messages the CRM sends by itself when something happens. This replaces the old Triggers screen, which never loaded." />

      <Alert tone="info" className="mb-6" title="Payment reminders live in Billing" actions={<Link href="/crm/billing/dunning"><Button size="sm" variant="outline">Dunning policies</Button></Link>}>
        Reminders before and after a renewal are set per billing model in Dunning policies, so they are not repeated here.
      </Alert>
      {bad.length > 0 && (
        <Alert tone="warning" className="mb-6" title={`${bad.length} notification${bad.length === 1 ? " uses" : "s use"} a template written for something else`}>
          {bad.map((n) => `${n.event} expects a ${n.expects} message`).join("; ")}. Pick a better template or write one in Messaging.
        </Alert>
      )}
      {noTemplate.length > 0 && (
        <Alert tone="warning" className="mb-6" title={`${noTemplate.map((n) => n.event).join(", ")} ${noTemplate.length === 1 ? "is" : "are"} on with no template`}>
          The CRM falls back to a plain built-in message. Choose a template so the wording is yours.
        </Alert>
      )}

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <Table className="min-w-full border-none shadow-none rounded-none">
            <TableHeader><TableRow className="hover:bg-transparent">
              {["Event", "Sent to", "Message", "On"].map((h) => <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>)}
              <TableActionsHead />
            </TableRow></TableHeader>
            <TableBody>
              {rules.map((n) => {
                const t = templates.find((x) => x.id === n.templateId);
                return (
                  <TableRow key={n.id} onClick={() => setEditing(n)} className="cursor-pointer group">
                    <TableCell>
                      <div className={cn("font-semibold group-hover:text-[var(--primary)]", !n.enabled && "text-[var(--muted-foreground)]")}>{n.event}</div>
                      <div className="text-[0.8rem] text-[var(--muted-foreground)]">{n.when}</div>
                    </TableCell>
                    <TableCell className="text-[0.88rem] whitespace-nowrap">{n.recipients}</TableCell>
                    <TableCell className="text-[0.88rem]">
                      <span className="flex items-center gap-1.5">{n.channel === "email" ? <Mail className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}{t ? t.name : <span className="text-[var(--muted-foreground)]">Built-in message</span>}</span>
                      {mismatch(n, t) && <span className="text-[0.78rem] text-[var(--warning)] font-semibold flex items-center gap-1 mt-0.5"><AlertTriangle className="w-3.5 h-3.5" /> Written for {t!.category}</span>}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Switch checked={n.enabled} label={`${n.event} on`} onChange={(v) => { updateNotification(n.id, { enabled: v }, v ? "Turned on" : "Turned off"); toast.success(`${n.event} ${v ? "on" : "off"}`); }} />
                    </TableCell>
                    <TableActionsCell><RowActionsMenu label={`Actions for ${n.event}`} actions={[{ label: "Edit message", icon: Pencil, onSelect: () => setEditing(n) }]} /></TableActionsCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {editing && <EditDrawer rule={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function EditDrawer({ rule, onClose }: { rule: NotificationRule; onClose: () => void }) {
  const templates = useTemplates();
  const [channel, setChannel] = React.useState(rule.channel);
  const [templateId, setTemplateId] = React.useState(rule.templateId);
  const options = templates.filter((t) => t.channel === channel);
  const t = options.find((x) => x.id === templateId);
  const label = (x: Template) => `${x.name} · ${x.category}`;
  const changed = channel !== rule.channel || templateId !== rule.templateId;
  const save = () => {
    updateNotification(rule.id, { channel, templateId }, `Message set to ${t ? t.name : "built-in"} (${channel === "email" ? "email" : "SMS"})`);
    toast.success(`${rule.event} saved`);
    onClose();
  };
  return (
    <Drawer isOpen onClose={onClose} title={rule.event} subtitle={`${rule.when} · to ${rule.recipients.toLowerCase()}`}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!changed}>Save</Button></>}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-[0.85rem] font-bold">Channel</span>
          <div role="radiogroup" aria-label="Channel" className="flex items-center bg-[var(--muted)] p-1.5 rounded-lg w-max gap-1">
            {(["email", "sms"] as const).map((c) => (
              <button key={c} type="button" role="radio" aria-checked={channel === c} onClick={() => { setChannel(c); setTemplateId(null); }}
                className={cn("px-5 py-2 rounded-md font-heading font-semibold text-[0.85rem] flex items-center gap-1.5", channel === c ? "bg-[var(--card)] shadow-sm" : "text-[var(--muted-foreground)]")}>
                {c === "email" ? <Mail className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}{c === "email" ? "Email" : "SMS"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[0.85rem] font-bold">Template</span>
          <Select ariaLabel="Template" value={t ? label(t) : BUILT_IN} options={[BUILT_IN, ...options.map(label)]} onChange={(v) => setTemplateId(v === BUILT_IN ? null : options.find((x) => label(x) === v)!.id)} />
          {rule.expects !== "Internal" && <span className="text-[0.78rem] text-[var(--muted-foreground)]">Best fit: a {rule.expects} template.</span>}
          {mismatch(rule, t) && <span className="text-[0.8rem] text-[var(--warning)] font-semibold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> This template is written for {t!.category}, not {rule.expects}.</span>}
        </div>
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="px-4 py-2.5 bg-[var(--background)] border-b border-[var(--border)] text-[0.8rem] font-bold flex items-center gap-1.5"><Bell className="w-4 h-4 text-[var(--primary)]" /> Preview</div>
          <div className="p-4 text-[0.86rem] leading-relaxed whitespace-pre-line">
            {t ? <>{t.subject && <div className="font-semibold mb-2">{fillTemplate(t.subject, {})}</div>}{fillTemplate(t.body, {})}</>
              : <span className="text-[var(--muted-foreground)]">CICOD: {rule.event}. Sign in to see the details.</span>}
          </div>
        </div>
        <Link href="/crm/growth/messaging" className="text-[0.84rem] font-semibold text-[var(--primary)]">Write or edit templates in Messaging</Link>
      </div>
    </Drawer>
  );
}
