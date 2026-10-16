import { api } from "@/lib/api-client";
import type { PaymentMethod } from "@/lib/mock/billing";
import {
  addArea, addBusinessType, addCountry, addRegion, addSector, countriesStore, currenciesStore, paymentMethodsStore,
  priceUsage, renameBusinessType, renameSector, sectorsStore, setBusinessTypeActive, setCountryEnabled,
  setCurrencyEnabled, setRegionActive, setSectorActive, updatePaymentMethod,
  type Country, type CurrencySetting, type PaymentMethodSetting, type Sector,
} from "@/lib/mock/settings";
import { via } from "@/services/mock";

/**
 * Reference data used across forms: business sectors and types, operating countries / regions / areas,
 * currencies, payment methods (legacy Angular: Settings › Business Sectors & Types, Continents & Countries,
 * States & Counties, Currencies, Payment Channel).
 * TODO(confirm against Angular): endpoint paths and payloads for each list.
 */
export const REFERENCE_ENDPOINTS = {
  sectors: "/reference/sectors", // TODO(confirm)
  sector: (id: string) => `/reference/sectors/${encodeURIComponent(id)}`, // TODO(confirm)
  businessTypes: (sectorId: string) => `/reference/sectors/${encodeURIComponent(sectorId)}/types`, // TODO(confirm)
  countries: "/reference/countries", // TODO(confirm)
  country: (code: string) => `/reference/countries/${encodeURIComponent(code)}`, // TODO(confirm)
  currencies: "/reference/currencies", // TODO(confirm)
  currency: (code: string) => `/reference/currencies/${encodeURIComponent(code)}`, // TODO(confirm)
  paymentMethods: "/reference/payment-methods", // TODO(confirm)
  paymentMethod: (id: string) => `/reference/payment-methods/${encodeURIComponent(id)}`, // TODO(confirm)
};

export const referenceService = {
  sectors: () => via(() => sectorsStore.get(), () => api.get<Sector[]>(REFERENCE_ENDPOINTS.sectors)),
  addSector: (name: string) => via(() => addSector(name), () => api.post<Sector>(REFERENCE_ENDPOINTS.sectors, { body: { name } })),
  renameSector: (id: string, name: string) => via(() => renameSector(id, name), () => api.patch<void>(REFERENCE_ENDPOINTS.sector(id), { body: { name } })),
  setSectorActive: (id: string, active: boolean) => via(() => setSectorActive(id, active), () => api.patch<void>(REFERENCE_ENDPOINTS.sector(id), { body: { active } })),
  addBusinessType: (sectorId: string, name: string) =>
    via(() => addBusinessType(sectorId, name), () => api.post<void>(REFERENCE_ENDPOINTS.businessTypes(sectorId), { body: { name } })),
  renameBusinessType: (sectorId: string, typeId: string, name: string) =>
    via(() => renameBusinessType(sectorId, typeId, name), () => api.patch<void>(`${REFERENCE_ENDPOINTS.businessTypes(sectorId)}/${encodeURIComponent(typeId)}`, { body: { name } })),
  setBusinessTypeActive: (sectorId: string, typeId: string, active: boolean) =>
    via(() => setBusinessTypeActive(sectorId, typeId, active), () => api.patch<void>(`${REFERENCE_ENDPOINTS.businessTypes(sectorId)}/${encodeURIComponent(typeId)}`, { body: { active } })),

  countries: () => via(() => countriesStore.get(), () => api.get<Country[]>(REFERENCE_ENDPOINTS.countries)),
  addCountry: (code: string) => via(() => addCountry(code), () => api.post<void>(REFERENCE_ENDPOINTS.countries, { body: { code } })),
  setCountryEnabled: (code: string, enabled: boolean) => via(() => setCountryEnabled(code, enabled), () => api.patch<void>(REFERENCE_ENDPOINTS.country(code), { body: { enabled } })),
  addRegion: (code: string, name: string) => via(() => addRegion(code, name), () => api.post<void>(`${REFERENCE_ENDPOINTS.country(code)}/regions`, { body: { name } })),
  setRegionActive: (code: string, regionId: string, active: boolean) =>
    via(() => setRegionActive(code, regionId, active), () => api.patch<void>(`${REFERENCE_ENDPOINTS.country(code)}/regions/${encodeURIComponent(regionId)}`, { body: { active } })),
  addArea: (code: string, regionId: string, name: string) =>
    via(() => addArea(code, regionId, name), () => api.post<void>(`${REFERENCE_ENDPOINTS.country(code)}/regions/${encodeURIComponent(regionId)}/areas`, { body: { name } })),

  currencies: () => via(() => currenciesStore.get(), () => api.get<CurrencySetting[]>(REFERENCE_ENDPOINTS.currencies)),
  /** How many live plans and bundles price in this currency (a currency in use cannot be turned off). */
  currencyUsage: (code: string) => via(() => priceUsage(code), () => api.get<{ plans: number; bundles: number; total: number }>(`${REFERENCE_ENDPOINTS.currency(code)}/usage`)),
  setCurrencyEnabled: (code: string, enabled: boolean) =>
    via(() => setCurrencyEnabled(code, enabled), () => api.patch<void>(REFERENCE_ENDPOINTS.currency(code), { body: { enabled } })),

  paymentMethods: () => via(() => paymentMethodsStore.get(), () => api.get<PaymentMethodSetting[]>(REFERENCE_ENDPOINTS.paymentMethods)),
  updatePaymentMethod: (id: PaymentMethod, patch: Partial<Pick<PaymentMethodSetting, "enabled" | "requiresReference">>) =>
    via(() => updatePaymentMethod(id, patch), () => api.patch<void>(REFERENCE_ENDPOINTS.paymentMethod(id), { body: patch })),
};
