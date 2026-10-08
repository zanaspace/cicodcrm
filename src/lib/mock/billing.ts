"use client";

import { createStore, useStore } from "@/lib/store";
import { CURRENT_USER, daysFromToday, daysUntil, formatDate } from "@/lib/format";
import { fillTemplate } from "@/lib/mock/messaging";
import { INITIAL_BUNDLES, INITIAL_PLANS, type BillingModel, type CatalogueStatus, type Period } from "@/lib/mock/catalogue";
import {
  customersStore, logActivity, monthlyValue, subscriptionLabel, updateCustomer, type Customer,
} from "@/lib/mock/customers";

/* ---------------- Payments ---------------- */

export type AttemptStatus = "Paid" | "Failed" | "Pending";
export type PaymentStatus = AttemptStatus | "Refunded";
export type PaymentMethod = "Card" | "Bank transfer" | "Cash" | "Cheque" | "POS";
export const FAILURE_REASONS = ["Card declined", "Insufficient funds", "Bank timeout", "Card expired"] as const;

export type PaymentAttempt = { at: string; status: AttemptStatus; reason?: (typeof FAILURE_REASONS)[number]; gatewayRef: string };

export type Payment = {
  orderId: string;
  invoiceNo: string;
  cicod: string;
  amount: number;
  currency: "NGN";
  kind: "Subscription" | "Refund";
  method: PaymentMethod;
  period: Period;
  users: number;
  licences: number;
  attempts: PaymentAttempt[];
  /** Set for offline payments recorded by staff. */
  recordedBy?: string;
  reference?: string;
};

export const paymentStatus = (p: Payment): PaymentStatus => (p.kind === "Refund" ? "Refunded" : p.attempts[p.attempts.length - 1].status);
export const lastAttemptAt = (p: Payment) => p.attempts[p.attempts.length - 1].at;

