"use client";

import { createStore, useStore } from "@/lib/store";
import { CURRENT_USER, daysFromToday } from "@/lib/format";

export type BillingModel = "PER_USER" | "PER_TRANSACTION" | "PERIODIC";
export type Period = "MONTHLY" | "ANNUALLY";
export type Currency = "NGN" | "USD" | "GBP";
export type CatalogueStatus = "Draft" | "Live" | "Archived";

export const CURRENCIES: Currency[] = ["NGN", "USD", "GBP"];
export const PERIODS: Period[] = ["MONTHLY", "ANNUALLY"];

export const BILLING_MODEL_LABEL: Record<BillingModel, string> = {
  PER_USER: "Per user",
  PER_TRANSACTION: "Per transaction",
  PERIODIC: "Flat (periodic)",
};

export const PERIOD_LABEL: Record<Period, string> = { MONTHLY: "Monthly", ANNUALLY: "Annually" };

export type Price = { currency: Currency; period: Period; amount: number };

export type Product = {
  code: string;
  name: string;
  serviceKey: string;
  type: string;
  description: string;
};

export type Feature = { id: string; productCode: string; name: string };

export type Plan = {
  code: string;
  productCode: string;
  name: string;
  tenantType: "MERCHANT";
  billingModel: BillingModel;
  prices: Price[];
  featureIds: string[];
  trialDays: number;
  recommended: boolean;
  priority: number;
  status: CatalogueStatus;
  customers: number;
  updatedAt: string;
  updatedBy: string;
};

export type BundleGroup = { key: string; name: string; description: string };

export type Bundle = {
  code: string;
  name: string;
  groupKey: string;
  planCodes: string[];
  billingModel: BillingModel;
  prices: Price[];
  minUsers: number;
  maxUsers: number;
  storageGb: number;
  trialDays: number;
  status: CatalogueStatus;
  customers: number;
  updatedAt: string;
  updatedBy: string;
};

export const PRODUCTS: Product[] = [
  { code: "COM", name: "Customer Order Management", serviceKey: "com", type: "Software", description: "Omnichannel order capture, fulfilment and customer management." },
  { code: "UCG", name: "Unified Collections Gateway", serviceKey: "ucg", type: "Software", description: "Accept and reconcile payments across bank branch, ATM, USSD and web." },
  { code: "IMS", name: "Inventory Management System", serviceKey: "ims", type: "Software", description: "Real-time stock, warehouses and replenishment." },
  { code: "WFM", name: "Workflow Manager", serviceKey: "wfm", type: "Software", description: "Service fulfilment, approvals and problem handling with SLAs." },
];

const f = (productCode: string, names: string[]): Feature[] =>
  names.map((name, i) => ({ id: `${productCode}-F${i + 1}`, productCode, name }));

export const INITIAL_FEATURES: Feature[] = [
  ...f("COM", ["Multi-channel order capture", "Customer profiles & history", "Delivery & dispatch tracking", "Promotions and discounts", "Loyalty programme", "Sales analytics dashboard"]),
  ...f("UCG", ["Accept payments by bank branch, ATM, USSD, Web", "Real-time payment tracking", "Automatic reconciliation", "Split settlement", "Revenue assurance dashboard", "Integration API"]),
  ...f("IMS", ["Stock levels by location", "Purchase orders", "Low-stock alerts", "Stock transfer between warehouses", "Batch & expiry tracking"]),
  ...f("WFM", ["Request forms & queues", "Approval workflows", "SLA management", "Ticket assignment & escalation", "Document collaboration", "Performance reports"]),
];

const price = (ngnMonthly: number, usdMonthly: number, gbpMonthly: number): Price[] => [
  { currency: "NGN", period: "MONTHLY", amount: ngnMonthly },
  { currency: "NGN", period: "ANNUALLY", amount: ngnMonthly * 10 },
  { currency: "USD", period: "MONTHLY", amount: usdMonthly },
  { currency: "USD", period: "ANNUALLY", amount: usdMonthly * 10 },
  { currency: "GBP", period: "MONTHLY", amount: gbpMonthly },
  { currency: "GBP", period: "ANNUALLY", amount: gbpMonthly * 10 },
];

