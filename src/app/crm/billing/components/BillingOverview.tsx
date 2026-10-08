"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock, AlertCircle, RotateCcw, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BarList } from "@/components/ui/BarList";
import { cn } from "@/lib/utils";
import { daysUntil, formatMoney, formatRelative } from "@/lib/format";
import { monthlyValue, useCustomers } from "@/lib/mock/customers";
import { BILLING_MODEL_LABEL, useBundles, usePlans, type BillingModel } from "@/lib/mock/catalogue";
import {
  STAGES, billingModelOf, getDunningState, lastAttemptAt, paymentStatus, usePauses, usePayments, usePolicies,
} from "@/lib/mock/billing";
import { formatDateTime } from "./PaymentsView";

const PERIODS = [{ label: "Last 30 days", days: 30 }, { label: "Last 90 days", days: 90 }, { label: "Last 12 months", days: 365 }];
const STALE_AFTER_DAYS = 14;

export function BillingOverview() {
  const payments = usePayments();
  const customers = useCustomers();
  const policies = usePolicies();
  const pauses = usePauses();
  const plans = usePlans();
  const bundles = useBundles();
  const [period, setPeriod] = React.useState("Last 90 days");
  const days = PERIODS.find((p) => p.label === period)!.days;

  const ageDays = (iso: string) => -daysUntil(iso.slice(0, 10));
  const inPeriod = payments.filter((p) => ageDays(lastAttemptAt(p)) <= days);
  const by = (s: string) => inPeriod.filter((p) => paymentStatus(p) === s);
  const sum = (list: typeof payments) => list.reduce((t, p) => t + p.amount, 0);
  const everFailed = inPeriod.filter((p) => p.kind === "Subscription" && p.attempts.some((a) => a.status === "Failed"));
  const recovered = everFailed.filter((p) => paymentStatus(p) === "Paid");
  const recovery = everFailed.length ? Math.round((recovered.length / everFailed.length) * 100) : 0;

  const dunning = customers.map((c) => ({ c, s: getDunningState(c, policies, pauses) })).filter((x) => x.s);
  const overdue = dunning.filter((x) => x.s!.daysPastDue > 0);
  const newest = payments.reduce<string | undefined>((m, p) => (!m || lastAttemptAt(p) > m ? lastAttemptAt(p) : m), undefined);
  const uncoveredModels = (Object.keys(BILLING_MODEL_LABEL) as BillingModel[]).filter((m) => !policies.some((p) => p.status === "Live" && p.billingModels.includes(m)) && customers.some((c) => c.status === "Active" && billingModelOf(c) === m));

  // Weekly collected (single series, one hue).
  const weeks = Math.min(13, Math.ceil(days / 7));
  const weekly = Array.from({ length: weeks }, (_, i) => {
    const from = (weeks - i) * 7, to = (weeks - i - 1) * 7;
    const amount = sum(payments.filter((p) => paymentStatus(p) === "Paid" && ageDays(lastAttemptAt(p)) < from && ageDays(lastAttemptAt(p)) >= to));
    return { label: to === 0 ? "This wk" : `${to / 7}w ago`, amount };
  });
  const weekMax = Math.max(1, ...weekly.map((w) => w.amount));

  const tiles = [
    { label: "Collected", value: formatMoney(sum(by("Paid"))), sub: `${by("Paid").length} payments`, icon: CheckCircle2, tone: "text-[var(--success)] bg-[rgba(31,157,115,.1)]", href: "/crm/billing/payments?status=Paid" },
    { label: "Failed", value: formatMoney(sum(by("Failed"))), sub: `${by("Failed").length} orders still unpaid`, icon: XCircle, tone: "text-[var(--destructive)] bg-[rgba(239,68,68,.1)]", href: "/crm/billing/payments?status=Failed" },
    { label: "Pending", value: formatMoney(sum(by("Pending"))), sub: `${by("Pending").length} awaiting confirmation`, icon: Clock, tone: "text-[var(--warning)] bg-[rgba(245,158,11,.12)]", href: "/crm/billing/payments?status=Pending" },
    { label: "Overdue now", value: String(overdue.length), sub: `${formatMoney(overdue.reduce((t, x) => t + monthlyValue(x.c, bundles, plans), 0))}/mo at risk`, icon: AlertCircle, tone: "text-[var(--destructive)] bg-[rgba(239,68,68,.1)]", href: "/crm/billing/collections" },
    { label: "Recovery rate", value: `${recovery}%`, sub: `${recovered.length} of ${everFailed.length} failed orders later paid`, icon: RotateCcw, tone: "text-[var(--info)] bg-[rgba(59,130,246,.1)]", href: "/crm/billing/payments?status=Paid" },
  ];

  const recentFailed = payments.filter((p) => paymentStatus(p) === "Failed").slice(0, 5);
  const byCicod = new Map(customers.map((c) => [c.cicod, c]));

  return (
    <div className="max-w-[1600px] w-full mx-auto">
      <PageHeader
        title="Billing overview"
        subtitle="How collections are going. Every number opens the payments or customers behind it."
        actions={<Select ariaLabel="Period" value={period} onChange={setPeriod} options={PERIODS.map((p) => p.label)} className="w-[170px] h-10" />}
      />

      <div className="flex flex-col gap-4 mb-6">
        {newest && ageDays(newest) > STALE_AFTER_DAYS && (
          <Alert tone="warning" title={`No payments received for ${ageDays(newest)} days`}>
            The last payment arrived {formatRelative(newest.slice(0, 10))}. Check the payment gateway connection before trusting these numbers.
          </Alert>
        )}
        {uncoveredModels.length > 0 && (
          <Alert tone="warning" title={`${uncoveredModels.map((m) => BILLING_MODEL_LABEL[m]).join(", ")} customers aren't chased`} actions={<Link href="/crm/billing/dunning"><Button size="sm">Fix coverage</Button></Link>}>
            No live dunning policy covers this billing model, so late payers never get a reminder.
          </Alert>
        )}
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="group bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm p-5 flex flex-col gap-3 hover:border-[var(--primary)] transition-colors">
            <div className="flex items-center justify-between">
              <span className={cn("w-9 h-9 rounded-full flex items-center justify-center", t.tone)}><t.icon className="w-4 h-4" /></span>
              <ArrowRight className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
            </div>
            <div className="min-w-0">
              <div className="text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{t.label}</div>
              <div className="font-heading font-extrabold text-[1.45rem] leading-tight mt-1 truncate">{t.value}</div>
              <div className="text-[0.78rem] text-[var(--muted-foreground)]">{t.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <Panel title="Collected per week" subtitle={`${formatMoney(weekly.reduce((t, w) => t + w.amount, 0))} in the last ${weeks} weeks`}>
          {/* Single series: one hue, value on hover, labels in text ink */}
          <div className="h-[200px] flex items-end gap-2" role="img" aria-label="Collected per week bar chart">
            {weekly.map((w) => (
              <div key={w.label} className="flex-1 min-w-0 flex flex-col items-center gap-2 h-full justify-end group" title={`${w.label}: ${formatMoney(w.amount)}`}>
                <span className="text-[0.68rem] font-mono text-[var(--foreground)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{w.amount ? `₦${Math.round(w.amount / 1000)}k` : ""}</span>
                <div className="w-full max-w-[36px] rounded-t-[4px] bg-[var(--primary)] group-hover:opacity-80 transition-opacity" style={{ height: `${Math.max(w.amount ? 3 : 0, (w.amount / weekMax) * 150)}px` }} />
                <span className="text-[0.62rem] text-[var(--muted-foreground)] whitespace-nowrap overflow-hidden text-ellipsis max-w-full">{w.label}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Customers in the dunning cycle" subtitle={`${dunning.length} customers · click a stage to open Collections`}>
          <BarList
            rows={STAGES.map((st) => {
              const n = dunning.filter((x) => x.s!.stage === st.id).length;
              return { key: st.id, label: st.label, value: n, display: String(n), href: `/crm/billing/collections?stage=${st.id}` };
            })}
            max={Math.max(1, ...STAGES.map((st) => dunning.filter((x) => x.s!.stage === st.id).length))}
            unit="customers"
          />
        </Panel>
      </div>

      <Panel title="Latest failed payments" action={<Link href="/crm/billing/payments?status=Failed" className="text-[0.85rem] font-semibold text-[var(--primary)]">View all</Link>}>
        {recentFailed.length === 0 ? <p className="m-0 text-[0.88rem] text-[var(--muted-foreground)]">No failed payments.</p> : (
          <ul className="divide-y divide-[var(--border)] -my-2">
            {recentFailed.map((p) => {
              const c = byCicod.get(p.cicod);
              const last = p.attempts[p.attempts.length - 1];
              return (
                <li key={p.orderId}>
                  <Link href={`/crm/customer-mgt/customers/${p.cicod}?tab=billing`} className="flex items-center justify-between gap-4 py-3 hover:text-[var(--primary)]">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{c?.company}</div>
                      <div className="text-[0.8rem] text-[var(--muted-foreground)]">{last.reason} · {p.attempts.length} attempt{p.attempts.length === 1 ? "" : "s"} · {formatDateTime(last.at)}</div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="font-mono">{formatMoney(p.amount)}</span>
                      <StatusBadge status="Failed" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Panel({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[0.95rem] font-heading font-bold m-0">{title}</h2>
          {subtitle && <p className="m-0 text-[0.8rem] text-[var(--muted-foreground)]">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}
