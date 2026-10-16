"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, ShieldAlert, ShieldCheck, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback/States";
import { usePermissions } from "@/lib/permissions";
import type { Customer } from "@/lib/mock/customers";
import { BILLING_MODEL_LABEL, type BillingModel } from "@/lib/mock/catalogue";
import { billingModelOf, getDunningState, type DunningPolicy, type Pause } from "@/lib/mock/billing";
import { usePausesQuery, usePoliciesQuery } from "@/features/billing/queries";
import { useCustomersQuery } from "@/features/customers/queries";
import { NO_EDIT } from "./actions";
import { useBundlesQuery, usePlansQuery } from "@/features/catalogue/queries";
import { Timeline } from "./Timeline";

const MODELS = Object.keys(BILLING_MODEL_LABEL) as BillingModel[];

const TITLE = "Dunning policies";
const SUBTITLE = "The rules that chase late payments: when reminders go out, how long the grace period is, and what happens after.";

export function DunningView() {
  const policiesQuery = usePoliciesQuery();
  const customersQuery = useCustomersQuery();
  const pausesQuery = usePausesQuery();
  const queries = [policiesQuery, customersQuery, pausesQuery];
  const failed = queries.find((q) => q.isError);

  if (failed) {
    return (
      <div className="max-w-[1600px] w-full mx-auto">
        <PageHeader title={TITLE} subtitle={SUBTITLE} />
        <ErrorState error={failed.error} onRetry={() => queries.forEach((q) => q.isError && q.refetch())} />
      </div>
    );
  }
  if (!policiesQuery.data || !customersQuery.data || !pausesQuery.data) {
    return (
      <div className="max-w-[1600px] w-full mx-auto">
        <PageHeader title={TITLE} subtitle={SUBTITLE} />
        <LoadingState label="Loading dunning policies" />
      </div>
    );
  }
  return <Policies policies={policiesQuery.data} customers={customersQuery.data} pauses={pausesQuery.data} />;
}

function Policies({ policies, customers, pauses }: { policies: DunningPolicy[]; customers: Customer[]; pauses: Record<string, Pause> }) {
  const catalogue = { plans: usePlansQuery().data ?? [], bundles: useBundlesQuery().data ?? [] };
  const { can } = usePermissions();
  const canEdit = can("billing", "edit");
  const live = policies.filter((p) => p.status === "Live");
  const coveredBy = (m: BillingModel) => live.find((p) => p.billingModels.includes(m));
  const uncovered = MODELS.filter((m) => !coveredBy(m));
  const customersOn = (models: BillingModel[]) => customers.filter((c) => c.status === "Active" && models.includes(billingModelOf(c, catalogue) as BillingModel));

  return (
    <div className="max-w-[1600px] w-full mx-auto">
      <PageHeader
        title={TITLE}
        subtitle={SUBTITLE}
        actions={canEdit
          ? <Link href="/crm/billing/dunning/new"><Button><Plus className="w-4 h-4 mr-2" /> New policy</Button></Link>
          : <Button disabled title={NO_EDIT}><Plus className="w-4 h-4 mr-2" /> New policy</Button>}
      />

      {/* Coverage strip */}
      <section className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm p-5 mb-6 flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-3">
          {uncovered.length ? <ShieldAlert className="w-6 h-6 text-[var(--warning)]" /> : <ShieldCheck className="w-6 h-6 text-[var(--success)]" />}
          <div>
            <div className="font-heading font-bold">Coverage: {MODELS.length - uncovered.length} of {MODELS.length} billing models</div>
            <div className="text-[0.82rem] text-[var(--muted-foreground)]">{uncovered.length ? "Customers on uncovered billing models never receive reminders." : "Every billing model has a live policy."}</div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap ml-auto">
          {MODELS.map((m) => {
            const p = coveredBy(m);
            return (
              <span key={m} className={cn("px-3 py-1.5 rounded-full border text-[0.8rem] font-semibold", p ? "border-[var(--border)] bg-[var(--background)]" : "border-[rgba(245,158,11,.5)] bg-[rgba(245,158,11,.08)] text-[var(--foreground)]")}>
                {BILLING_MODEL_LABEL[m]} · <span className={p ? "text-[var(--success)]" : "text-[var(--warning)]"}>{p ? p.name : "not covered"}</span>
              </span>
            );
          })}
        </div>
      </section>

      {policies.length === 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm mb-6">
          <EmptyState title="No dunning policies yet" description="Late payers aren't chased until a policy is live. Start one for each billing model below." />
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(440px,1fr))] gap-4">
        {policies.map((p) => {
          const covered = customersOn(p.billingModels);
          const now = covered.filter((c) => getDunningState(c, policies, pauses, catalogue)?.policy?.id === p.id).length;
          return (
            <Link key={p.id} href={`/crm/billing/dunning/${p.id}`} className="group bg-[var(--card)] border-[1.5px] border-[var(--border)] rounded-xl shadow-sm p-5 flex flex-col gap-4 hover:border-[var(--primary)] transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-heading font-extrabold text-[1.05rem]">{p.name}</div>
                  <div className="text-[0.8rem] text-[var(--muted-foreground)]">Applies to {p.billingModels.map((m) => BILLING_MODEL_LABEL[m].toLowerCase()).join(", ")}</div>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <Timeline steps={p.steps} graceDays={p.graceDays} autoSuspend={p.autoSuspend} compact />
              <div className="pt-3 border-t border-[var(--border)] grid grid-cols-3 text-[0.8rem]">
                <span><b className="font-heading text-[0.95rem]">{covered.length}</b> <span className="text-[var(--muted-foreground)]">customers covered</span></span>
                <span><b className="font-heading text-[0.95rem]">{now}</b> <span className="text-[var(--muted-foreground)]">in dunning now</span></span>
                <span className={p.autoSuspend ? "text-[var(--destructive)] font-semibold" : "text-[var(--muted-foreground)]"}>{p.autoSuspend ? "Suspends automatically" : "Suspension reviewed"}</span>
              </div>
              <div className="text-[0.75rem] text-[var(--muted-foreground)]">Updated {formatDate(p.updatedAt)} by {p.updatedBy}</div>
            </Link>
          );
        })}

        {uncovered.map((m) => (
          <div key={m} className="rounded-xl border-[1.5px] border-dashed border-[rgba(245,158,11,.6)] p-5 flex flex-col gap-3 justify-center">
            <div className="font-heading font-bold">{BILLING_MODEL_LABEL[m]}: no policy</div>
            <p className="m-0 text-[0.85rem] text-[var(--muted-foreground)]">{customersOn([m]).length} active customer{customersOn([m]).length === 1 ? " is" : "s are"} on {BILLING_MODEL_LABEL[m].toLowerCase()} plans and will never be reminded or chased.</p>
            <div className="flex gap-2">
              {!canEdit ? <span className="text-[0.8rem] text-[var(--muted-foreground)]">{NO_EDIT}</span> : null}
              {canEdit && live[0] && <Link href={`/crm/billing/dunning/new?model=${m}&from=${live[0].id}`}><Button size="sm"><Copy className="w-3.5 h-3.5 mr-1.5" /> Copy “{live[0].name}”</Button></Link>}
              {canEdit && <Link href={`/crm/billing/dunning/new?model=${m}`}><Button size="sm" variant="outline">Start blank</Button></Link>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
