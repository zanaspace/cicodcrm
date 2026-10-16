"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useCrmMutation, type MutationHookOptions } from "@/lib/mutations";
import { catalogueService } from "@/services/catalogue";
import type { Bundle, Feature, Plan } from "@/lib/mock/catalogue";

const keys = queryKeys.catalogue;
/** Plan and bundle changes affect customer plan labels, monthly value, currency usage and the dashboard. */
const affected = [keys.all, queryKeys.customers.all, queryKeys.reference.all, queryKeys.dashboard.all];

export const usePlansQuery = () => useQuery({ queryKey: keys.scoped("plans"), queryFn: catalogueService.plans });
export const useBundlesQuery = () => useQuery({ queryKey: keys.scoped("bundles"), queryFn: catalogueService.bundles });
export const useFeaturesQuery = () => useQuery({ queryKey: keys.scoped("features"), queryFn: catalogueService.features });

export const useSavePlan = (o: MutationHookOptions<{ plan: Plan; isNew: boolean }, Plan> = {}) =>
  useCrmMutation({ mutationFn: ({ plan, isNew }) => catalogueService.savePlan(plan, isNew), invalidate: affected, ...o });

export const useSaveBundle = (o: MutationHookOptions<{ bundle: Bundle; isNew: boolean }, Bundle> = {}) =>
  useCrmMutation({ mutationFn: ({ bundle, isNew }) => catalogueService.saveBundle(bundle, isNew), invalidate: affected, ...o });

export const useAddFeature = (o: MutationHookOptions<{ productCode: string; name: string }, Feature> = {}) =>
  useCrmMutation({ mutationFn: ({ productCode, name }) => catalogueService.addFeature(productCode, name), invalidate: [keys.scoped("features")], ...o });

type QueryLike<T> = { data: T | undefined; isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown };

/**
 * Plans, bundles and features together, shaped for `QueryState`: pending until all three load, an error if any fails,
 * and "Try again" refetches the ones that failed.
 */
export function useCatalogueQuery(): QueryLike<{ plans: Plan[]; bundles: Bundle[]; features: Feature[] }> {
  const plans = usePlansQuery();
  const bundles = useBundlesQuery();
  const features = useFeaturesQuery();
  const all = [plans, bundles, features];
  const failed = all.find((q) => q.isError);
  return {
    data: plans.data && bundles.data && features.data ? { plans: plans.data, bundles: bundles.data, features: features.data } : undefined,
    isPending: !failed && all.some((q) => q.isPending),
    isError: !!failed,
    error: failed?.error ?? null,
    refetch: () => all.filter((q) => q.isError).forEach((q) => q.refetch()),
  };
}
