"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, SearchX } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { daysUntil, formatDate, formatMoney, formatRelative } from "@/lib/format";
import {
  LIFECYCLE_STAGES, getHealth, logActivity, monthlyValue, subscriptionLabel, updateCustomer, useCustomers,
  type Customer,
} from "@/lib/mock/customers";
import { useBundles, usePlans } from "@/lib/mock/catalogue";
import { STAGES, getDunningState, usePauses, usePolicies } from "@/lib/mock/billing";
import { CustomerHeader } from "./CustomerHeader";
import { RecordPaymentModal } from "@/app/crm/billing/components/actions";
import { CustomerTabs, resolveTab } from "./CustomerTabs";
import { ProfileInformation } from "./ProfileInformation";
import { ContactPersons } from "./ContactPersons";
import { BusinessStructure } from "./BusinessStructure";
import { AttachedFiles } from "./AttachedFiles";
import { SubscriptionTab } from "./SubscriptionTab";
import { BillingHistoryTab } from "./BillingHistoryTab";
import { UserManagementTab } from "./UserManagementTab";
import { TicketsTab } from "./TicketsTab";
import { ActivityTab } from "./ActivityTab";

export function CustomerView({ id, tab }: { id: string; tab?: string }) {
  const router = useRouter();
  const customers = useCustomers();
  const customer = customers.find((c) => c.cicod === id || c.domain === id);
  const activeTab = resolveTab(tab);

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-3 py-24 border border-dashed border-[var(--border)] rounded-xl bg-[var(--card)]">
        <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center"><SearchX className="w-5 h-5 text-[var(--primary)]" /></div>
        <p className="font-heading font-bold text-[1.1rem] m-0">No customer with ID “{id}”</p>
        <p className="text-[var(--muted-foreground)] m-0">It may have been removed, or the link is wrong.</p>
        <Link href="/crm/customer-mgt/customers"><Button variant="outline">Back to customers</Button></Link>
      </div>
    );
  }

  const goTab = (t: string) => router.push(`/crm/customer-mgt/customers/${customer.cicod}?tab=${t}`, { scroll: false });

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] w-full mx-auto">
      <CustomerHeader customer={customer} onCreateTicket={() => goTab("tickets")} />
      <HealthAlert customer={customer} />
      <KpiStrip customer={customer} />
      <CustomerTabs activeTab={activeTab} customerId={customer.cicod} counts={{ tickets: customer.openTickets }} />

      <div key={activeTab} className="animate-in fade-in duration-300">
        {activeTab === "overview" && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 flex flex-col gap-6">
              <OnboardingCard customer={customer} />
              <ProfileInformation customer={customer} />
              <ContactPersons customer={customer} />
            </div>
            <div className="col-span-1 flex flex-col gap-6">
              <BusinessStructure />
              <AttachedFiles />
            </div>
          </div>
        )}
        {activeTab === "billing" && (
          <div className="flex flex-col gap-6">
            <SubscriptionTab customer={customer} />
            <BillingHistoryTab customer={customer} />
          </div>
        )}
        {activeTab === "users" && <UserManagementTab />}
        {activeTab === "tickets" && <TicketsTab />}
        {activeTab === "activity" && <ActivityTab customer={customer} />}
      </div>
    </div>
  );
}

/** One alert, the most urgent one, using the style guide's alert pattern. */
function HealthAlert({ customer }: { customer: Customer }) {
  const plans = usePlans();
  const bundles = useBundles();
  const policies = usePolicies();
  const pauses = usePauses();
  const health = getHealth(customer);
  const dunning = getDunningState(customer, policies, pauses);
  const [recording, setRecording] = React.useState(false);
  const amount = formatMoney(monthlyValue(customer, bundles, plans));

  if (health.id === "suspended") {
    const why = customer.activity.find((a) => a.kind === "status" && a.title.includes("suspended"));
    return (
      <Alert tone="destructive" title="This customer is suspended">
        {why?.body ?? "Users can't sign in."} Use the ⋯ menu to reactivate them.
      </Alert>
    );
  }
  if (health.id === "overdue") {
    const stageLabel = dunning ? STAGES.find((s) => s.id === dunning.stage)?.label : undefined;
    return (
      <>
      <Alert
        tone="destructive"
        title={`Renewal overdue by ${health.days} day${health.days === 1 ? "" : "s"}`}
        actions={<><Link href={`/crm/billing/collections?stage=${dunning?.stage ?? ""}`}><Button variant="outline" size="sm">Open in Collections</Button></Link><Button size="sm" onClick={() => setRecording(true)}>Record payment</Button></>}
      >
        {amount} was due on {formatDate(customer.subscription.renewsAt)}.
        {customer.subscription.lastPaymentAt ? ` Last payment ${formatRelative(customer.subscription.lastPaymentAt)}.` : " No payment has been recorded yet."}
        {dunning && (
          <span className="block mt-1 font-semibold">
            Dunning: {stageLabel}{dunning.lastStep && dunning.lastStepAt ? ` (${dunning.lastStep.type.toLowerCase()} ${formatRelative(dunning.lastStepAt)})` : ""} · {dunning.next}
          </span>
        )}
      </Alert>
      <RecordPaymentModal customer={customer} isOpen={recording} onClose={() => setRecording(false)} />
      </>
    );
  }
  if (health.id === "trial_ending") {
    return (
      <Alert
        tone="warning"
        title={`Trial ends ${health.days === 0 ? "today" : `in ${health.days} day${health.days === 1 ? "" : "s"}`}`}
        actions={<Button size="sm" onClick={() => { logActivity(customer.cicod, { kind: "note", title: "Trial reminder sent" }); toast.success("Trial reminder sent"); }}>Send reminder</Button>}
      >
        They move to paid billing ({amount}/month) on {formatDate(customer.subscription.trialEndsAt)}.
      </Alert>
    );
  }
  if (customer.lifecycle !== "provisioned" && daysUntil(customer.createdAt) <= -14) {
    return (
      <Alert tone="warning" title={`Onboarding has been open for ${-daysUntil(customer.createdAt)} days`}>
        The workspace isn’t provisioned yet. Check the onboarding steps below and follow up with the primary contact.
      </Alert>
    );
  }
  return null;
}

