"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import {
  BUNDLE_GROUPS, CURRENCIES, PERIODS, PRODUCTS, pricingGaps, unitLabel, useBundles, usePlans,
  type BillingModel, type CatalogueStatus, type Price,
} from "@/lib/mock/catalogue";

type Row = { key: string; href: string; name: string; code: string; status: CatalogueStatus; model: BillingModel; prices: Price[] };

export function PricingView() {
  const router = useRouter();
  const plans = usePlans();
  const bundles = useBundles();
  const [tab, setTab] = React.useState<"plans" | "bundles">("plans");
  const [gapsOnly, setGapsOnly] = React.useState(false);

  const sections: { title: string; rows: Row[] }[] = tab === "plans"
    ? PRODUCTS.map((p) => ({
        title: p.name,
        rows: plans.filter((x) => x.productCode === p.code && x.status !== "Archived").sort((a, b) => a.priority - b.priority)
          .map((x) => ({ key: x.code, href: `/crm/catalogue/plans/${x.code}`, name: x.name, code: x.code, status: x.status, model: x.billingModel, prices: x.prices })),
      }))
    : BUNDLE_GROUPS.map((g) => ({
        title: g.name,
        rows: bundles.filter((x) => x.groupKey === g.key && x.status !== "Archived")
          .map((x) => ({ key: x.code, href: `/crm/catalogue/bundles/${x.code}`, name: x.name, code: x.code, status: x.status, model: x.billingModel, prices: x.prices })),
      }));

  const hasGap = (r: Row) => pricingGaps(r.prices).length > 0 || !r.prices.some((p) => p.currency === "NGN" && p.period === "MONTHLY");
  const gapCount = sections.flatMap((s) => s.rows).filter(hasGap).length;

  return (
    <div className="max-w-[1600px] w-full mx-auto">
      <PageHeader title="Pricing" subtitle="Every live and draft price in one place. Missing prices are highlighted. Click a row to edit it." />

      <div className="flex items-center justify-between mb-6">
        <div role="tablist" className="flex items-center bg-[var(--muted)] p-1.5 rounded-lg gap-1">
          {(["plans", "bundles"] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
              className={cn("px-5 py-2 rounded-md font-heading font-semibold text-[0.85rem] transition-all", tab === t ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]")}>
              {t === "plans" ? "Plans" : "Bundles"}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[0.85rem] font-semibold cursor-pointer">
          <input type="checkbox" checked={gapsOnly} onChange={(e) => setGapsOnly(e.target.checked)} className="w-4 h-4 accent-[var(--primary)]" />
          Only show rows with gaps <span className="px-1.5 rounded-full bg-[rgba(245,158,11,.15)] text-[var(--warning)] text-[0.75rem] font-bold">{gapCount}</span>
        </label>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-[0.88rem]">
          <thead className="bg-[var(--background)]">
            <tr>
              <th rowSpan={2} className="px-5 text-left font-heading text-[0.75rem] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">{tab === "plans" ? "Plan" : "Bundle"}</th>
              <th rowSpan={2} className="px-4 text-left font-heading text-[0.75rem] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
              {CURRENCIES.map((c) => <th key={c} colSpan={2} className="pt-3 px-4 text-center font-heading text-[0.75rem] font-semibold text-[var(--foreground)] uppercase tracking-wider border-l border-[var(--border)]">{c}</th>)}
            </tr>
            <tr>
              {CURRENCIES.flatMap((c) => PERIODS.map((p, i) => (
                <th key={c + p} className={cn("pb-3 px-4 text-right font-heading text-[0.7rem] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider", i === 0 && "border-l border-[var(--border)]")}>{p === "MONTHLY" ? "Monthly" : "Annual"}</th>
              )))}
            </tr>
          </thead>
          {sections.map((s) => {
            const rows = gapsOnly ? s.rows.filter(hasGap) : s.rows;
            if (rows.length === 0) return null;
            return (
              <tbody key={s.title}>
                <tr><td colSpan={2 + CURRENCIES.length * 2} className="px-5 pt-5 pb-2 font-heading font-bold text-[0.85rem] border-t border-[var(--border)]">{s.title}</td></tr>
                {rows.map((r) => {
                  const partial = new Set(CURRENCIES.filter((c) => { const n = r.prices.filter((p) => p.currency === c && p.amount > 0).length; return n === 1; }));
                  return (
                    <tr key={r.key} onClick={() => router.push(r.href)} className="border-t border-[var(--border)] cursor-pointer hover:bg-[var(--accent)] transition-colors">
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="font-semibold">{r.name}</span> <span className="font-mono text-[0.75rem] text-[var(--muted-foreground)]">{r.code}</span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      {CURRENCIES.flatMap((c) => PERIODS.map((p, i) => {
                        const amount = r.prices.find((x) => x.currency === c && x.period === p)?.amount;
                        const missing = !amount && (partial.has(c) || (c === "NGN" && p === "MONTHLY"));
                        return (
                          <td key={c + p} className={cn("px-4 py-3 text-right font-mono whitespace-nowrap", i === 0 && "border-l border-[var(--border)]", missing && "bg-[rgba(245,158,11,.08)]")}>
                            {amount ? <>{formatMoney(amount, c)}<span className="text-[0.7rem] text-[var(--muted-foreground)] font-sans">{unitLabel(r.model)}</span></>
                              : missing ? <span className="inline-flex items-center gap-1 text-[var(--warning)] font-sans text-[0.78rem] font-semibold"><AlertTriangle className="w-3.5 h-3.5" /> Missing</span>
                              : <span className="text-[var(--muted-foreground)]/60">—</span>}
                          </td>
                        );
                      }))}
                    </tr>
                  );
                })}
              </tbody>
            );
          })}
        </table>
      </div>
    </div>
  );
}