const plan = (p: Omit<Plan, "tenantType" | "updatedBy" | "updatedAt"> & { updatedAt?: string; updatedBy?: string }): Plan => ({
  tenantType: "MERCHANT",
  updatedAt: daysFromToday(-120),
  updatedBy: "Isaac Adegunle",
  ...p,
});

const feats = (productCode: string, n: number) =>
  INITIAL_FEATURES.filter((x) => x.productCode === productCode).slice(0, n).map((x) => x.id);

export const INITIAL_PLANS: Plan[] = [
  // Customer Order Management
  plan({ code: "COM008", productCode: "COM", name: "Basic", billingModel: "PER_USER", prices: price(3000, 8, 6), featureIds: feats("COM", 2), trialDays: 30, recommended: false, priority: 1, status: "Live", customers: 2310 }),
  plan({ code: "COM009", productCode: "COM", name: "Standard", billingModel: "PER_USER", prices: price(8000, 20, 16), featureIds: feats("COM", 4), trialDays: 30, recommended: true, priority: 2, status: "Live", customers: 4120 }),
  plan({ code: "COM010", productCode: "COM", name: "Premium", billingModel: "PER_USER", prices: price(15000, 25, 20), featureIds: feats("COM", 6), trialDays: 0, recommended: false, priority: 3, status: "Live", customers: 980 }),
  plan({ code: "COM011", productCode: "COM", name: "Growth", billingModel: "PER_USER", prices: price(11000, 0, 0).filter((p) => p.currency === "NGN"), featureIds: feats("COM", 5), trialDays: 14, recommended: false, priority: 4, status: "Draft", customers: 0, updatedAt: daysFromToday(-2), updatedBy: CURRENT_USER }),
  plan({ code: "COM004", productCode: "COM", name: "Lyte", billingModel: "PER_USER", prices: price(1500, 4, 3), featureIds: feats("COM", 1), trialDays: 0, recommended: false, priority: 9, status: "Archived", customers: 0 }),
  plan({ code: "COM006", productCode: "COM", name: "Standard.", billingModel: "PER_USER", prices: price(7000, 18, 14), featureIds: feats("COM", 4), trialDays: 0, recommended: false, priority: 9, status: "Archived", customers: 0 }),
  // Unified Collections Gateway
  plan({ code: "UCG001", productCode: "UCG", name: "Starter", billingModel: "PER_TRANSACTION", prices: [{ currency: "NGN", period: "MONTHLY", amount: 50 }], featureIds: feats("UCG", 2), trialDays: 0, recommended: false, priority: 1, status: "Live", customers: 640 }),
  plan({ code: "UCG008", productCode: "UCG", name: "Standard", billingModel: "PER_USER", prices: price(10000, 20, 15), featureIds: feats("UCG", 4), trialDays: 30, recommended: true, priority: 2, status: "Live", customers: 1204 }),
  plan({ code: "UCG009", productCode: "UCG", name: "Premium", billingModel: "PER_USER", prices: price(15000, 25, 20), featureIds: feats("UCG", 6), trialDays: 0, recommended: false, priority: 3, status: "Live", customers: 512 }),
  plan({ code: "UCG003", productCode: "UCG", name: "Premium One", billingModel: "PER_TRANSACTION", prices: [{ currency: "NGN", period: "MONTHLY", amount: 40 }], featureIds: feats("UCG", 5), trialDays: 0, recommended: false, priority: 9, status: "Archived", customers: 0 }),
  // Inventory Management System
  plan({ code: "IMS005", productCode: "IMS", name: "Basic", billingModel: "PER_USER", prices: price(4000, 10, 8), featureIds: feats("IMS", 2), trialDays: 30, recommended: false, priority: 1, status: "Live", customers: 870 }),
  plan({ code: "IMS006", productCode: "IMS", name: "Standard", billingModel: "PER_USER", prices: price(9000, 22, 18), featureIds: feats("IMS", 4), trialDays: 30, recommended: true, priority: 2, status: "Live", customers: 1530 }),
  plan({ code: "IMS007", productCode: "IMS", name: "Premium", billingModel: "PER_USER", prices: price(14000, 30, 24), featureIds: feats("IMS", 5), trialDays: 0, recommended: false, priority: 3, status: "Live", customers: 402 }),
  plan({ code: "IMS003", productCode: "IMS", name: "Premium 1", billingModel: "PER_USER", prices: price(12000, 28, 22), featureIds: feats("IMS", 5), trialDays: 0, recommended: false, priority: 9, status: "Archived", customers: 0 }),
  // Workflow Manager
  plan({ code: "WFM007", productCode: "WFM", name: "Basic", billingModel: "PER_USER", prices: price(5000, 12, 10), featureIds: feats("WFM", 2), trialDays: 30, recommended: false, priority: 1, status: "Live", customers: 455 }),
  plan({ code: "WFM008", productCode: "WFM", name: "Standard", billingModel: "PER_USER", prices: price(10000, 24, 20), featureIds: feats("WFM", 4), trialDays: 30, recommended: true, priority: 2, status: "Live", customers: 1310 }),
  plan({ code: "WFM009", productCode: "WFM", name: "Premium", billingModel: "PER_USER", prices: price(18000, 40, 32), featureIds: feats("WFM", 6), trialDays: 0, recommended: false, priority: 3, status: "Live", customers: 288 }),
  plan({ code: "WFM001", productCode: "WFM", name: "Basic One", billingModel: "PERIODIC", prices: [{ currency: "NGN", period: "MONTHLY", amount: 25000 }], featureIds: feats("WFM", 2), trialDays: 0, recommended: false, priority: 9, status: "Archived", customers: 0 }),
];

