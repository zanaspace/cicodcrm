"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Users, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { BUNDLE_GROUPS, headlinePrice, productByCode, unitLabel, useBundles, usePlans } from "@/lib/mock/catalogue";

export function BundlesView({ showArchived }: { showArchived: boolean }) {
  const bundles = useBundles();
  const plans = usePlans();
  const archivedCount = bundles.filter((b) => b.status === "Archived").length;
  const visible = bundles.filter((b) => showArchived || b.status !== "Archived");

  return (
    <div className="max-w-[1600px] w-full mx-auto">
      <PageHeader
        title="Bundles"
        subtitle="Packages of plans from several products, sold at one price. Grouped by bundle group."
        actions={
          <>
            {archivedCount > 0 && (
              <Link href={showArchived ? "/crm/catalogue/bundles" : "/crm/catalogue/bundles?archived=1"}>
                <Button variant="outline">{showArchived ? "Hide archived" : `Show archived (${archivedCount})`}</Button>
              </Link>
            )}
            <Link href="/crm/catalogue/bundles/new"><Button><Plus className="w-4 h-4 mr-2" /> New bundle</Button></Link>
          </>
        }
      />

      <div className="flex flex-col gap-8">
        {BUNDLE_GROUPS.map((g) => {
          const items = visible.filter((b) => b.groupKey === g.key);
          return (
            <section key={g.key} aria-labelledby={`grp-${g.key}`}>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <h2 id={`grp-${g.key}`} className="text-[1.05rem] font-heading font-bold m-0">{g.name}</h2>
                  <p className="text-[0.85rem] text-[var(--muted-foreground)] m-0 mt-0.5">{g.description}</p>
                </div>
                <Link href={`/crm/catalogue/bundles/new?group=${g.key}`} className="text-[0.85rem] font-semibold text-[var(--primary)] flex items-center gap-1"><Plus className="w-4 h-4" /> Add to {g.name}</Link>
              </div>
              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-[0.85rem] text-[var(--muted-foreground)]">No bundles in this group yet.</div>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
                  {items.map((b) => {
                    const hp = headlinePrice(b.prices);
                    const included = b.planCodes.map((c) => plans.find((p) => p.code === c)).filter(Boolean);
                    return (
                      <Link key={b.code} href={`/crm/catalogue/bundles/${b.code}`}
                        className={cn("group flex flex-col rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--card)] p-5 shadow-sm transition-colors hover:border-[var(--primary)]", b.status === "Archived" && "opacity-70")}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-heading font-extrabold text-[1.05rem]">{b.name}</span>
                          <StatusBadge status={b.status} />
                        </div>
                        <span className="font-mono text-[0.75rem] text-[var(--muted-foreground)] mt-0.5">{b.code}</span>
                        <div className="mt-3 flex items-baseline gap-1">
                          <span className="font-heading font-extrabold text-[1.3rem]">{hp ? formatMoney(hp.amount, hp.currency) : "—"}</span>
                          <span className="text-[0.8rem] text-[var(--muted-foreground)]">{unitLabel(b.billingModel)}/mo</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {included.map((p) => (
                            <span key={p!.code} className="px-2 py-0.5 rounded-full bg-[var(--background)] border border-[var(--border)] text-[0.72rem] font-medium">
                              {productByCode(p!.productCode)?.code} · {p!.name}
                            </span>
                          ))}
                        </div>
                        <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-[0.78rem] text-[var(--muted-foreground)]">
                          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {b.minUsers}–{b.maxUsers} users</span>
                          <span className="flex items-center gap-1"><HardDrive className="w-3.5 h-3.5" /> {b.storageGb.toLocaleString()} GB</span>
                          <span>{b.customers.toLocaleString()} customers</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
