"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, UserPlus, Eye, MailX, MailCheck, Inbox } from "lucide-react";
import { Table, TableActionsCell, TableActionsHead, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RowActionsMenu } from "@/components/ui/RowActionsMenu";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { CURRENT_USER, formatDate } from "@/lib/format";
import { addLead, linkSubscriber, setSubscriberStatus, useLeads, useSubscribers, type Subscriber } from "@/lib/mock/growth";
import { StageBadge } from "./stages";

const TABS = ["All", "Subscribed", "Unsubscribed", "Not a lead yet"] as const;

export function SubscribersView() {
  const router = useRouter();
  const subscribers = useSubscribers();
  const leads = useLeads();
  const [tab, setTab] = React.useState<(typeof TABS)[number]>("All");
  const [query, setQuery] = React.useState("");
  const [unsub, setUnsub] = React.useState<Subscriber | null>(null);

  const test = (s: Subscriber, t: (typeof TABS)[number]) => t === "All" || (t === "Not a lead yet" ? !s.leadId && s.status === "Subscribed" : s.status === t);
  const rows = subscribers.filter((s) => test(s, tab) && (!query || s.email.includes(query.toLowerCase()))).sort((a, b) => b.subscribedAt.localeCompare(a.subscribedAt));

  const createLead = (s: Subscriber) => {
    const company = s.email.split("@")[1].split(".")[0].replace(/^\w/, (c) => c.toUpperCase());
    const lead = addLead({ company, contact: "", designation: "", email: s.email, phone: "", sector: "Others", state: "", source: s.source === "Event" ? "Event" : "Website", owner: CURRENT_USER, stage: "new", interest: "Not stated (newsletter sign-up)", estMonthly: 0, nextFollowUp: null });
    linkSubscriber(s.email, lead.id);
    toast.success(`Lead created for ${s.email}`);
    router.push(`/crm/growth/leads/${lead.id}`);
  };

  return (
    <div className="max-w-[1600px] w-full mx-auto">
      <PageHeader title="Subscribers" subtitle="People who signed up for CICOD updates. Turn the interested ones into leads; respect unsubscribes." />

      <div role="tablist" className="flex items-center bg-[var(--muted)] p-1.5 rounded-lg w-full gap-1 mb-6">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={cn("flex-1 justify-center px-4 py-2 rounded-md font-heading font-semibold text-[0.85rem] flex items-center gap-2", tab === t ? "bg-[var(--card)] shadow-sm" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]")}>
            {t}<span className="min-w-6 px-1.5 py-0.5 rounded-full text-[0.72rem] font-bold bg-[var(--card)]/60">{subscribers.filter((s) => test(s, t)).length}</span>
          </button>
        ))}
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm flex flex-col">
        <div className="p-6 border-b border-[var(--border)]">
          <label htmlFor="sub-search" className="text-[0.85rem] font-bold block mb-1.5">Global Search</label>
          <div className="relative w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[var(--muted-foreground)]" />
            <input id="sub-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Email"
              className="w-full h-[2.8rem] pl-10 pr-4 rounded-[8px] border-[1.5px] border-[var(--input)] bg-[var(--card)] text-[0.95rem] focus:outline-none focus:border-[var(--ring)]" />
          </div>
        </div>
        <div className="w-full overflow-x-auto">
          <Table className="min-w-full border-none shadow-none rounded-none">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {["Email", "Source", "Signed up", "Status", "Lead"].map((h) => <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>)}
                <TableActionsHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow className="hover:bg-transparent"><TableCell colSpan={6} className="py-16 text-center"><div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center mb-3 mx-auto"><Inbox className="w-5 h-5 text-[var(--primary)]" /></div><p className="font-semibold m-0">Nobody here</p></TableCell></TableRow>
              ) : rows.map((s) => {
                const lead = leads.find((l) => l.id === s.leadId);
                return (
                  <TableRow key={s.email} onClick={() => lead && router.push(`/crm/growth/leads/${lead.id}`)} className={cn(lead && "cursor-pointer")}>
                    <TableCell className="font-medium whitespace-nowrap">{s.email}</TableCell>
                    <TableCell className="text-[0.88rem]">{s.source}</TableCell>
                    <TableCell className="whitespace-nowrap text-[0.85rem] text-[var(--muted-foreground)]">{formatDate(s.subscribedAt)}</TableCell>
                    <TableCell><StatusBadge status={s.status === "Subscribed" ? "Active" : "Archived"} label={s.status} /></TableCell>
                    <TableCell className="whitespace-nowrap">{lead ? <StageBadge stage={lead.stage} suffix={lead.owner ?? "unassigned"} /> : <span className="text-[0.85rem] text-[var(--muted-foreground)]">Not a lead</span>}</TableCell>
                    <TableActionsCell>
                      <RowActionsMenu label={`Actions for ${s.email}`} actions={[
                        ...(lead ? [{ label: "Open lead", icon: Eye, onSelect: () => router.push(`/crm/growth/leads/${lead.id}`) }] : s.status === "Subscribed" ? [{ label: "Create lead", icon: UserPlus, onSelect: () => createLead(s) }] : []),
                        s.status === "Subscribed"
                          ? { label: "Unsubscribe", icon: MailX, danger: true, onSelect: () => setUnsub(s) }
                          : { label: "Resubscribe (they asked)", icon: MailCheck, onSelect: () => { setSubscriberStatus(s.email, "Subscribed"); toast.success(`${s.email} resubscribed`); } },
                      ]} />
                    </TableActionsCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!unsub}
        onClose={() => setUnsub(null)}
        onConfirm={() => { if (unsub) { setSubscriberStatus(unsub.email, "Unsubscribed"); toast.success(`${unsub.email} unsubscribed`); } setUnsub(null); }}
        tone="danger"
        icon={<MailX className="w-6 h-6" />}
        title={`Unsubscribe ${unsub?.email}?`}
        description="They stop receiving marketing campaigns. Billing and account emails still go out."
        confirmLabel="Unsubscribe"
      />
    </div>
  );
}
