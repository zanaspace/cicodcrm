"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useCrmMutation, type MutationHookOptions } from "@/lib/mutations";
import { billingService, type OfflinePaymentInput } from "@/services/billing";
import type { DunningPolicy } from "@/lib/mock/billing";

const keys = queryKeys.billing;
/** Collections actions change the customer (status, renewal date, activity log) as well as billing data. */
const customerAction = [keys.all, queryKeys.customers.all, queryKeys.dashboard.all];

export const usePaymentsQuery = () => useQuery({ queryKey: keys.scoped("payments"), queryFn: billingService.payments });
export const usePoliciesQuery = () => useQuery({ queryKey: keys.scoped("policies"), queryFn: billingService.policies });
export const usePausesQuery = () => useQuery({ queryKey: keys.scoped("pauses"), queryFn: billingService.pauses });

export const useSavePolicy = (o: MutationHookOptions<{ policy: DunningPolicy; isNew: boolean }, DunningPolicy> = {}) =>
  useCrmMutation({ mutationFn: ({ policy, isNew }) => billingService.savePolicy(policy, isNew), invalidate: [keys.all], ...o });

export const useRecordOfflinePayment = (o: MutationHookOptions<{ cicod: string; input: OfflinePaymentInput }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ cicod, input }) => billingService.recordOfflinePayment(cicod, input), invalidate: customerAction, ...o });

export const useExtendDueDate = (o: MutationHookOptions<{ cicod: string; days: number; reason: string }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ cicod, days, reason }) => billingService.extendDueDate(cicod, days, reason), invalidate: customerAction, ...o });

export const usePauseDunning = (o: MutationHookOptions<{ cicod: string; days: number; reason: string }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ cicod, days, reason }) => billingService.pauseDunning(cicod, days, reason), invalidate: customerAction, ...o });

export const useResumeDunning = (o: MutationHookOptions<{ cicod: string }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ cicod }) => billingService.resumeDunning(cicod), invalidate: customerAction, ...o });

export const useSendReminder = (o: MutationHookOptions<{ cicod: string; channels?: string }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ cicod, channels }) => billingService.sendReminder(cicod, channels), invalidate: [queryKeys.customers.all], ...o });

export const useSendReminders = (o: MutationHookOptions<{ cicods: string[] }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ cicods }) => billingService.sendReminders(cicods), invalidate: [queryKeys.customers.all], ...o });

export const useSuspendForNonPayment = (o: MutationHookOptions<{ cicod: string; reason: string; note: string }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ cicod, reason, note }) => billingService.suspendForNonPayment(cicod, reason, note), invalidate: customerAction, ...o });
