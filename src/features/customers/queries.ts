"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useCrmMutation, type MutationHookOptions } from "@/lib/mutations";
import { customersService, type CustomerProfilePatch, type NewActivity, type NewCustomer } from "@/services/customers";
import type { Customer, Lifecycle } from "@/lib/mock/customers";

const keys = queryKeys.customers;
/** Customer changes show up in billing (names, dues) and the dashboard too. */
const affected = [keys.all, queryKeys.billing.all, queryKeys.dashboard.all];

export const useCustomersQuery = () => useQuery({ queryKey: keys.list(), queryFn: customersService.list });

export const useCustomerQuery = (cicod: string | undefined) =>
  useQuery({ queryKey: keys.detail(cicod ?? ""), queryFn: () => customersService.get(cicod!), enabled: !!cicod });

export const useCreateCustomer = (o: MutationHookOptions<NewCustomer, Customer> = {}) =>
  useCrmMutation({ mutationFn: customersService.create, invalidate: affected, ...o });

export const useUpdateCustomer = (o: MutationHookOptions<{ cicod: string; patch: Partial<Customer> }, Customer> = {}) =>
  useCrmMutation({ mutationFn: ({ cicod, patch }) => customersService.update(cicod, patch), invalidate: affected, ...o });

export const useLogCustomerActivity = (o: MutationHookOptions<{ cicod: string; item: NewActivity }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ cicod, item }) => customersService.logActivity(cicod, item), invalidate: [keys.all], ...o });

export const useUpdateCustomerProfile = (o: MutationHookOptions<{ cicod: string; patch: CustomerProfilePatch }, Customer> = {}) =>
  useCrmMutation({ mutationFn: ({ cicod, patch }) => customersService.updateProfile(cicod, patch), invalidate: affected, ...o });

export const useSuspendCustomer = (o: MutationHookOptions<{ cicod: string; reason: string; note: string }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ cicod, ...input }) => customersService.suspend(cicod, input), invalidate: affected, ...o });

export const useReactivateCustomer = (o: MutationHookOptions<{ cicod: string }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ cicod }) => customersService.reactivate(cicod), invalidate: affected, ...o });

export const useAdvanceLifecycle = (o: MutationHookOptions<{ cicod: string; stage: Lifecycle }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ cicod, stage }) => customersService.setLifecycle(cicod, stage), invalidate: affected, ...o });

export const useSendTrialReminder = (o: MutationHookOptions<{ cicod: string }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ cicod }) => customersService.sendTrialReminder(cicod), invalidate: [keys.all], ...o });

/** Sending an invoice is logged on the customer and may show up in billing. */
export const useSendCustomerInvoice = (o: MutationHookOptions<{ cicod: string; amount: number }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ cicod, amount }) => customersService.sendInvoice(cicod, { amount }), invalidate: affected, ...o });
