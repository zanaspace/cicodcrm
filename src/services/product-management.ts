import { api } from "@/lib/api-client";
import {
  mockBundleOffers, mockLegacyBundleGroups, mockLegacyProducts, mockProductCaptions, mockProductTypes, mockServiceTypes, mockSingleOffers,
  type BundleOffer, type BundleOfferInput, type LegacyBundleGroup, type LegacyBundleGroupInput, type LegacyProduct, type LegacyProductInput,
  type ProductCaption, type ProductCaptionInput, type ProductType, type ProductTypeInput, type ServiceType, type ServiceTypeInput,
  type SingleOffer, type SingleOfferInput,
} from "@/lib/mock/product-management";
import { via } from "@/services/mock";

/**
 * Legacy Product Management screens (Angular: /crm/product, /crm/product-caption, /crm/product-offer,
 * /crm/product-bundle-offer, /crm/product-type, /crm/bundle-groups) and Service Configuration › Service Types
 * (/crm/service-type). Every screen offers list, create, update (including the status / web-visibility toggles)
 * and delete.
 * TODO(confirm against Angular): endpoint paths, id field names, whether status and visibility have their own
 * endpoints, and whether delete is a hard delete.
 */
export const PRODUCT_MANAGEMENT_ENDPOINTS = {
  products: "/product", // TODO(confirm)
  productCaptions: "/product-caption", // TODO(confirm)
  singleOffers: "/product-offer", // TODO(confirm)
  bundleOffers: "/product-bundle-offer", // TODO(confirm)
  productTypes: "/product-type", // TODO(confirm)
  bundleGroups: "/bundle-groups", // TODO(confirm)
  serviceTypes: "/service-type", // TODO(confirm)
  /** Item path for any of the collections above. */
  item: (collection: string, id: string) => `${collection}/${encodeURIComponent(id)}`, // TODO(confirm)
};

type MockResource<T, V> = {
  list: () => T[];
  create: (values: V) => T;
  update: (id: string, patch: Partial<T>) => T;
  remove: (id: string) => void;
};

/** One collection: GET list, POST create, PUT update, DELETE remove. */
function resource<T, V>(path: string, mock: MockResource<T, V>) {
  return {
    list: () => via(() => mock.list(), () => api.get<T[]>(path)),
    create: (values: V) => via(() => mock.create(values), () => api.post<T>(path, { body: values })),
    update: (id: string, patch: Partial<T>) =>
      via(() => mock.update(id, patch), () => api.put<T>(PRODUCT_MANAGEMENT_ENDPOINTS.item(path, id), { body: patch })),
    remove: (id: string) => via(() => mock.remove(id), () => api.delete<void>(PRODUCT_MANAGEMENT_ENDPOINTS.item(path, id))),
  };
}

const E = PRODUCT_MANAGEMENT_ENDPOINTS;

export const productManagementService = {
  products: resource<LegacyProduct, LegacyProductInput>(E.products, mockLegacyProducts),
  productCaptions: resource<ProductCaption, ProductCaptionInput>(E.productCaptions, mockProductCaptions),
  singleOffers: resource<SingleOffer, SingleOfferInput>(E.singleOffers, mockSingleOffers),
  bundleOffers: resource<BundleOffer, BundleOfferInput>(E.bundleOffers, mockBundleOffers),
  productTypes: resource<ProductType, ProductTypeInput>(E.productTypes, mockProductTypes),
  bundleGroups: resource<LegacyBundleGroup, LegacyBundleGroupInput>(E.bundleGroups, mockLegacyBundleGroups),
  serviceTypes: resource<ServiceType, ServiceTypeInput>(E.serviceTypes, mockServiceTypes),
};
