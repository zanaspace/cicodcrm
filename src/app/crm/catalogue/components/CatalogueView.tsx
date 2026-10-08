"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Check, Minus, Star, Users, Boxes, Package, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import {
  BILLING_MODEL_LABEL, PRODUCTS, bundlesUsingPlan, headlinePrice, unitLabel, useBundles, useFeatures, usePlans,
} from "@/lib/mock/catalogue";

const STATUS_ORDER = { Live: 0, Draft: 1, Archived: 2 };

export function CatalogueView({ productCode, showArchived }: { productCode?: string; showArchived: boolean }) {
  const plans = usePlans();
  const bundles = useBundles();
  const features = useFeatures();
  const product = PRODUCTS.find((p) => p.code === productCode) ?? PRODUCTS[0];

  const productPlans = plans
    .filter((p) => p.productCode === product.code && (showArchived || p.status !== "Archived"))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.priority - b.priority);
  const archivedCount = plans.filter((p) => p.productCode === product.code && p.status === "Archived").length;
  const productFeatures = features.filter((f) => f.productCode === product.code);
  const liveCustomers = productPlans.reduce((s, p) => s + p.customers, 0);
  const bundleCount = bundles.filter((b) => b.status !== "Archived" && b.planCodes.some((c) => productPlans.some((p) => p.code === c))).length;
  const href = (code: string, archived = showArchived) => `/crm/catalogue?product=${code}${archived ? "&archived=1" : ""}`;

  return (
    <div className="max-w-[1600px] w-full mx-auto">
      <PageHeader
        title="Products & Plans"
        subtitle="What CICOD sells, product by product. Customers subscribe to a plan directly or through a bundle."
        actions={<Link href={`/crm/catalogue/plans/new?product=${product.code}`}><Button><Plus className="w-4 h-4 mr-2" /> New plan</Button></Link>}
      />

      <div className="grid grid-cols-[260px_1fr] gap-6 items-start">
        {/* Product list */}
        <nav aria-label="Products" className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm p-2 sticky top-0">
          <div className="px-3 pt-2 pb-2 text-[0.75rem] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Products</div>
          {PRODUCTS.map((p) => {
            const live = plans.filter((x) => x.productCode === p.code && x.status === "Live").length;
            const drafts = plans.filter((x) => x.productCode === p.code && x.status === "Draft").length;
            const active = p.code === product.code;
            return (
              <Link key={p.code} href={href(p.code)} aria-current={active ? "page" : undefined}
                className={cn("flex flex-col gap-0.5 px-3 py-2.5 rounded-lg transition-colors", active ? "bg-[var(--accent)]" : "hover:bg-[var(--sidebar-accent)]")}>
                <span className={cn("text-[0.9rem] font-heading", active ? "font-bold text-[var(--foreground)]" : "font-semibold text-[var(--foreground)]")}>{p.name}</span>
                <span className="text-[0.75rem] text-[var(--muted-foreground)]">{p.code} · {live} live{drafts ? ` · ${drafts} draft` : ""}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-6 min-w-0">
          {/* Product summary */}
          <section className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm p-6 flex items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h2 className="text-[1.35rem] font-heading font-extrabold m-0">{product.name}</h2>
                <span className="font-mono text-[0.75rem] px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">{product.code}</span>
              </div>
              <p className="text-[var(--muted-foreground)] mt-1 mb-0">{product.description}</p>
              <p className="text-[0.8rem] text-[var(--muted-foreground)] mt-2 mb-0">Service <span className="font-mono">{product.serviceKey}</span> · Type {product.type}</p>
            </div>
            <dl className="grid grid-cols-3 gap-6 shrink-0 m-0">
              <Stat icon={Package} label="Plans" value={productPlans.filter((p) => p.status !== "Archived").length} />
              <Stat icon={Users} label="Customers" value={liveCustomers.toLocaleString()} />
              <Stat icon={Boxes} label="In bundles" value={bundleCount} />
            </dl>
          </section>

          {/* Plans side by side */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[1rem] font-heading font-bold m-0">Plans</h3>
              {archivedCount > 0 && (
                <Link href={href(product.code, !showArchived)} className="text-[0.85rem] font-semibold text-[var(--primary)]">
                  {showArchived ? "Hide archived" : `Show archived (${archivedCount})`}
                </Link>
              )}
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
              {productPlans.map((p) => {
                const hp = headlinePrice(p.prices);
                const used = bundlesUsingPlan(bundles, p.code).length;
                return (
                  <Link key={p.code} href={`/crm/catalogue/plans/${p.code}`}
                    className={cn("group flex flex-col rounded-xl border-[1.5px] bg-[var(--card)] p-5 shadow-sm transition-colors hover:border-[var(--primary)]", p.recommended && p.status === "Live" ? "border-[var(--primary)]/60" : "border-[var(--border)]", p.status === "Archived" && "opacity-70")}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-heading font-extrabold text-[1.05rem] flex items-center gap-1.5">
                        {p.name}{p.recommended && <Star className="w-4 h-4 fill-[var(--primary)] text-[var(--primary)]" aria-label="Recommended" />}
                      </span>
                      <StatusBadge status={p.status} />
                    </div>
                    <span className="font-mono text-[0.75rem] text-[var(--muted-foreground)] mt-0.5">{p.code}</span>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="font-heading font-extrabold text-[1.4rem]">{hp ? formatMoney(hp.amount, hp.currency) : "—"}</span>
                      <span className="text-[0.8rem] text-[var(--muted-foreground)]">{unitLabel(p.billingModel)}/mo</span>
                    </div>
                    <span className="text-[0.78rem] text-[var(--muted-foreground)]">{BILLING_MODEL_LABEL[p.billingModel]} · {p.trialDays ? `${p.trialDays}-day trial` : "No trial"}</span>
                    <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-[0.78rem] text-[var(--muted-foreground)]">
                      <span>{p.customers.toLocaleString()} customers</span>
                      <span>{used} bundle{used === 1 ? "" : "s"}</span>
                    </div>
                  </Link>
                );
              })}
              <Link href={`/crm/catalogue/plans/new?product=${product.code}`}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-[var(--border)] p-5 text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors min-h-[190px]">
                <Plus className="w-5 h-5" />
                <span className="font-heading font-semibold text-[0.9rem]">New plan</span>
                <span className="text-[0.78rem]">Starts as a draft</span>
              </Link>
            </div>
          </section>

          {/* Feature comparison (replaces the separate Product Captions page) */}
          <section className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between">
              <h3 className="text-[0.95rem] font-heading font-bold m-0 flex items-center gap-2"><ListChecks className="w-4 h-4 text-[var(--primary)]" /> Compare features</h3>
              <span className="text-[0.8rem] text-[var(--muted-foreground)]">Open a plan to change what it includes</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[0.88rem]">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="h-11 px-6 text-left font-heading text-[0.75rem] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Feature</th>
                    {productPlans.map((p) => (
                      <th key={p.code} className="h-11 px-4 text-center font-heading text-[0.75rem] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {productFeatures.map((f) => (
                    <tr key={f.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-6 py-3">{f.name}</td>
                      {productPlans.map((p) => (
                        <td key={p.code} className="px-4 py-3 text-center">
                          {p.featureIds.includes(f.id)
                            ? <Check className="w-4 h-4 inline text-[var(--success)]" aria-label="Included" />
                            : <Minus className="w-4 h-4 inline text-[var(--muted-foreground)]/60" aria-label="Not included" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start">
      <dt className="text-[0.72rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" />{label}</dt>
      <dd className="m-0 mt-1 font-heading font-extrabold text-[1.3rem]">{value}</dd>
    </div>
  );
}
