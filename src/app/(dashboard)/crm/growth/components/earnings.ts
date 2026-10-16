"use client";

import { daysUntil } from "@/lib/format";
import { lastAttemptAt, paymentStatus, type Payment } from "@/lib/mock/billing";
import { monthlyValue, type Customer } from "@/lib/mock/customers";
import type { Bundle, Plan } from "@/lib/mock/catalogue";
import type { CommissionPlan, Partner } from "@/lib/mock/growth";
import { usePaymentsQuery } from "@/features/billing/queries";
import { useCustomersQuery } from "@/features/customers/queries";
import { useBundlesQuery, usePlansQuery } from "@/features/catalogue/queries";

export type EarningsData = { payments: Payment[]; customers: Customer[]; plans?: Plan[]; bundles?: Bundle[] };

/**
 * Earnings in the last 30 days, from the payment records of the customers a partner referred.
 * Same calculation as `partnerEarnings` in the mock module, but from Query data instead of the mock stores.
 * TODO(confirm): the backend should return these figures per partner rather than the screen computing them.
 */
export function partnerEarningsFrom(p: Partner, commission: CommissionPlan[], data: EarningsData) {
  const plan = commission.find((x) => x.partnerType === p.type);
  const byCicod = new Set(p.referred);
  const paid = data.payments.filter((x) => byCicod.has(x.cicod) && paymentStatus(x) === "Paid" && -daysUntil(lastAttemptAt(x).slice(0, 10)) <= 30);
  const paidTotal = paid.reduce((t, x) => t + x.amount, 0);
  const customers = data.customers.filter((c) => byCicod.has(c.cicod));
  const monthly = customers.reduce((t, c) => t + monthlyValue(c, data.bundles, data.plans), 0);
  let earned = 0;
  if (plan?.unit === "percent") earned = (paidTotal * plan.value) / 100;
  if (plan?.unit === "per_delivery") earned = plan.value * p.deliveries;
  if (plan?.unit === "per_customer") earned = plan.value * paid.length;
  return { plan, paid, paidTotal, customers, monthly, earned: Math.round(earned * 100) / 100 };
}

/** The payments and customers the earnings figures need, loaded together. */
export function useEarningsData() {
  const payments = usePaymentsQuery();
  const customers = useCustomersQuery();
  const plans = usePlansQuery();
  const bundles = useBundlesQuery();
  const queries = [payments, customers] as const;
  const failed = queries.find((q) => q.isError);
  return {
    data: payments.data && customers.data ? { payments: payments.data, customers: customers.data, plans: plans.data, bundles: bundles.data } as EarningsData : undefined,
    isPending: queries.some((q) => q.isPending),
    isError: !!failed,
    error: failed?.error,
    refetch: () => { queries.forEach((q) => { if (q.isError) void q.refetch(); }); },
  };
}
