"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Receipt, Package, PlusCircle, Send, Banknote } from "lucide-react";
import { RecordPaymentModal } from "@/app/crm/billing/components/actions";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { formatDate, formatMoney, formatRelative } from "@/lib/format";
import { getHealth, logActivity, monthlyValue, subscriptionLabel, type Customer } from "@/lib/mock/customers";
import { BILLING_MODEL_LABEL, PERIOD_LABEL, productByCode, useBundles, usePlans } from "@/lib/mock/catalogue";

export function SubscriptionTab({ customer }: { customer: Customer }) {
  const plans = usePlans();
  const bundles = useBundles();
  const [confirmInvoice, setConfirmInvoice] = useState(false);
  const [recording, setRecording] = useState(false);
  const s = customer.subscription;
  const sub = subscriptionLabel(s, bundles, plans);
  const health = getHealth(customer);
  const value = monthlyValue(customer, bundles, plans);
  const invoiceTotal = s.period === "ANNUALLY" ? value * 12 : value;
  const included = sub.item && "planCodes" in sub.item
    ? sub.item.planCodes.map((code) => plans.find((p) => p.code === code)).filter(Boolean)
    : [];

  const send = () => {
    logActivity(customer.cicod, { kind: "invoice", title: "Invoice sent", body: `${formatMoney(invoiceTotal)} invoice emailed to ${customer.email}.` });
    setConfirmInvoice(false);
    toast.success(`Invoice sent to ${customer.email}`);
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 flex flex-col gap-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between">
            <h3 className="text-[0.95rem] font-heading font-bold m-0 flex items-center gap-2">
              <Package className="w-4 h-4 text-[var(--primary)]" /> Current subscription
            </h3>
            <StatusBadge status={health.id} label={health.label} />
          </div>

          <div className="p-6 grid grid-cols-4 gap-y-6 gap-x-6">
            <Fact label={s.kind === "bundle" ? "Bundle group" : "Product"} value={sub.group} />
            <Fact label={s.kind === "bundle" ? "Bundle" : "Plan"} value={sub.name} href={sub.item ? (s.kind === "bundle" ? `/crm/catalogue/bundles/${sub.item.code}` : `/crm/catalogue/plans/${sub.item.code}`) : undefined} />
            <Fact label="Billing" value={`${PERIOD_LABEL[s.period]} · ${sub.item ? BILLING_MODEL_LABEL[sub.item.billingModel] : ""}`} />
            <Fact label="Users" value={`${s.users}${sub.item && "maxUsers" in sub.item ? ` of ${sub.item.maxUsers}` : ""}`} />
            <Fact label="Started" value={formatDate(s.startedAt)} />
            {s.trialEndsAt ? (
              <Fact label="Trial ends" value={`${formatDate(s.trialEndsAt)} (${formatRelative(s.trialEndsAt)})`} wide />
            ) : (
              <Fact label="Next renewal" value={`${formatDate(s.renewsAt)} (${formatRelative(s.renewsAt)})`} wide tone={health.id === "overdue" ? "danger" : undefined} />
            )}
            <Fact label="Storage" value={sub.item && "storageGb" in sub.item ? `${sub.item.storageGb.toLocaleString()} GB` : "Standard"} />
          </div>

          {included.length > 0 && (
            <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--background)]">
              <div className="text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Included in this bundle</div>
              <div className="flex flex-wrap gap-2">
                {included.map((p) => (
                  <Link key={p!.code} href={`/crm/catalogue/plans/${p!.code}`} className="px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] text-[0.8rem] font-medium hover:border-[var(--primary)] transition-colors">
                    {productByCode(p!.productCode)?.name} · {p!.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between">
            <h3 className="text-[0.95rem] font-heading font-bold m-0 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-[var(--primary)]" /> Add-ons
            </h3>
          </div>
          {s.addOns.length === 0 ? (
            <p className="px-6 py-6 m-0 text-[0.88rem] text-[var(--muted-foreground)]">No add-ons on this subscription.</p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {s.addOns.map((a) => (
                <li key={a.name} className="px-6 py-4 flex items-center justify-between text-[0.9rem]">
                  <span className="font-medium">{a.name}</span>
                  <span className="text-[var(--muted-foreground)]">{formatMoney(a.amount)} / {a.frequency === "MONTHLY" ? "month" : "year"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="col-span-1">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]">
            <h3 className="text-[0.95rem] font-heading font-bold m-0 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[var(--primary)]" /> {health.id === "overdue" ? "Outstanding invoice" : "Next invoice"}
            </h3>
          </div>
          <div className="p-6 flex flex-col gap-4">
            <span className={`text-[1.1rem] font-heading font-extrabold ${health.id === "overdue" ? "text-[var(--destructive)]" : "text-[var(--foreground)]"}`}>
              {health.id === "overdue" ? "Was due" : "Due"} {formatDate(s.trialEndsAt ?? s.renewsAt)}
            </span>
            <div className="flex items-center justify-between text-[0.85rem]">
              <span className="text-[var(--muted-foreground)]">{sub.name} × {s.users}</span>
              <span className="font-bold font-mono">{formatMoney(invoiceTotal - s.addOns.reduce((t, a) => t + a.amount, 0) * (s.period === "ANNUALLY" ? 12 : 1))}</span>
            </div>
            {s.addOns.map((a) => (
              <div key={a.name} className="flex items-center justify-between text-[0.85rem]">
                <span className="text-[var(--muted-foreground)]">{a.name}</span>
                <span className="font-bold font-mono">{formatMoney(a.amount * (s.period === "ANNUALLY" ? 12 : 1))}</span>
              </div>
            ))}
            <div className="h-px bg-[var(--border)]" />
            <div className="flex items-center justify-between">
              <span className="text-[0.85rem] font-bold">Total</span>
              <span className="text-[1rem] font-bold font-mono">{formatMoney(invoiceTotal)}</span>
            </div>
            {s.trialEndsAt && <p className="m-0 text-[0.8rem] text-[var(--info)]">Free until the trial ends.</p>}
            <Button onClick={() => setConfirmInvoice(true)} className="mt-2"><Send className="w-4 h-4 mr-2" /> Send invoice</Button>
            <Button variant="outline" onClick={() => setRecording(true)}><Banknote className="w-4 h-4 mr-2" /> Record offline payment</Button>
            <Link href={`/crm/billing/payments?q=${customer.cicod}&range=All+time`} className="text-center text-[0.82rem] font-semibold text-[var(--primary)]">View all payments</Link>
          </div>
        </div>
      </div>

      <RecordPaymentModal customer={customer} isOpen={recording} onClose={() => setRecording(false)} />
      <ConfirmDialog
        isOpen={confirmInvoice}
        onClose={() => setConfirmInvoice(false)}
        onConfirm={send}
        icon={<Send className="w-6 h-6" />}
        title="Send invoice?"
        description={<>A {formatMoney(invoiceTotal)} invoice will be emailed to <b>{customer.email}</b>.</>}
        confirmLabel="Send invoice"
      />
    </div>
  );
}

function Fact({ label, value, href, wide, tone }: { label: string; value: string; href?: string; wide?: boolean; tone?: "danger" }) {
  return (
    <div className={`flex flex-col gap-1.5 min-w-0 ${wide ? "col-span-2" : ""}`}>
      <span className="text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{label}</span>
      {href ? (
        <Link href={href} className="text-[0.9rem] font-medium text-[var(--primary)] hover:underline truncate">{value}</Link>
      ) : (
        <span className={`text-[0.9rem] font-medium truncate ${tone === "danger" ? "text-[var(--destructive)]" : "text-[var(--foreground)]"}`}>{value}</span>
      )}
    </div>
  );
}