export const BUNDLE_GROUPS: BundleGroup[] = [
  { key: "supplychain", name: "CICOD Supply Chain", description: "Order, inventory and workflow for distributors and manufacturers." },
  { key: "ecommerce", name: "CICOD eCommerce", description: "Online store, orders and payments for retailers." },
  { key: "enterprise", name: "CICOD Enterprise", description: "All products with enterprise limits." },
  { key: "nipost", name: "NIPOST", description: "Partner bundle for NIPOST merchants." },
  { key: "map", name: "CICOD MAP", description: "Merchant acquisition programme." },
  { key: "cicod", name: "CICOD", description: "General purpose bundles." },
];

const bundle = (b: Omit<Bundle, "updatedAt" | "updatedBy"> & { updatedAt?: string; updatedBy?: string }): Bundle => ({
  updatedAt: daysFromToday(-90),
  updatedBy: "Tobi Adeogun",
  ...b,
});

export const INITIAL_BUNDLES: Bundle[] = [
  bundle({ code: "CICODSUPPLYCHAIN001", name: "Standard", groupKey: "supplychain", planCodes: ["COM009", "IMS006", "WFM008"], billingModel: "PER_USER", prices: price(8000, 20, 16), minUsers: 1, maxUsers: 25, storageGb: 1000, trialDays: 30, status: "Live", customers: 3820 }),
  bundle({ code: "CICODSUPPLYCHAIN002", name: "Supply Chain & Manufacturing", groupKey: "supplychain", planCodes: ["COM010", "IMS007", "WFM009"], billingModel: "PER_USER", prices: price(22000, 50, 40), minUsers: 5, maxUsers: 200, storageGb: 5000, trialDays: 14, status: "Live", customers: 1140 }),
  bundle({ code: "CICODECOM001", name: "Standard", groupKey: "ecommerce", planCodes: ["COM009", "UCG008"], billingModel: "PER_USER", prices: price(12000, 28, 22), minUsers: 1, maxUsers: 10, storageGb: 500, trialDays: 30, status: "Live", customers: 2050 }),
  bundle({ code: "CICODECOM002", name: "Premium", groupKey: "ecommerce", planCodes: ["COM010", "UCG009"], billingModel: "PER_USER", prices: price(20000, 45, 36), minUsers: 1, maxUsers: 50, storageGb: 2000, trialDays: 0, status: "Live", customers: 760 }),
  bundle({ code: "NIP001", name: "NIPOST Merchant", groupKey: "nipost", planCodes: ["UCG009", "COM010"], billingModel: "PER_USER", prices: price(1000, 0, 0).filter((p) => p.currency === "NGN"), minUsers: 1, maxUsers: 10, storageGb: 100, trialDays: 0, status: "Live", customers: 9800 }),
  bundle({ code: "CICODENT001", name: "Enterprise", groupKey: "enterprise", planCodes: ["COM010", "UCG009", "IMS007", "WFM009"], billingModel: "PER_USER", prices: price(45000, 95, 75), minUsers: 25, maxUsers: 1000, storageGb: 20000, trialDays: 0, status: "Draft", customers: 0, updatedAt: daysFromToday(-1), updatedBy: CURRENT_USER }),
  bundle({ code: "CICODMAP001", name: "MAP Starter", groupKey: "map", planCodes: ["UCG001", "COM008"], billingModel: "PERIODIC", prices: [{ currency: "NGN", period: "MONTHLY", amount: 5000 }], minUsers: 1, maxUsers: 3, storageGb: 50, trialDays: 0, status: "Archived", customers: 0 }),
];

