"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useCrmMutation, type MutationHookOptions } from "@/lib/mutations";
import { referenceService } from "@/services/reference";
import type { PaymentMethod } from "@/lib/mock/billing";
import type { PaymentMethodSetting } from "@/lib/mock/settings";
import type { Bundle, Plan } from "@/lib/mock/catalogue";
import { useBundlesQuery, usePlansQuery } from "@/features/catalogue/queries";

const r = queryKeys.reference;
const sectorsKey = r.scoped("sectors");
const countriesKey = r.scoped("countries");
const currenciesKey = r.scoped("currencies");
const paymentMethodsKey = r.scoped("payment-methods");

export const useSectorsQuery = () => useQuery({ queryKey: sectorsKey, queryFn: referenceService.sectors });
export const useCountriesQuery = () => useQuery({ queryKey: countriesKey, queryFn: referenceService.countries });
export const useCurrenciesQuery = () => useQuery({ queryKey: currenciesKey, queryFn: referenceService.currencies });
export const usePaymentMethodsQuery = () => useQuery({ queryKey: paymentMethodsKey, queryFn: referenceService.paymentMethods });
export const useCurrencyUsageQuery = (code: string | undefined) =>
  useQuery({ queryKey: [...currenciesKey, "usage", code], queryFn: () => referenceService.currencyUsage(code!), enabled: !!code });

export type PriceUsage = { plans: number; bundles: number; total: number };

/** How many non-archived plans and bundles price in `code` (same rule as the currency-usage endpoint). */
export function priceUsageFrom(plans: Plan[], bundles: Bundle[], code: string): PriceUsage {
  const p = plans.filter((x) => x.status !== "Archived" && x.prices.some((pr) => pr.currency === code)).length;
  const b = bundles.filter((x) => x.status !== "Archived" && x.prices.some((pr) => pr.currency === code)).length;
  return { plans: p, bundles: b, total: p + b };
}

/**
 * Currency usage for every currency at once, computed from the queried plans and bundles (one request each instead
 * of one usage request per currency). `data` is a lookup by currency code; shaped for `QueryState`.
 */
export function usePriceUsage() {
  const plans = usePlansQuery();
  const bundles = useBundlesQuery();
  const data = React.useMemo(
    () => (plans.data && bundles.data ? (code: string) => priceUsageFrom(plans.data, bundles.data, code) : undefined),
    [plans.data, bundles.data],
  );
  const failed = plans.isError ? plans : bundles.isError ? bundles : null;
  return {
    data,
    isPending: plans.isPending || bundles.isPending,
    isError: !!failed,
    error: failed?.error ?? null,
    refetch: () => { void plans.refetch(); void bundles.refetch(); },
  };
}

/** Active sector → active business types, for pickers in customer and lead forms. */
export function useSectorOptions(): Record<string, string[]> {
  const { data } = useSectorsQuery();
  return React.useMemo(
    () => Object.fromEntries((data ?? []).filter((s) => s.active).map((s) => [s.name, s.types.filter((t) => t.active).map((t) => t.name)])),
    [data],
  );
}

/** Enabled country → active regions, for address pickers. */
export function useCountryOptions(): Record<string, string[]> {
  const { data } = useCountriesQuery();
  return React.useMemo(
    () => Object.fromEntries((data ?? []).filter((c) => c.enabled).map((c) => [c.name, c.regions.filter((g) => g.active).map((g) => g.name)])),
    [data],
  );
}

/** Reference changes are audited, and renaming a sector also renames it on customers. */
const affected = (k: readonly unknown[]) => [k, queryKeys.settings.scoped("audit"), queryKeys.customers.all];
type O<V> = MutationHookOptions<V, unknown>;

export const useAddSector = (o: O<{ name: string }> = {}) => useCrmMutation({ mutationFn: ({ name }) => referenceService.addSector(name), invalidate: affected(sectorsKey), ...o });
export const useRenameSector = (o: O<{ id: string; name: string }> = {}) => useCrmMutation({ mutationFn: ({ id, name }) => referenceService.renameSector(id, name), invalidate: affected(sectorsKey), ...o });
export const useSetSectorActive = (o: O<{ id: string; active: boolean }> = {}) => useCrmMutation({ mutationFn: ({ id, active }) => referenceService.setSectorActive(id, active), invalidate: affected(sectorsKey), ...o });
export const useAddBusinessType = (o: O<{ sectorId: string; name: string }> = {}) => useCrmMutation({ mutationFn: ({ sectorId, name }) => referenceService.addBusinessType(sectorId, name), invalidate: affected(sectorsKey), ...o });
export const useRenameBusinessType = (o: O<{ sectorId: string; typeId: string; name: string }> = {}) =>
  useCrmMutation({ mutationFn: ({ sectorId, typeId, name }) => referenceService.renameBusinessType(sectorId, typeId, name), invalidate: affected(sectorsKey), ...o });
export const useSetBusinessTypeActive = (o: O<{ sectorId: string; typeId: string; active: boolean }> = {}) =>
  useCrmMutation({ mutationFn: ({ sectorId, typeId, active }) => referenceService.setBusinessTypeActive(sectorId, typeId, active), invalidate: affected(sectorsKey), ...o });

export const useAddCountry = (o: O<{ code: string }> = {}) => useCrmMutation({ mutationFn: ({ code }) => referenceService.addCountry(code), invalidate: affected(countriesKey), ...o });
export const useSetCountryEnabled = (o: O<{ code: string; enabled: boolean }> = {}) => useCrmMutation({ mutationFn: ({ code, enabled }) => referenceService.setCountryEnabled(code, enabled), invalidate: affected(countriesKey), ...o });
export const useAddRegion = (o: O<{ code: string; name: string }> = {}) => useCrmMutation({ mutationFn: ({ code, name }) => referenceService.addRegion(code, name), invalidate: affected(countriesKey), ...o });
export const useSetRegionActive = (o: O<{ code: string; regionId: string; active: boolean }> = {}) =>
  useCrmMutation({ mutationFn: ({ code, regionId, active }) => referenceService.setRegionActive(code, regionId, active), invalidate: affected(countriesKey), ...o });
export const useAddArea = (o: O<{ code: string; regionId: string; name: string }> = {}) =>
  useCrmMutation({ mutationFn: ({ code, regionId, name }) => referenceService.addArea(code, regionId, name), invalidate: affected(countriesKey), ...o });

export const useSetCurrencyEnabled = (o: O<{ code: string; enabled: boolean }> = {}) =>
  useCrmMutation({ mutationFn: ({ code, enabled }) => referenceService.setCurrencyEnabled(code, enabled), invalidate: [...affected(currenciesKey), queryKeys.catalogue.all], ...o });

export const useUpdatePaymentMethod = (o: O<{ id: PaymentMethod; patch: Partial<Pick<PaymentMethodSetting, "enabled" | "requiresReference">> }> = {}) =>
  useCrmMutation({ mutationFn: ({ id, patch }) => referenceService.updatePaymentMethod(id, patch), invalidate: affected(paymentMethodsKey), ...o });
