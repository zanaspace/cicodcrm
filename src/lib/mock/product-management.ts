"use client";

import { createStore } from "@/lib/store";
import { CURRENT_USER } from "@/lib/format";

/**
 * Sample data for the legacy Product Management screens (Products, Product Captions, Single Offers, Bundle Offers,
 * Product Types, Bundle Groups) and Service Types. Screens reach it only through services/product-management.ts.
 */

export type LegacyStatus = "Active" | "Inactive";

type Audit = { createdBy: string; createdTime: string; updatedBy: string; updatedTime: string; status: LegacyStatus };

export type LegacyProduct = Audit & {
  id: string;
  code: string;
  name: string;
  description: string;
  productType: string;
  serviceType: string;
};
export type LegacyProductInput = Pick<LegacyProduct, "code" | "name" | "description" | "productType" | "serviceType">;

export type ProductCaption = Audit & { id: string; name: string; description: string; product: string };
export type ProductCaptionInput = Pick<ProductCaption, "name" | "description" | "product">;

export type SingleOffer = Audit & {
  id: string;
  offerCode: string;
  offerName: string;
  product: string;
  tenantType: string;
  subscriptionType: string;
  webVisibility: boolean;
};
export type SingleOfferInput = Pick<SingleOffer, "offerCode" | "offerName" | "product" | "tenantType" | "subscriptionType">;

export type BundleOffer = {
  id: string;
  bundleCode: string;
  bundleName: string;
  bundleGroup: string;
  tenantType: string;
  subscriptionType: string;
  createdBy: string;
  createdTime: string;
  updatedBy?: string;
  updatedTime?: string;
  webVisibility: boolean;
  status: LegacyStatus;
};
export type BundleOfferInput = Pick<BundleOffer, "bundleCode" | "bundleName" | "bundleGroup" | "tenantType" | "subscriptionType">;

export type ProductType = Audit & { id: string; name: string; description: string };
export type ProductTypeInput = Pick<ProductType, "name" | "description">;

export type LegacyBundleGroup = Audit & { id: string; name: string; key: string; description: string };
export type LegacyBundleGroupInput = Pick<LegacyBundleGroup, "name" | "key" | "description">;

export type ServiceType = Audit & { id: string; name: string; description: string; key: string };
export type ServiceTypeInput = Pick<ServiceType, "name" | "key" | "description" | "status">;

