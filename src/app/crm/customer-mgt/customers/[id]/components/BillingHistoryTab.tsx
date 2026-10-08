"use client";

import React from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatMoney } from "@/lib/format";
import type { Customer } from "@/lib/mock/customers";
import { lastAttemptAt, paymentStatus, usePayments } from "@/lib/mock/billing";
import { formatDateTime } from "@/app/crm/billing/components/PaymentsView";

/** This customer's payments, from the same data as Billing › Payments, so both screens always agree. */
export function BillingHistoryTab({ customer }: { customer: Customer }) {
  const payments = usePayments().filter((p) => p.cicod === customer.cicod);
  const shown = payments.slice(0, 8);

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between">
        <h3 className="text-[0.95rem] font-heading font-bold m-0 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[var(--primary)]" /> Payment history
        </h3>
        {payments.length > shown.length && (
          <Link href={`/crm/billing/payments?q=${customer.cicod}&range=All+time`} className="text-[0.82rem] font-semibold text-[var(--primary)]">All {payments.length} payments</Link>
        )}
      </div>
      {shown.length === 0 ? (
        <p className="px-6 py-8 m-0 text-center text-[0.88rem] text-[var(--muted-foreground)]">
          {customer.subscription.trialEndsAt ? "No payments yet: the customer is still on a free trial." : "No payments recorded yet."}
        </p>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[var(--muted)]/50 border-b border-[var(--border)]">
              <tr>
                {["Date", "Invoice", "Type", "Method", "Amount", "Status"].map((h) => (
                  <th key={h} className={`px-6 py-3.5 text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap ${h === "Amount" ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.orderId} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--accent)] transition-colors">
                  <td className="px-6 py-3.5 text-[0.85rem] whitespace-nowrap">{formatDateTime(lastAttemptAt(p))}</td>
                  <td className="px-6 py-3.5 text-[0.85rem] font-mono whitespace-nowrap">{p.invoiceNo}</td>
                  <td className="px-6 py-3.5 text-[0.85rem]">{p.kind}</td>
                  <td className="px-6 py-3.5 text-[0.85rem] whitespace-nowrap">{p.method}{p.attempts.length > 1 ? ` · ${p.attempts.length} attempts` : ""}</td>
                  <td className="px-6 py-3.5 text-[0.85rem] font-mono text-right whitespace-nowrap">{formatMoney(p.amount)}</td>
                  <td className="px-6 py-3.5"><StatusBadge status={paymentStatus(p)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
