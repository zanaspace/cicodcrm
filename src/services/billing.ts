import { api } from "@/lib/api-client";
import {
  extendDueDate, pauseDunning, pausesStore, paymentsStore, policiesStore, recordOfflinePayment, resumeDunning,
  sendReminder, suspendForNonPayment, upsertPolicy, type DunningPolicy, type Pause, type Payment, type PaymentMethod,
} from "@/lib/mock/billing";
import { findMockCustomer } from "@/services/customers";
import { via } from "@/services/mock";

/**
 * Billing: subscription payments, collections actions and dunning policies (legacy Angular: Billing &
 * Payments › Subscription Payments, Dunning Plan, KCI Steps; Payment Channels; Payment Confirmation).
 * TODO(confirm against Angular): endpoint paths, payloads, and the backend's status values for payments.
 * Do not infer payment behaviour from UI labels; confirm each action's real backend operation first.
 */
export const BILLING_ENDPOINTS = {
  payments: "/billing/payments", // TODO(confirm)
  policies: "/billing/dunning-policies", // TODO(confirm)
  policy: (id: string) => `/billing/dunning-policies/${encodeURIComponent(id)}`, // TODO(confirm)
  pauses: "/billing/dunning-pauses", // TODO(confirm)
  customerAction: (cicod: string, action: string) => `/billing/customers/${encodeURIComponent(cicod)}/${action}`, // TODO(confirm)
};

export type OfflinePaymentInput = { amount: number; method: PaymentMethod; reference: string; paidOn: string };

export const billingService = {
  payments: () => via(() => paymentsStore.get(), () => api.get<Payment[]>(BILLING_ENDPOINTS.payments)),
  policies: () => via(() => policiesStore.get(), () => api.get<DunningPolicy[]>(BILLING_ENDPOINTS.policies)),
  /** Customers whose dunning is paused, keyed by CICOD id. */
  pauses: () => via(() => pausesStore.get(), () => api.get<Record<string, Pause>>(BILLING_ENDPOINTS.pauses)),
  savePolicy: (policy: DunningPolicy, isNew: boolean) =>
    via(() => { upsertPolicy(policy); return policy; },
      () => (isNew ? api.post<DunningPolicy>(BILLING_ENDPOINTS.policies, { body: policy }) : api.put<DunningPolicy>(BILLING_ENDPOINTS.policy(policy.id), { body: policy }))),

  recordOfflinePayment: (cicod: string, input: OfflinePaymentInput) =>
    via(() => recordOfflinePayment(findMockCustomer(cicod), input), () => api.post<void>(BILLING_ENDPOINTS.customerAction(cicod, "offline-payments"), { body: input })),
  extendDueDate: (cicod: string, days: number, reason: string) =>
    via(() => extendDueDate(findMockCustomer(cicod), days, reason), () => api.post<void>(BILLING_ENDPOINTS.customerAction(cicod, "extend-due-date"), { body: { days, reason } })),
  pauseDunning: (cicod: string, days: number, reason: string) =>
    via(() => pauseDunning(findMockCustomer(cicod), days, reason), () => api.post<void>(BILLING_ENDPOINTS.customerAction(cicod, "pause-dunning"), { body: { days, reason } })),
  resumeDunning: (cicod: string) =>
    via(() => resumeDunning(findMockCustomer(cicod)), () => api.post<void>(BILLING_ENDPOINTS.customerAction(cicod, "resume-dunning"))),
  sendReminder: (cicod: string, channels?: string) =>
    via(() => sendReminder(findMockCustomer(cicod), channels), () => api.post<void>(BILLING_ENDPOINTS.customerAction(cicod, "reminders"), { body: { channels } })),
  /**
   * "Remind all in view" on Collections. TODO(confirm): whether the backend has a bulk reminder endpoint; until then
   * this sends one request per customer and fails if any of them fails.
   */
  sendReminders: async (cicods: string[]) => {
    await Promise.all(cicods.map((cicod) => billingService.sendReminder(cicod)));
  },
  suspendForNonPayment: (cicod: string, reason: string, note: string) =>
    via(() => suspendForNonPayment(findMockCustomer(cicod), reason, note), () => api.post<void>(BILLING_ENDPOINTS.customerAction(cicod, "suspend"), { body: { reason, note } })),
};
