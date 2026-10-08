"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Send, Mail, MessageSquare, HandCoins } from "lucide-react";
import { Table, TableActionsCell, TableActionsHead, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { formatDate, formatMoney, formatRelative } from "@/lib/format";
import { monthlyValue, subscriptionLabel, useCustomers, type Customer } from "@/lib/mock/customers";
import { useBundles, usePlans } from "@/lib/mock/catalogue";
import { STAGES, getDunningState, sendReminder, usePauses, usePolicies, type DunningState, type StageId } from "@/lib/mock/billing";
import { CollectionActions } from "./actions";

const ALL = "all";

export function CollectionsView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const customers = useCustomers();
  const policies = usePolicies();
  const pauses = usePauses();
  const plans = usePlans();
  const bundles = useBundles();
  const stage = (params.get("stage") as StageId | null) ?? ALL;
  const policyFilter = params.get("policy") ?? "All policies";
  const [query, setQuery] = React.useState("");
  const [confirmBulk, setConfirmBulk] = React.useState(false);

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (!v || v === ALL || v === "All policies") next.delete(k); else next.set(k, v);
    router.replace(next.toString() ? `${pathname}?${next}` : pathname, { scroll: false });
  };

  const inDunning = React.useMemo(() => customers
    .map((c) => ({ c, s: getDunningState(c, policies, pauses) }))
    .filter((x): x is { c: Customer; s: DunningState } => !!x.s)
    // Most urgent first: furthest past due.
    .sort((a, b) => b.s.daysPastDue - a.s.daysPastDue), [customers, policies, pauses]);

  const filtered = inDunning.filter(({ c, s }) =>
    (policyFilter === "All policies" || (s.policy?.name ?? "No policy") === policyFilter) &&
    (!query || `${c.company} ${c.cicod} ${c.contacts[0]?.name}`.toLowerCase().includes(query.toLowerCase())));
  const counts = Object.fromEntries(STAGES.map((st) => [st.id, filtered.filter((x) => x.s.stage === st.id).length])) as Record<StageId, number>;
  const rows = stage === ALL ? filtered : filtered.filter((x) => x.s.stage === stage);
  const overdueValue = rows.filter((x) => x.s.daysPastDue > 0).reduce((t, x) => t + monthlyValue(x.c, bundles, plans), 0);
  const uncovered = inDunning.filter((x) => x.s.stage === "no_policy");
  const bulkTargets = rows.filter((x) => x.s.stage !== "paused");

  return (
    <div className="max-w-[1600px] w-full mx-auto">
      <PageHeader
        title="Collections"
        subtitle="Customers due in the next 7 days or overdue, and where each one is in the dunning cycle."
        actions={<Button variant="outline" disabled={bulkTargets.length === 0} onClick={() => setConfirmBulk(true)}><Send className="w-4 h-4 mr-2" /> Remind all in view ({bulkTargets.length})</Button>}
      />

      {uncovered.length > 0 && (
        <Alert
          tone="warning"
          className="mb-6"
          title={`${uncovered.length} customer${uncovered.length === 1 ? " isn't" : "s aren't"} covered by any dunning policy`}
          actions={<Link href="/crm/billing/dunning"><Button size="sm">Review policies</Button></Link>}
        >
          {uncovered.map((x) => x.c.company).join(", ")} will never get an automatic reminder.
        </Alert>
      )}

      <div role="tablist" aria-label="Dunning stage" className="flex items-center bg-[var(--muted)] p-1.5 rounded-lg w-full gap-1 overflow-x-auto mb-6">
        {[{ id: ALL, label: "All" }, ...STAGES].map((st) => {
          const active = stage === st.id;
          const n = st.id === ALL ? filtered.length : counts[st.id as StageId];
          const urgent = (st.id === "ready_to_suspend" || st.id === "no_policy") && n > 0;
          return (
            <button key={st.id} role="tab" aria-selected={active} onClick={() => setParam("stage", st.id)}
              className={`px-3 py-2 rounded-md font-heading font-semibold text-[0.82rem] transition-all whitespace-nowrap flex items-center gap-1.5 ${active ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}>
              {st.label}
              <span className={`min-w-6 px-1.5 py-0.5 rounded-full text-[0.72rem] font-bold ${urgent ? "bg-[rgba(239,68,68,.12)] text-[var(--destructive)]" : active ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "bg-[var(--card)]/60"}`}>{n}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm flex flex-col">
        <div className="p-6 flex items-end justify-between gap-4 flex-wrap border-b border-[var(--border)]">
          <div className="flex items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="col-search" className="text-[0.85rem] font-bold">Global Search</label>
              <div className="relative w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[var(--muted-foreground)]" />
                <input id="col-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Customer, CICOD # or contact"
                  className="w-full h-[2.8rem] pl-10 pr-4 rounded-[8px] border-[1.5px] border-[var(--input)] bg-[var(--card)] text-[0.95rem] focus:outline-none focus:border-[var(--ring)]" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[0.85rem] font-bold">Policy</span>
              <Select ariaLabel="Policy" value={policyFilter} onChange={(v) => setParam("policy", v)} options={["All policies", ...policies.map((p) => p.name), "No policy"]} className="w-[200px] h-[2.8rem]" />
            </div>
          </div>
          <div className="text-right">
            <div className="text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Overdue in this view</div>
            <div className="font-heading font-extrabold text-[1.3rem]">{formatMoney(overdueValue)}<span className="text-[0.8rem] font-medium text-[var(--muted-foreground)]">/month</span></div>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <Table className="min-w-full border-none shadow-none rounded-none">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {["Customer", "Bundle / Plan", "Due", "Stage", "Last message", "Next"].map((h) => <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>)}
                <TableActionsHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center mb-3 mx-auto"><HandCoins className="w-5 h-5 text-[var(--primary)]" /></div>
                    <p className="font-semibold m-0">Nobody at this stage</p>
                  </TableCell>
                </TableRow>
              ) : rows.map(({ c, s }) => {
                const sub = subscriptionLabel(c.subscription, bundles, plans);
                const stageLabel = STAGES.find((x) => x.id === s.stage)!.label;
                return (
                  <TableRow key={c.cicod} onClick={() => router.push(`/crm/customer-mgt/customers/${c.cicod}?tab=billing`)} className="cursor-pointer group">
                    <TableCell className="whitespace-nowrap">
                      <div className="font-semibold group-hover:text-[var(--primary)] transition-colors">{c.company}</div>
                      <div className="text-[0.8rem] text-[var(--muted-foreground)]"><span className="font-mono">#{c.cicod}</span> · {c.contacts[0]?.name}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="font-medium">{sub.name}</div>
                      <div className="text-[0.8rem] text-[var(--muted-foreground)]">{sub.group} · {formatMoney(monthlyValue(c, bundles, plans))}/mo</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className={`font-medium ${s.daysPastDue > 0 ? "text-[var(--destructive)]" : ""}`}>{formatDate(c.subscription.renewsAt)}</div>
                      <div className="text-[0.8rem] text-[var(--muted-foreground)]">{formatRelative(c.subscription.renewsAt)}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <StatusBadge status={s.stage} label={stageLabel} />
                      {s.policy && <div className="text-[0.75rem] text-[var(--muted-foreground)] mt-1">{s.policy.name}</div>}
                      {s.pause && <div className="text-[0.75rem] text-[var(--muted-foreground)] mt-1">{s.pause.reason}</div>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-[0.85rem]">
                      {s.lastStep ? (
                        <>
                          <div className="font-medium flex items-center gap-1.5">
                            {s.lastStep.type}
                            {s.lastStep.emailTemplate && <Mail className="w-3.5 h-3.5 text-[var(--muted-foreground)]" aria-label="Email" />}
                            {s.lastStep.smsTemplate && <MessageSquare className="w-3.5 h-3.5 text-[var(--muted-foreground)]" aria-label="SMS" />}
                          </div>
                          <div className="text-[0.8rem] text-[var(--muted-foreground)]">{s.lastStepAt ? formatRelative(s.lastStepAt) : ""}</div>
                        </>
                      ) : <span className="text-[var(--muted-foreground)]">None yet</span>}
                    </TableCell>
                    <TableCell className={`whitespace-nowrap text-[0.85rem] font-semibold ${s.stage === "ready_to_suspend" || s.stage === "no_policy" ? "text-[var(--destructive)]" : ""}`}>{s.next}</TableCell>
                    <TableActionsCell><CollectionActions customer={c} state={s} /></TableActionsCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmBulk}
        onClose={() => setConfirmBulk(false)}
        onConfirm={() => { bulkTargets.forEach(({ c }) => sendReminder(c)); setConfirmBulk(false); toast.success(`Reminder sent to ${bulkTargets.length} customers`); }}
        icon={<Send className="w-6 h-6" />}
        title={`Send a reminder to ${bulkTargets.length} customer${bulkTargets.length === 1 ? "" : "s"}?`}
        description="Each primary contact gets the reminder by email and SMS. Paused customers are skipped."
        impact={bulkTargets.slice(0, 5).map(({ c }) => c.company).concat(bulkTargets.length > 5 ? [`and ${bulkTargets.length - 5} more`] : [])}
        confirmLabel="Send reminders"
      />
    </div>
  );
}