/** Small deterministic PRNG so the mock data is stable between reloads. */
function rng(seed: number) {
  let s = seed % 2147483647;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const isoAt = (dayOffset: number, hour: number, minute: number) => `${daysFromToday(dayOffset)}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+01:00`;

let orderSeq = 10019000;
const nextOrder = () => String(++orderSeq);

function licencesFor(c: Customer) {
  const { item } = subscriptionLabel(c.subscription);
  return item && "maxUsers" in item ? item.maxUsers : c.subscription.users;
}

/** Builds a plausible payment history from each customer's subscription dates, so Payments, Collections and Customer 360 agree. */
function seedPayments(customers: Customer[]): Payment[] {
  const out: Payment[] = [];
  for (const c of customers) {
    const r = rng(Number(c.cicod));
    const s = c.subscription;
    const amount = s.period === "ANNUALLY" ? monthlyValue(c) * 12 : monthlyValue(c);
    const base = { cicod: c.cicod, amount, currency: "NGN" as const, kind: "Subscription" as const, period: s.period, users: s.users, licences: licencesFor(c) };
    const ref = () => `PSK_${Math.floor(r() * 1e9).toString(36).toUpperCase()}`;

    // Paid history: one order per billing period, walking back from the last payment.
    if (s.lastPaymentAt) {
      const step = s.period === "ANNUALLY" ? 365 : 30;
      for (let back = daysUntil(s.lastPaymentAt), n = 0; back > -200 && n < 6 && back >= daysUntil(c.createdAt); back -= step, n++) {
        const failedFirst = r() < 0.3;
        const attempts: PaymentAttempt[] = [];
        if (failedFirst) attempts.push({ at: isoAt(back - 1, 9 + Math.floor(r() * 8), Math.floor(r() * 59)), status: "Failed", reason: FAILURE_REASONS[Math.floor(r() * 4)], gatewayRef: ref() });
        attempts.push({ at: isoAt(back, 9 + Math.floor(r() * 8), Math.floor(r() * 59)), status: "Paid", gatewayRef: ref() });
        out.push({ ...base, orderId: nextOrder(), invoiceNo: `INV-${c.cicod}-${String(6 - n).padStart(3, "0")}`, method: r() < 0.85 ? "Card" : "Bank transfer", attempts });
      }
    }

    // Overdue renewals: the gateway retried and failed.
    const due = daysUntil(s.renewsAt);
    if (due < 0 && !s.trialEndsAt) {
      const tries = Math.min(4, 1 + Math.floor(-due / 5));
      const attempts: PaymentAttempt[] = Array.from({ length: tries }, (_, i) => ({
        at: isoAt(due + i * 3, 8 + i, 15), status: "Failed" as const, reason: FAILURE_REASONS[Math.floor(r() * 4)], gatewayRef: ref(),
      }));
      out.push({ ...base, orderId: nextOrder(), invoiceNo: `INV-${c.cicod}-007`, method: "Card", attempts });
    }
  }

  // A few edge cases worth demoing: a pending bank transfer and a refund.
  const pendingFor = customers.find((c) => c.cicod === "23472");
  if (pendingFor) out.push({ cicod: pendingFor.cicod, amount: monthlyValue(pendingFor), currency: "NGN", kind: "Subscription", method: "Bank transfer", period: "MONTHLY", users: pendingFor.subscription.users, licences: licencesFor(pendingFor), orderId: nextOrder(), invoiceNo: `INV-${pendingFor.cicod}-008`, attempts: [{ at: isoAt(-1, 14, 5), status: "Pending", gatewayRef: "BANK_TRF_00412" }] });
  const refundFor = customers.find((c) => c.cicod === "23475");
  if (refundFor) out.push({ cicod: refundFor.cicod, amount: -monthlyValue(refundFor) / 2, currency: "NGN", kind: "Refund", method: "Card", period: "MONTHLY", users: refundFor.subscription.users, licences: licencesFor(refundFor), orderId: nextOrder(), invoiceNo: `CRN-${refundFor.cicod}-001`, attempts: [{ at: isoAt(-12, 11, 40), status: "Paid", gatewayRef: "PSK_REFUND_77A" }] });

  return out.sort((a, b) => lastAttemptAt(b).localeCompare(lastAttemptAt(a)));
}

export const paymentsStore = createStore<Payment[]>(seedPayments(customersStore.get()));
export const usePayments = () => useStore(paymentsStore);

/* ---------------- Templates (shared library lives in messaging.ts) ---------------- */

export { templateById, type Template } from "@/lib/mock/messaging";

export function renderTemplate(body: string, c: Customer | undefined, extra: { dueDate: string; suspendDate: string }) {
  const sub = c ? subscriptionLabel(c.subscription) : undefined;
  return fillTemplate(body, {
    contactName: c?.contacts[0]?.name.split(" ")[0],
    company: c?.company,
    plan: sub ? `${sub.group} ${sub.name}` : undefined,
    amount: c ? `₦${monthlyValue(c).toLocaleString()}` : undefined,
    dueDate: extra.dueDate,
    suspendDate: extra.suspendDate,
    domain: c?.domain,
  });
}

/** Where each template is used by dunning, so the template library can show impact and flag mismatches. */
export function dunningUsage(policies: DunningPolicy[], templateId: string) {
  return policies.flatMap((p) => p.steps.filter((s) => s.emailTemplate === templateId || s.smsTemplate === templateId).map((s) => ({ policy: p.name, step: s.type })));
}

/* ---------------- Dunning policies ---------------- */

export type StepType = "Reminder" | "Warning" | "Final notice";
export type DunningStep = { id: string; offsetDays: number; type: StepType; emailTemplate?: string; smsTemplate?: string };
export type DunningPolicy = {
  id: string;
  name: string;
  billingModels: BillingModel[];
  steps: DunningStep[];
  graceDays: number;
  /** false = customers past grace wait in "Ready to suspend" for a person to decide. */
  autoSuspend: boolean;
  skipPaused: boolean;
  skipPendingTransfers: boolean;
  status: Exclude<CatalogueStatus, "Archived">;
  updatedAt: string;
  updatedBy: string;
};

const INITIAL_POLICIES: DunningPolicy[] = [
  {
    id: "per-user", name: "Per user dunning", billingModels: ["PER_USER"], graceDays: 3, autoSuspend: false, skipPaused: true, skipPendingTransfers: true, status: "Live",
    steps: [
      { id: "s1", offsetDays: -7, type: "Reminder", emailTemplate: "em-reminder", smsTemplate: "sms-short" },
      { id: "s2", offsetDays: -3, type: "Warning", smsTemplate: "sms-broadcast" },
      { id: "s3", offsetDays: 2, type: "Final notice", emailTemplate: "em-final", smsTemplate: "sms-broadcast" },
    ],
    updatedAt: daysFromToday(-30), updatedBy: "Isaac Adegunle",
  },
  {
    id: "periodic", name: "Periodic dunning", billingModels: ["PERIODIC"], graceDays: 0, autoSuspend: true, skipPaused: true, skipPendingTransfers: false, status: "Live",
    steps: [
      { id: "s1", offsetDays: -7, type: "Reminder", smsTemplate: "sms-broadcast" },
      { id: "s2", offsetDays: -3, type: "Warning", smsTemplate: "sms-broadcast" },
    ],
    updatedAt: daysFromToday(-400), updatedBy: "Isaac Adegunle",
  },
];

export const policiesStore = createStore<DunningPolicy[]>(INITIAL_POLICIES);
export const usePolicies = () => useStore(policiesStore);
export function upsertPolicy(p: DunningPolicy) {
  policiesStore.set((prev) => (prev.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p]));
}