export const plansStore = createStore<Plan[]>(INITIAL_PLANS);
export const bundlesStore = createStore<Bundle[]>(INITIAL_BUNDLES);
export const featuresStore = createStore<Feature[]>(INITIAL_FEATURES);

export const usePlans = () => useStore(plansStore);
export const useBundles = () => useStore(bundlesStore);
export const useFeatures = () => useStore(featuresStore);

export function upsertPlan(next: Plan) {
  plansStore.set((prev) => (prev.some((p) => p.code === next.code) ? prev.map((p) => (p.code === next.code ? next : p)) : [next, ...prev]));
}

export function upsertBundle(next: Bundle) {
  bundlesStore.set((prev) => (prev.some((b) => b.code === next.code) ? prev.map((b) => (b.code === next.code ? next : b)) : [next, ...prev]));
}

export function addFeature(productCode: string, name: string): Feature {
  const feature = { id: `${productCode}-F${Date.now()}`, productCode, name };
  featuresStore.set((prev) => [...prev, feature]);
  return feature;
}

export const productByCode = (code: string) => PRODUCTS.find((p) => p.code === code);
export const groupByKey = (key: string) => BUNDLE_GROUPS.find((g) => g.key === key);

/** Bundles that include a plan — used to show impact and to block archiving. */
export const bundlesUsingPlan = (bundles: Bundle[], planCode: string) => bundles.filter((b) => b.planCodes.includes(planCode) && b.status !== "Archived");

export function headlinePrice(prices: Price[], currency: Currency = "NGN") {
  return prices.find((p) => p.currency === currency && p.period === "MONTHLY") ?? prices[0];
}

/** Gaps a publisher should notice before going live: currency with only one period priced. */
export function pricingGaps(prices: Price[]): string[] {
  const gaps: string[] = [];
  for (const c of CURRENCIES) {
    const periods = prices.filter((p) => p.currency === c && p.amount > 0).map((p) => p.period);
    if (periods.length === 1) gaps.push(`${c} has ${PERIOD_LABEL[periods[0]].toLowerCase()} pricing only`);
  }
  return gaps;
}

export const unitLabel = (model: BillingModel) => (model === "PER_USER" ? "/user" : model === "PER_TRANSACTION" ? "/txn" : "");