function KpiStrip({ customer }: { customer: Customer }) {
  const plans = usePlans();
  const bundles = useBundles();
  const sub = subscriptionLabel(customer.subscription, bundles, plans);
  const maxUsers = sub.item && "maxUsers" in sub.item ? sub.item.maxUsers : undefined;
  const s = customer.subscription;
  const items = [
    { label: "Plan", value: sub.name, sub: sub.group },
    { label: "Monthly value", value: formatMoney(monthlyValue(customer, bundles, plans)), sub: `${s.period === "ANNUALLY" ? "Billed annually" : "Billed monthly"}` },
    { label: "Users", value: `${s.users}${maxUsers ? ` / ${maxUsers}` : ""}`, sub: maxUsers ? "licences used" : "licences" },
    { label: s.trialEndsAt ? "Trial ends" : "Next renewal", value: formatDate(s.trialEndsAt ?? s.renewsAt), sub: formatRelative(s.trialEndsAt ?? s.renewsAt) },
    { label: "Last payment", value: s.lastPaymentAt ? formatDate(s.lastPaymentAt) : "None yet", sub: s.lastPaymentAt ? formatRelative(s.lastPaymentAt) : "No payment recorded" },
  ];
  return (
    <div className="grid grid-cols-5 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm divide-x divide-[var(--border)]">
      {items.map((k) => (
        <div key={k.label} className="px-5 py-4 min-w-0">
          <div className="text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{k.label}</div>
          <div className="mt-1 font-heading font-bold text-[1.05rem] text-[var(--foreground)] truncate" title={k.value}>{k.value}</div>
          <div className="text-[0.8rem] text-[var(--muted-foreground)] truncate">{k.sub}</div>
        </div>
      ))}
    </div>
  );
}

function OnboardingCard({ customer }: { customer: Customer }) {
  const idx = LIFECYCLE_STAGES.findIndex((s) => s.id === customer.lifecycle);
  const next = LIFECYCLE_STAGES[idx + 1];
  const reachedAt = (stageId: string, i: number) =>
    i === 0 ? customer.createdAt : customer.activity.find((a) => a.kind === "lifecycle" && a.title.includes(LIFECYCLE_STAGES.find((s) => s.id === stageId)!.label))?.at;

  const advance = () => {
    if (!next) return;
    updateCustomer(customer.cicod, { lifecycle: next.id });
    logActivity(customer.cicod, { kind: "lifecycle", title: `Moved to "${next.label}"` });
    toast.success(`Marked as “${next.label}”`);
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between">
        <h3 className="text-[0.95rem] font-heading font-bold m-0">Onboarding</h3>
        {next ? (
          <Button size="sm" variant="outline" onClick={advance}>Mark “{next.label}”</Button>
        ) : (
          <span className="text-[0.8rem] font-semibold text-[var(--success)] flex items-center gap-1"><Check className="w-4 h-4" /> Complete</span>
        )}
      </div>
      <ol className="p-6 grid grid-cols-4 gap-2">
        {LIFECYCLE_STAGES.map((s, i) => {
          const done = i <= idx;
          const current = i === idx + 1;
          const at = done ? reachedAt(s.id, i) : undefined;
          return (
            <li key={s.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[0.75rem] font-bold ${done ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : current ? "border-2 border-[var(--primary)] text-[var(--primary)]" : "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>
                  {done ? <Check className="w-4 h-4" /> : i + 1}
                </span>
                {i < LIFECYCLE_STAGES.length - 1 && <span className={`h-0.5 flex-1 rounded-full ${i < idx ? "bg-[var(--primary)]" : "bg-[var(--muted)]"}`} />}
              </div>
              <span className={`text-[0.85rem] font-semibold ${done || current ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}>{s.label}</span>
              <span className="text-[0.75rem] text-[var(--muted-foreground)]">{at ? formatDate(at) : current ? "Next step" : ""}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
