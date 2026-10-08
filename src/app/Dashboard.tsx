"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, Clock, Flag, Ban, ArrowRight, FileEdit } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { BarList } from "@/components/ui/BarList";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import { CURRENT_USER, formatMoney } from "@/lib/format";
import {
  LIFECYCLE_STAGES, SEGMENTS, getHealth, monthlyValue, subscriptionLabel, useCustomers, type Customer,
} from "@/lib/mock/customers";
import { useBundles, usePlans } from "@/lib/mock/catalogue";

const CUSTOMERS = "/crm/customer-mgt/customers";

/** Ops home: what needs attention today, each number links into the matching customer segment. */
export function Dashboard() {
  const customers = useCustomers();
  const plans = usePlans();
  const bundles = useBundles();
  const value = (c: Customer) => monthlyValue(c, bundles, plans);
  const seg = (id: string) => customers.filter(SEGMENTS.find((s) => s.id === id)!.test);

  const overdue = seg("overdue");
  const tiles = [
    { id: "overdue", label: "Renewals overdue", count: overdue.length, sub: `${formatMoney(overdue.reduce((s, c) => s + value(c), 0))}/mo at risk`, icon: AlertCircle, tone: "text-[var(--destructive)] bg-[rgba(239,68,68,.1)]" },
    { id: "trial_ending", label: "Trials ending this week", count: seg("trial_ending").length, sub: "Convert before they lapse", icon: Clock, tone: "text-[var(--warning)] bg-[rgba(245,158,11,.12)]" },
    { id: "onboarding", label: "Onboarding stuck", count: seg("onboarding").length, sub: "Open for 14+ days", icon: Flag, tone: "text-[var(--info)] bg-[rgba(59,130,246,.1)]" },
    { id: "suspended", label: "Suspended", count: seg("suspended").length, sub: "No access to CICOD apps", icon: Ban, tone: "text-[var(--muted-foreground)] bg-[var(--muted)]" },
  ];

  const funnel = LIFECYCLE_STAGES.map((s) => ({ ...s, count: customers.filter((c) => c.status === "Active" && c.lifecycle === s.id).length }));
  const funnelMax = Math.max(1, ...funnel.map((f) => f.count));

  const byGroup = Object.entries(
    customers.filter((c) => c.status === "Active").reduce<Record<string, number>>((acc, c) => {
      const g = subscriptionLabel(c.subscription, bundles, plans).group;
      acc[g] = (acc[g] ?? 0) + value(c);
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const groupMax = Math.max(1, ...byGroup.map(([, v]) => v));
  const totalMrr = byGroup.reduce((s, [, v]) => s + v, 0);

  const attention = [...overdue].sort((a, b) => value(b) - value(a)).slice(0, 5);
  const drafts = [...plans.filter((p) => p.status === "Draft").map((p) => ({ name: p.name, code: p.code, href: `/crm/catalogue/plans/${p.code}`, kind: "Plan" })),
    ...bundles.filter((b) => b.status === "Draft").map((b) => ({ name: b.name, code: b.code, href: `/crm/catalogue/bundles/${b.code}`, kind: "Bundle" }))];

  return (
    <div className="max-w-[1600px] w-full mx-auto">
      <PageHeader title={`Welcome back, ${CURRENT_USER.split(" ")[0]}`} subtitle="What needs your attention across CICOD customers today." />

      {/* Status tiles: icon + label + number, each opens the matching segment */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {tiles.map((t) => (
          <Link key={t.id} href={`${CUSTOMERS}?segment=${t.id}`} className="group bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm p-5 flex flex-col gap-3 hover:border-[var(--primary)] transition-colors">
            <div className="flex items-center justify-between">
              <span className={cn("w-9 h-9 rounded-full flex items-center justify-center", t.tone)}><t.icon className="w-4 h-4" /></span>
              <ArrowRight className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
            </div>
            <div>
              <div className="font-heading font-extrabold text-[2rem] leading-none text-[var(--foreground)]">{t.count}</div>
              <div className="font-heading font-semibold text-[0.9rem] mt-2">{t.label}</div>
              <div className="text-[0.8rem] text-[var(--muted-foreground)]">{t.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <Panel title="Onboarding pipeline" subtitle="Active customers by onboarding stage">
          <BarList
            rows={funnel.map((f) => ({ key: f.id, label: f.label, value: f.count, display: String(f.count), href: `${CUSTOMERS}?lifecycle=${encodeURIComponent(f.label)}` }))}
            max={funnelMax}
            unit="customers"
          />
        </Panel>
        <Panel title="Monthly value by bundle group / product" subtitle={`${formatMoney(totalMrr)} per month from active customers`}>
          <BarList
            rows={byGroup.map(([g, v]) => ({ key: g, label: g, value: v, display: formatMoney(v), href: `${CUSTOMERS}?offering=${encodeURIComponent(g)}` }))}
            max={groupMax}
            unit="per month"
          />
        </Panel>
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-6">
        <Panel title="Biggest overdue renewals" action={<Link href={`${CUSTOMERS}?segment=overdue`} className="text-[0.85rem] font-semibold text-[var(--primary)]">View all</Link>}>
          {attention.length === 0 ? <p className="m-0 text-[0.88rem] text-[var(--muted-foreground)]">Nothing overdue. 🎉</p> : (
            <ul className="divide-y divide-[var(--border)] -my-2">
              {attention.map((c) => {
                const h = getHealth(c);
                return (
                  <li key={c.cicod}>
                    <Link href={`${CUSTOMERS}/${c.cicod}`} className="flex items-center justify-between gap-4 py-3 hover:text-[var(--primary)]">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{c.company}</div>
                        <div className="text-[0.8rem] text-[var(--muted-foreground)] truncate">{subscriptionLabel(c.subscription, bundles, plans).name} · {c.contacts[0]?.name}</div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="font-mono text-[0.9rem] text-[var(--foreground)]">{formatMoney(value(c))}</span>
                        <StatusBadge status={h.id} label={h.label} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
        <Panel title="Catalogue drafts" subtitle="Not visible to customers until published">
          {drafts.length === 0 ? <p className="m-0 text-[0.88rem] text-[var(--muted-foreground)]">No drafts.</p> : (
            <ul className="flex flex-col gap-2">
              {drafts.map((d) => (
                <li key={d.code}>
                  <Link href={d.href} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition-colors">
                    <FileEdit className="w-4 h-4 text-[var(--muted-foreground)]" />
                    <span className="flex-1 min-w-0">
                      <span className="font-semibold block truncate">{d.name}</span>
                      <span className="text-[0.75rem] text-[var(--muted-foreground)]">{d.kind} · <span className="font-mono">{d.code}</span></span>
                    </span>
                    <StatusBadge status="Draft" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
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
