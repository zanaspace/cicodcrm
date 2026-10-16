import { api } from "@/lib/api-client";
import { addFeature, bundlesStore, featuresStore, plansStore, upsertBundle, upsertPlan, type Bundle, type Feature, type Plan } from "@/lib/mock/catalogue";
import { via } from "@/services/mock";

/**
 * Commercial catalogue: plans, bundles and plan features (legacy Angular: Product Management › Products,
 * Single Offers, Bundle Offers, Product Captions).
 * TODO(confirm against Angular): endpoint paths and payloads, especially how offers map onto plans.
 */
export const CATALOGUE_ENDPOINTS = {
  plans: "/catalogue/plans", // TODO(confirm)
  plan: (code: string) => `/catalogue/plans/${encodeURIComponent(code)}`, // TODO(confirm)
  bundles: "/catalogue/bundles", // TODO(confirm)
  bundle: (code: string) => `/catalogue/bundles/${encodeURIComponent(code)}`, // TODO(confirm)
  features: "/catalogue/features", // TODO(confirm)
};

export const catalogueService = {
  plans: () => via(() => plansStore.get(), () => api.get<Plan[]>(CATALOGUE_ENDPOINTS.plans)),
  bundles: () => via(() => bundlesStore.get(), () => api.get<Bundle[]>(CATALOGUE_ENDPOINTS.bundles)),
  features: () => via(() => featuresStore.get(), () => api.get<Feature[]>(CATALOGUE_ENDPOINTS.features)),
  /** Create or update; `isNew` decides POST vs PUT against the backend. */
  savePlan: (plan: Plan, isNew: boolean) =>
    via(() => { upsertPlan(plan); return plan; },
      () => (isNew ? api.post<Plan>(CATALOGUE_ENDPOINTS.plans, { body: plan }) : api.put<Plan>(CATALOGUE_ENDPOINTS.plan(plan.code), { body: plan }))),
  saveBundle: (bundle: Bundle, isNew: boolean) =>
    via(() => { upsertBundle(bundle); return bundle; },
      () => (isNew ? api.post<Bundle>(CATALOGUE_ENDPOINTS.bundles, { body: bundle }) : api.put<Bundle>(CATALOGUE_ENDPOINTS.bundle(bundle.code), { body: bundle }))),
  addFeature: (productCode: string, name: string) =>
    via(() => addFeature(productCode, name), () => api.post<Feature>(CATALOGUE_ENDPOINTS.features, { body: { productCode, name } })),
};