/* ---------------- Pauses ---------------- */

const omit = <T,>(obj: Record<string, T>, key: string) => Object.fromEntries(Object.entries(obj).filter(([k]) => k !== key));

export type Pause = { until: string; reason: string };
export const pausesStore = createStore<Record<string, Pause>>({ "23469": { until: daysFromToday(10), reason: "Billing dispute" } });
export const usePauses = () => useStore(pausesStore);

/* ---------------- Dunning state (derived, never stored) ---------------- */

export const STAGES = [
  { id: "due_soon", label: "Due soon" },
  { id: "reminder", label: "Reminder sent" },
  { id: "warning", label: "Warning sent" },
  { id: "grace", label: "In grace period" },
  { id: "ready_to_suspend", label: "Ready to suspend" },
  { id: "paused", label: "Paused" },
  { id: "no_policy", label: "No policy" },
] as const;
export type StageId = (typeof STAGES)[number]["id"];

export type DunningState = {
  stage: StageId;
  policy?: DunningPolicy;
  daysPastDue: number;
  lastStep?: DunningStep;
  lastStepAt?: string;
  next: string;
  pause?: Pause;
};

export function billingModelOf(c: Customer): BillingModel | undefined {
  return subscriptionLabel(c.subscription, INITIAL_BUNDLES, INITIAL_PLANS).item?.billingModel;
}

export const policyFor = (c: Customer, policies: DunningPolicy[]) => {
  const model = billingModelOf(c);
  return policies.find((p) => p.status === "Live" && model && p.billingModels.includes(model));
};

/**
 * Where a customer sits in the dunning cycle today. Returns undefined when they are not in it
 * (paid up, on trial, suspended, or due more than 7 days out).
 */
