import { api } from "@/lib/api-client";
import {
  LIFECYCLE_STAGES, addCustomer, customersStore, lifecycleLabel, logActivity, updateCustomer,
  type ActivityItem, type Customer, type Lifecycle,
} from "@/lib/mock/customers";
import { mockReject, via } from "@/services/mock";
import { formatMoney } from "@/lib/format";

/**
 * Customer accounts (legacy Angular: Customer Management › Customers / Customer page).
 * TODO(confirm against Angular): endpoint paths, query parameters and response shapes. The live branches
 * assume the backend returns the Customer shape in src/types; add a mapping here if it differs.
 */
export const CUSTOMER_ENDPOINTS = {
  list: "/customers", // TODO(confirm)
  detail: (cicod: string) => `/customers/${encodeURIComponent(cicod)}`, // TODO(confirm)
  activity: (cicod: string) => `/customers/${encodeURIComponent(cicod)}/activity`, // TODO(confirm)
  suspend: (cicod: string) => `/customers/${encodeURIComponent(cicod)}/suspend`, // TODO(confirm)
  reactivate: (cicod: string) => `/customers/${encodeURIComponent(cicod)}/reactivate`, // TODO(confirm)
  lifecycle: (cicod: string) => `/customers/${encodeURIComponent(cicod)}/lifecycle`, // TODO(confirm)
  trialReminder: (cicod: string) => `/customers/${encodeURIComponent(cicod)}/trial-reminder`, // TODO(confirm)
  sendInvoice: (cicod: string) => `/customers/${encodeURIComponent(cicod)}/invoices/send`, // TODO(confirm): may live under billing
};

export type CustomerProfilePatch = Partial<Pick<Customer, "company" | "sector" | "businessType" | "email" | "phone" | "country" | "state" | "address">>;

export type NewCustomer = Omit<Customer, "cicod" | "activity" | "openTickets">;
export type NewActivity = Omit<ActivityItem, "id" | "at" | "by"> & { by?: string };

/** Mock-mode lookup that fails like a 404 from the backend. */
export const findMockCustomer = (cicod: string): Customer =>
  customersStore.get().find((c) => c.cicod === cicod) ?? mockReject(`Customer #${cicod} was not found.`, 404);

export const customersService = {
  list: () => via(() => customersStore.get(), () => api.get<Customer[]>(CUSTOMER_ENDPOINTS.list)),
  /** Accepts a CICOD number or a workspace domain (old links use the domain). TODO(confirm): domain lookup in the live API. */
  get: (cicod: string) => via(
    () => customersStore.get().find((c) => c.domain === cicod && c.cicod !== cicod) ?? findMockCustomer(cicod),
    () => api.get<Customer>(CUSTOMER_ENDPOINTS.detail(cicod)),
  ),
  create: (input: NewCustomer) => via(() => addCustomer(input), () => api.post<Customer>(CUSTOMER_ENDPOINTS.list, { body: input })),
  update: (cicod: string, patch: Partial<Customer>) =>
    via(() => { findMockCustomer(cicod); updateCustomer(cicod, patch); return findMockCustomer(cicod); },
      () => api.patch<Customer>(CUSTOMER_ENDPOINTS.detail(cicod), { body: patch })),
  logActivity: (cicod: string, item: NewActivity) =>
    via(() => { findMockCustomer(cicod); logActivity(cicod, item); }, () => api.post<void>(CUSTOMER_ENDPOINTS.activity(cicod), { body: item })),
  /** Edit profile; the backend is expected to record the "Profile updated" activity itself. */
  updateProfile: (cicod: string, patch: CustomerProfilePatch) =>
    via(() => { findMockCustomer(cicod); updateCustomer(cicod, patch); logActivity(cicod, { kind: "note", title: "Profile updated" }); return findMockCustomer(cicod); },
      () => api.patch<Customer>(CUSTOMER_ENDPOINTS.detail(cicod), { body: patch })),
  /** Suspends the workspace (all users lose access) and records the reason in the activity log. */
  suspend: (cicod: string, input: { reason: string; note: string }) =>
    via(() => {
      if (findMockCustomer(cicod).status === "Suspended") mockReject("This customer is already suspended.", 409);
      updateCustomer(cicod, { status: "Suspended" });
      logActivity(cicod, { kind: "status", title: "Customer suspended", body: `Reason: ${input.reason}.${input.note ? ` ${input.note}` : ""}` });
    }, () => api.post<void>(CUSTOMER_ENDPOINTS.suspend(cicod), { body: input })),
  reactivate: (cicod: string) =>
    via(() => {
      if (findMockCustomer(cicod).status !== "Suspended") mockReject("This customer is already active.", 409);
      updateCustomer(cicod, { status: "Active" });
      logActivity(cicod, { kind: "status", title: "Customer reactivated" });
    }, () => api.post<void>(CUSTOMER_ENDPOINTS.reactivate(cicod))),
  /** Moves onboarding to `stage` (one step forward) and records it in the activity log. */
  setLifecycle: (cicod: string, stage: Lifecycle) =>
    via(() => {
      const c = findMockCustomer(cicod);
      const from = LIFECYCLE_STAGES.findIndex((s) => s.id === c.lifecycle);
      const to = LIFECYCLE_STAGES.findIndex((s) => s.id === stage);
      if (to !== from + 1) mockReject("Onboarding can only move forward one step at a time.", 409);
      updateCustomer(cicod, { lifecycle: stage });
      logActivity(cicod, { kind: "lifecycle", title: `Moved to "${lifecycleLabel(stage)}"` });
    }, () => api.post<void>(CUSTOMER_ENDPOINTS.lifecycle(cicod), { body: { stage } })),
  /** Sends the "trial ending" reminder to the customer's contacts (mock: only logs it). */
  sendTrialReminder: (cicod: string) =>
    via(() => { findMockCustomer(cicod); logActivity(cicod, { kind: "note", title: "Trial reminder sent" }); },
      () => api.post<void>(CUSTOMER_ENDPOINTS.trialReminder(cicod))),
  /** Emails the current invoice to the customer's billing email. The backend computes the amount; `amount` is what the user saw. */
  sendInvoice: (cicod: string, input: { amount: number }) =>
    via(() => {
      const c = findMockCustomer(cicod);
      logActivity(cicod, { kind: "invoice", title: "Invoice sent", body: `${formatMoney(input.amount)} invoice emailed to ${c.email}.` });
    }, () => api.post<void>(CUSTOMER_ENDPOINTS.sendInvoice(cicod), { body: input })),
};
