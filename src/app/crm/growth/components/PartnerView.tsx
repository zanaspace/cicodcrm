"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, FileText, BadgeCheck, SearchX, Building2, Users, Coins } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Alert } from "@/components/ui/Alert";
import { RowActionsMenu } from "@/components/ui/RowActionsMenu";
import { cn } from "@/lib/utils";
import { formatDate, formatMoney, formatPhone } from "@/lib/format";
import { getHealth, subscriptionLabel, useCustomers } from "@/lib/mock/customers";
import { usePayments } from "@/lib/mock/billing";
import { PARTNER_TYPE_LABEL, commissionExample, describeCommission, partnerEarnings, useCommissionPlans, useLeads, usePartners } from "@/lib/mock/growth";
import { PartnerDialogs, partnerMenu, type PartnerAction } from "./partnerActions";
import { PARTNER_BADGE } from "./PartnersView";
import { StageBadge } from "./stages";

export function PartnerView({ id }: { id: string }) {
  const partners = usePartners();
  const plans = useCommissionPlans();
  const customers = useCustomers();
  const leads = useLeads();
  usePayments(); // re-render when payments change, so earnings stay current
  const [action, setAction] = React.useState<PartnerAction | null>(null);
  const p = partners.find((x) => x.id === id);

  if (!p) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-3 py-24 border border-dashed border-[var(--border)] rounded-xl bg-[var(--card)]">
        <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center"><SearchX className="w-5 h-5 text-[var(--primary)]" /></div>
        <p className="font-heading font-bold text-[1.1rem] m-0">No partner “{id}”</p>
        <Link href="/crm/growth/partners"><Button variant="outline">Back to partners</Button></Link>
      </div>
    );
  }

  const e = partnerEarnings(p, plans);
  const referred = customers.filter((c) => p.referred.includes(c.cicod));
  const theirLeads = leads.filter((l) => l.partnerId === p.id);
  const menu = partnerMenu(p, setAction);
  const primary = menu.find((m) => !m.danger);

  return (
    <div className="max-w-[1600px] w-full mx-auto flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <Link href="/crm/growth/partners" className="inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-2"><ArrowLeft className="w-4 h-4" /> Partners</Link>
          <h1 className="text-2xl font-heading font-extrabold m-0 flex items-center gap-3 flex-wrap">{p.name}<StatusBadge status={PARTNER_BADGE[p.status]} label={p.status === "Pending" ? "Pending verification" : p.status} /></h1>
          <p className="text-[0.88rem] text-[var(--muted-foreground)] mt-1.5 mb-0">{PARTNER_TYPE_LABEL[p.type]} · {p.state || "State not set"} · joined {formatDate(p.joinedAt)}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0 pt-7">
          {primary && <Button onClick={primary.onSelect}>{primary.icon && <primary.icon className="w-4 h-4 mr-2" />}{primary.label}</Button>}
          {menu.some((m) => m.danger) && <RowActionsMenu label="More partner actions" triggerClassName="w-10 h-10" actions={menu.filter((m) => m.danger)} />}
        </div>
      </div>

      {p.status === "Pending" && (
        <Alert tone="warning" title="Waiting for verification">
          {p.documents.length ? `Check the ${p.documents.length} document${p.documents.length === 1 ? "" : "s"} below, then verify or reject.` : "No documents uploaded yet. Ask the partner for an ID (ICE) or CAC certificate (company) before verifying."}
        </Alert>
      )}

      <div className="grid grid-cols-4 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm divide-x divide-[var(--border)]">
        {[
          { label: p.type === "Delivery partner" ? "Deliveries" : "Referred customers", value: p.type === "Delivery partner" ? String(p.deliveries) : String(referred.length), sub: p.type === "Delivery partner" ? "this month" : `${theirLeads.length} open or won leads` },
          { label: "Business referred", value: `${formatMoney(e.monthly)}/mo`, sub: "current monthly value" },
          { label: "Earned, last 30 days", value: formatMoney(e.earned), sub: e.plan ? describeCommission(e.plan) : "No plan" },
          { label: "Payout account", value: p.bank ? `${p.bank} ••${p.accountLast4}` : "Not added", sub: p.bank ? "verified on file" : "needed before payout" },
        ].map((k) => (
          <div key={k.label} className="px-5 py-4 min-w-0">
            <div className="text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{k.label}</div>
            <div className="mt-1 font-heading font-bold text-[1.05rem] truncate">{k.value}</div>
            <div className="text-[0.8rem] text-[var(--muted-foreground)] truncate">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 items-start">
        <div className="col-span-2 flex flex-col gap-6">
          <Section title={p.type === "Delivery partner" ? "Deliveries" : "Referred customers"} icon={Users}>
            {p.type === "Delivery partner" ? <p className="m-0 text-[0.88rem] text-[var(--muted-foreground)]">{p.deliveries} completed deliveries this month. Delivery records come from the order system.</p>
              : referred.length === 0 ? <p className="m-0 text-[0.88rem] text-[var(--muted-foreground)]">No customers referred yet.</p> : (
              <ul className="divide-y divide-[var(--border)] -my-2 list-none p-0 m-0">
                {referred.map((c) => {
                  const h = getHealth(c);
                  return (
                    <li key={c.cicod}>
                      <Link href={`/crm/customer-mgt/customers/${c.cicod}`} className="flex items-center justify-between gap-4 py-3 hover:text-[var(--primary)]">
                        <div className="min-w-0"><div className="font-semibold">{c.company}</div><div className="text-[0.8rem] text-[var(--muted-foreground)]">{subscriptionLabel(c.subscription).name} · #{c.cicod}</div></div>
                        <StatusBadge status={h.id} label={h.label} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {theirLeads.length > 0 && (
              <div className="mt-5 pt-4 border-t border-[var(--border)]">
                <div className="text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Leads from this partner</div>
                {theirLeads.map((l) => <Link key={l.id} href={`/crm/growth/leads/${l.id}`} className="flex items-center justify-between py-1.5 text-[0.88rem] hover:text-[var(--primary)]"><span>{l.company}</span><StageBadge stage={l.stage} /></Link>)}
              </div>
            )}
          </Section>

          <Section title="Commission, last 30 days" icon={Coins}>
            {!e.plan ? <p className="m-0 text-[0.88rem]">No commission plan for this partner type.</p> : (
              <>
                <p className="m-0 text-[0.9rem]"><b>{e.plan.name}</b>: {describeCommission(e.plan)}.</p>
                <p className="m-0 mt-1 text-[0.82rem] text-[var(--muted-foreground)]">{commissionExample(e.plan)}</p>
                {e.plan.unit === "percent" && (
                  <table className="w-full mt-4 text-[0.85rem]">
                    <thead><tr className="text-left text-[0.72rem] uppercase tracking-wider text-[var(--muted-foreground)]"><th className="py-2">Payment</th><th className="py-2 text-right">Amount</th><th className="py-2 text-right">Commission</th></tr></thead>
                    <tbody>
                      {e.paid.length === 0 ? <tr><td colSpan={3} className="py-3 text-[var(--muted-foreground)]">No payments from referred customers in the last 30 days.</td></tr> : e.paid.map((x) => (
                        <tr key={x.orderId} className="border-t border-[var(--border)]">
                          <td className="py-2">{customers.find((c) => c.cicod === x.cicod)?.company} <span className="font-mono text-[var(--muted-foreground)]">{x.invoiceNo}</span></td>
                          <td className="py-2 text-right font-mono">{formatMoney(x.amount)}</td>
                          <td className="py-2 text-right font-mono">{formatMoney(Math.round(x.amount * e.plan!.value) / 100)}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-[var(--border)] font-semibold"><td className="py-2">Total</td><td className="py-2 text-right font-mono">{formatMoney(e.paidTotal)}</td><td className="py-2 text-right font-mono">{formatMoney(e.earned)}</td></tr>
                    </tbody>
                  </table>
                )}
                <Link href="/crm/growth/commission" className="inline-block mt-4 text-[0.82rem] font-semibold text-[var(--primary)]">View commission plans</Link>
              </>
            )}
          </Section>
        </div>

        <div className="col-span-1 flex flex-col gap-6">
          <Section title="Business information" icon={Building2}>
            <dl className="grid grid-cols-[90px_1fr] gap-y-2.5 text-[0.88rem] m-0">
              <dt className="text-[var(--muted-foreground)]">Email</dt><dd className="m-0 truncate">{p.email}</dd>
              <dt className="text-[var(--muted-foreground)]">Phone</dt><dd className="m-0">{p.phone ? formatPhone(p.phone) : "—"}</dd>
              <dt className="text-[var(--muted-foreground)]">State</dt><dd className="m-0">{p.state || "—"}</dd>
              <dt className="text-[var(--muted-foreground)]">Bank</dt><dd className="m-0">{p.bank ? `${p.bank} ••${p.accountLast4}` : "—"}</dd>
            </dl>
          </Section>
          <Section title="Documents" icon={FileText}>
            {p.documents.length === 0 ? <p className="m-0 text-[0.88rem] text-[var(--muted-foreground)]">No documents uploaded.</p> : (
              <ul className="flex flex-col gap-2 list-none p-0 m-0">
                {p.documents.map((d) => (
                  <li key={d.name} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)]">
                    <FileText className="w-4 h-4 text-[var(--muted-foreground)]" />
                    <span className="flex-1 min-w-0"><span className="block text-[0.85rem] font-medium truncate">{d.name}</span><span className="text-[0.75rem] text-[var(--muted-foreground)]">{d.kind}</span></span>
                    {p.status === "Verified" && <BadgeCheck className="w-4 h-4 text-[var(--success)]" aria-label="Checked" />}
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <Section title="History">
            <ol className="flex flex-col gap-3 list-none p-0 m-0">
              {p.activity.map((a, i) => (
                <li key={i} className={cn("text-[0.85rem]", i > 0 && "pt-3 border-t border-[var(--border)]")}><div className="font-medium">{a.title}</div><div className="text-[0.75rem] text-[var(--muted-foreground)]">{formatDate(a.at)} · {a.by}</div></li>
              ))}
            </ol>
          </Section>
        </div>
      </div>

      <PartnerDialogs partner={p} action={action} onClose={() => setAction(null)} />
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]"><h3 className="text-[0.95rem] font-heading font-bold m-0 flex items-center gap-2">{Icon && <Icon className="w-4 h-4 text-[var(--primary)]" />}{title}</h3></div>
      <div className="p-6">{children}</div>
    </section>
  );
}