/** "DD-MM-YYYY hh:mm AM", the timestamp format the legacy screens display. */
export function formatLegacyTime(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const h = d.getHours();
  const h12 = h % 12 || 12;
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(h12)}:${pad(d.getMinutes())} ${h < 12 ? "AM" : "PM"}`;
}

/* ---------------- Seed data ---------------- */

export const INITIAL_LEGACY_PRODUCTS: LegacyProduct[] = [
  {
    id: "p-1",
    code: "COM001",
    name: "Customer Order Management.",
    description: "The CICOD Customer Order Management (COM) is a flexible and fully integrated single system that manages all aspects of an omnichannel business.",
    productType: "software",
    serviceType: "COM_SERVICE",
    createdBy: "Admin Admin",
    createdTime: "24-09-2019 07:23:07 PM",
    updatedBy: "Adetola Rabiu",
    updatedTime: "30-11-2019 02:01:18 PM",
    status: "Active",
  },
  {
    id: "p-2",
    code: "UCG001",
    name: "Unified Collections Gateway",
    description: "The CICOD Unified Collection Gateway (UCG) provides a robust platform for collecting payments from multiple channels.",
    productType: "software",
    serviceType: "UCG_SERVICE",
    createdBy: "Admin Admin",
    createdTime: "24-09-2019 07:13:20 PM",
    updatedBy: "Admin Admin",
    updatedTime: "24-09-2019 07:23:54 PM",
    status: "Active",
  },
];

export const INITIAL_PRODUCT_CAPTIONS: ProductCaption[] = [
  { id: "pc-1", name: "Returns & Refunds", description: "Returns & Refunds", product: "Customer Order Management.", createdBy: "Adeola Adesina", createdTime: "02-02-2022 11:14:53 PM", updatedBy: "", updatedTime: "", status: "Active" },
  { id: "pc-2", name: "Dedicated Account Manager", description: "Access to an Account Manager dedicated to support your account", product: "Workflow Manager", createdBy: "Adeola Adesina", createdTime: "31-01-2022 06:42:53 PM", updatedBy: "", updatedTime: "", status: "Active" },
];

export const INITIAL_SINGLE_OFFERS: SingleOffer[] = [
  { id: "so-1", offerCode: "UCG009", offerName: "Premium", product: "Unified Collections Gateway", tenantType: "MERCHANT", subscriptionType: "PER_USER", createdBy: "Williams Tomita", createdTime: "08-09-2020 04:08:15 AM", updatedBy: "Isaac Adegunle", updatedTime: "24-08-2021 01:13:47 PM", webVisibility: true, status: "Active" },
  { id: "so-2", offerCode: "UCG008", offerName: "Standard", product: "Unified Collections Gateway", tenantType: "MERCHANT", subscriptionType: "PER_USER", createdBy: "Williams Tomita", createdTime: "08-09-2020 04:03:37 AM", updatedBy: "Isaac Adegunle", updatedTime: "24-08-2021 01:15:53 PM", webVisibility: true, status: "Active" },
];

export const INITIAL_BUNDLE_OFFERS: BundleOffer[] = [
  { id: "bo-1", bundleCode: "NIP001", bundleName: "Nipost Merchant", bundleGroup: "NIPOST", tenantType: "MERCHANT", subscriptionType: "PER_USER", createdBy: "Adeola Adesina", createdTime: "06-03-2024 09:58:25 AM", webVisibility: false, status: "Active" },
  { id: "bo-2", bundleCode: "CICODENTERPRISE002", bundleName: "Elite Plus", bundleGroup: "CICOD Enterprise", tenantType: "MERCHANT", subscriptionType: "PER_USER", createdBy: "Williams Tomita", createdTime: "08-09-2020 05:22:10 AM", webVisibility: true, status: "Active" },
];

export const INITIAL_PRODUCT_TYPES: ProductType[] = [
  { id: "pt-1", name: "software", description: "", createdBy: "Admin Admin", createdTime: "24-09-2019 01:48:45 PM", updatedBy: "Adetola Rabiu", updatedTime: "07-11-2019 02:28:13 PM", status: "Active" },
];

export const INITIAL_LEGACY_BUNDLE_GROUPS: LegacyBundleGroup[] = [
  { id: "bg-1", name: "NIPOST", key: "nipost_bundles", description: "for NIPOST project", createdBy: "Adeola Adesina", createdTime: "06-03-2024 09:52:59 AM", updatedBy: "", updatedTime: "", status: "Active" },
  { id: "bg-2", name: "CICOD Enterprise", key: "cicod_enterprise", description: "This is a bundle group for CICOD Enterprise Product", createdBy: "Williams Tomita", createdTime: "07-09-2020 12:56:17 PM", updatedBy: "", updatedTime: "", status: "Active" },
];

export const INITIAL_SERVICE_TYPES: ServiceType[] = [
  { id: "svc-1", name: "UCG_SERVICE", description: "This is a service for Unified Collection Gateway.", key: "ucg", createdBy: "Admin Admin", createdTime: "24-09-2019 06:01 PM", updatedBy: "Adetola Rabiu", updatedTime: "18-02-2020 02:39 PM", status: "Active" },
  { id: "svc-2", name: "COM_SERVICE", description: "This is a service for Customer Order Management.", key: "com", createdBy: "Admin Admin", createdTime: "24-09-2019 05:59 PM", updatedBy: "Admin Admin", updatedTime: "18-10-2019 12:14 PM", status: "Active" },
  { id: "svc-3", name: "IMS_SERVICE", description: "This is a service for Inventory Management System.", key: "ims", createdBy: "Admin Admin", createdTime: "24-09-2019 05:54 PM", updatedBy: "Admin Admin", updatedTime: "24-09-2019 06:07 PM", status: "Active" },
  { id: "svc-4", name: "WFM_SERVICE", description: "This is a service for Workflow Management System.", key: "wfm", createdBy: "Admin Admin", createdTime: "24-09-2019 02:12 PM", updatedBy: "Adetola Rabiu", updatedTime: "30-11-2019 02:00 PM", status: "Active" },
];

/* ---------------- Stores ---------------- */

export const legacyProductsStore = createStore<LegacyProduct[]>(INITIAL_LEGACY_PRODUCTS);
export const productCaptionsStore = createStore<ProductCaption[]>(INITIAL_PRODUCT_CAPTIONS);
export const singleOffersStore = createStore<SingleOffer[]>(INITIAL_SINGLE_OFFERS);
export const bundleOffersStore = createStore<BundleOffer[]>(INITIAL_BUNDLE_OFFERS);
export const productTypesStore = createStore<ProductType[]>(INITIAL_PRODUCT_TYPES);
export const legacyBundleGroupsStore = createStore<LegacyBundleGroup[]>(INITIAL_LEGACY_BUNDLE_GROUPS);
export const serviceTypesStore = createStore<ServiceType[]>(INITIAL_SERVICE_TYPES);

/* ---------------- Mock operations (used by services/product-management.ts only) ---------------- */

type Store<T> = ReturnType<typeof createStore<T[]>>;

/**
 * List / create / update / delete against one store. `build` turns form values into a new record, so each screen
 * keeps the defaults it had (who is stamped as updater on create, default status, web visibility).
 */
function legacyResource<T extends { id: string }, V>(store: Store<T>, idPrefix: string, build: (values: V, now: string) => Omit<T, "id">) {
  const find = (id: string) => {
    const found = store.get().find((r) => r.id === id);
    if (!found) throw new Error("This record no longer exists. Refresh the list and try again.");
    return found;
  };
  return {
    list: () => store.get(),
    create: (values: V): T => {
      const record = { id: `${idPrefix}-${Date.now()}`, ...build(values, formatLegacyTime()) } as T;
      store.set((prev) => [record, ...prev]);
      return record;
    },
    update: (id: string, patch: Partial<T>): T => {
      const next = { ...find(id), ...patch, id, updatedBy: CURRENT_USER, updatedTime: formatLegacyTime() };
      store.set((prev) => prev.map((r) => (r.id === id ? next : r)));
      return next;
    },
    remove: (id: string) => {
      find(id);
      store.set((prev) => prev.filter((r) => r.id !== id));
    },
  };
}

const stampedBoth = (now: string) => ({ createdBy: CURRENT_USER, createdTime: now, updatedBy: CURRENT_USER, updatedTime: now });
const stampedCreate = (now: string) => ({ createdBy: CURRENT_USER, createdTime: now, updatedBy: "", updatedTime: "" });

export const mockLegacyProducts = legacyResource<LegacyProduct, LegacyProductInput>(legacyProductsStore, "p",
  (v, now) => ({ ...v, ...stampedBoth(now), status: "Active" }));
export const mockProductCaptions = legacyResource<ProductCaption, ProductCaptionInput>(productCaptionsStore, "pc",
  (v, now) => ({ ...v, ...stampedCreate(now), status: "Active" }));
export const mockSingleOffers = legacyResource<SingleOffer, SingleOfferInput>(singleOffersStore, "so",
  (v, now) => ({ ...v, ...stampedCreate(now), status: "Active", webVisibility: true }));
export const mockBundleOffers = legacyResource<BundleOffer, BundleOfferInput>(bundleOffersStore, "bo",
  (v, now) => ({ ...v, createdBy: CURRENT_USER, createdTime: now, status: "Active", webVisibility: true }));
export const mockProductTypes = legacyResource<ProductType, ProductTypeInput>(productTypesStore, "pt",
  (v, now) => ({ ...v, ...stampedBoth(now), status: "Active" }));
export const mockLegacyBundleGroups = legacyResource<LegacyBundleGroup, LegacyBundleGroupInput>(legacyBundleGroupsStore, "bg",
  (v, now) => ({ ...v, ...stampedCreate(now), status: "Active" }));
export const mockServiceTypes = legacyResource<ServiceType, ServiceTypeInput>(serviceTypesStore, "svc",
  (v, now) => ({ ...v, ...stampedBoth(now) }));