export function getDunningState(c: Customer, policies: DunningPolicy[], pauses: Record<string, Pause>): DunningState | undefined {
  if (c.status === "Suspended" || (c.subscription.trialEndsAt && daysUntil(c.subscription.trialEndsAt) >= 0)) return undefined;
  const daysPastDue = -daysUntil(c.subscription.renewsAt);
  if (daysPastDue < -7) return undefined;

  const pause = pauses[c.cicod];
  if (pause && daysUntil(pause.until) >= 0) return { stage: "paused", daysPastDue, next: `Resumes ${formatDate(pause.until)}`, pause };

  const policy = policyFor(c, policies);
  if (!policy) return { stage: "no_policy", daysPastDue, next: daysPastDue > 0 ? "Not being chased" : "No reminders will be sent" };

  const steps = [...policy.steps].sort((a, b) => a.offsetDays - b.offsetDays);
  const reached = steps.filter((s) => s.offsetDays <= daysPastDue);
  const lastStep = reached[reached.length - 1];
  const nextStep = steps.find((s) => s.offsetDays > daysPastDue);
  const lastStepAt = lastStep ? daysFromToday(lastStep.offsetDays - daysPastDue) : undefined;
  const suspendIn = policy.graceDays - daysPastDue;

  let stage: StageId;
  if (daysPastDue > policy.graceDays) stage = "ready_to_suspend";
  else if (daysPastDue > 0) stage = "grace";
  else if (!lastStep) stage = "due_soon";
  else stage = lastStep.type === "Reminder" ? "reminder" : "warning";

  const next =
    stage === "ready_to_suspend" ? (policy.autoSuspend ? "Auto-suspends tonight" : "Waiting for your review")
    : nextStep ? `${nextStep.type} in ${nextStep.offsetDays - daysPastDue}d`
    : daysPastDue <= 0 ? `Due in ${-daysPastDue}d`
    : `Suspension review in ${suspendIn + 1}d`;

  return { stage, policy, daysPastDue, lastStep, lastStepAt, next };
}

/* ---------------- Actions (all write to the customer's activity log) ---------------- */

export function recordOfflinePayment(c: Customer, input: { amount: number; method: PaymentMethod; reference: string; paidOn: string }) {
  const s = c.subscription;
  const step = s.period === "ANNUALLY" ? 365 : 30;
  const from = Math.max(daysUntil(s.renewsAt), daysUntil(input.paidOn));
  paymentsStore.set((prev) => [{
    cicod: c.cicod, amount: input.amount, currency: "NGN", kind: "Subscription", method: input.method, period: s.period,
    users: s.users, licences: licencesFor(c), orderId: nextOrder(), invoiceNo: `INV-${c.cicod}-M${Date.now() % 1000}`,
    attempts: [{ at: `${input.paidOn}T12:00:00+01:00`, status: "Paid", gatewayRef: input.reference || "OFFLINE" }],
    recordedBy: CURRENT_USER, reference: input.reference,
  }, ...prev]);
  updateCustomer(c.cicod, { subscription: { ...s, lastPaymentAt: input.paidOn, renewsAt: daysFromToday(from + step) } });
  pausesStore.set((p) => omit(p, c.cicod));
  logActivity(c.cicod, { kind: "payment", title: "Offline payment recorded", body: `₦${input.amount.toLocaleString()} by ${input.method.toLowerCase()}${input.reference ? ` (ref ${input.reference})` : ""}. Next renewal ${formatDate(daysFromToday(from + step))}.` });
}

export function extendDueDate(c: Customer, days: number, reason: string) {
  updateCustomer(c.cicod, { subscription: { ...c.subscription, renewsAt: daysFromToday(daysUntil(c.subscription.renewsAt) + days) } });
  logActivity(c.cicod, { kind: "note", title: `Due date extended by ${days} days`, body: `Reason: ${reason}.` });
}

export function pauseDunning(c: Customer, days: number, reason: string) {
  pausesStore.set((p) => ({ ...p, [c.cicod]: { until: daysFromToday(days), reason } }));
  logActivity(c.cicod, { kind: "note", title: `Dunning paused for ${days} days`, body: `Reason: ${reason}.` });
}

export function resumeDunning(c: Customer) {
  pausesStore.set((p) => omit(p, c.cicod));
  logActivity(c.cicod, { kind: "note", title: "Dunning resumed" });
}

export function sendReminder(c: Customer, channels = "email and SMS") {
  logActivity(c.cicod, { kind: "invoice", title: "Payment reminder sent", body: `Sent by ${channels} to ${c.contacts[0]?.email ?? c.email}.` });
}

export function suspendForNonPayment(c: Customer, reason: string, note: string) {
  updateCustomer(c.cicod, { status: "Suspended" });
  logActivity(c.cicod, { kind: "status", title: "Customer suspended", body: `Reason: ${reason}.${note ? ` ${note}` : ""}` });
}
