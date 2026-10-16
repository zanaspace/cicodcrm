"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useCrmMutation, type MutationHookOptions } from "@/lib/mutations";
import { productManagementService } from "@/services/product-management";

const keys = queryKeys.productManagement;

/**
 * These records reference each other by name (products ↔ captions, offers, bundle groups, product and service types),
 * and in the backend they likely back the catalogue too, so every change refreshes the whole feature and the catalogue.
 */
const affected = [keys.all, queryKeys.catalogue.all];

type Resource<T, V> = {
  list: () => Promise<T[]>;
  create: (values: V) => Promise<T>;
  update: (id: string, patch: Partial<T>) => Promise<T>;
  remove: (id: string) => Promise<void>;
};

function resourceHooks<T, V>(name: string, svc: Resource<T, V>) {
  const key = keys.scoped(name);
  return {
    useList: () => useQuery({ queryKey: key, queryFn: svc.list }),
    useCreate: (o: MutationHookOptions<V, T> = {}) =>
      useCrmMutation({ mutationFn: (values: V) => svc.create(values), invalidate: affected, ...o }),
    useUpdate: (o: MutationHookOptions<{ id: string; patch: Partial<T> }, T> = {}) =>
      useCrmMutation({ mutationFn: ({ id, patch }: { id: string; patch: Partial<T> }) => svc.update(id, patch), invalidate: affected, ...o }),
    useDelete: (o: MutationHookOptions<{ id: string }, void> = {}) =>
      useCrmMutation({ mutationFn: ({ id }: { id: string }) => svc.remove(id), invalidate: affected, ...o }),
  };
}

const s = productManagementService;
const products = resourceHooks("products", s.products);
const captions = resourceHooks("product-captions", s.productCaptions);
const singleOffers = resourceHooks("single-offers", s.singleOffers);
const bundleOffers = resourceHooks("bundle-offers", s.bundleOffers);
const productTypes = resourceHooks("product-types", s.productTypes);
const bundleGroups = resourceHooks("bundle-groups", s.bundleGroups);
const serviceTypes = resourceHooks("service-types", s.serviceTypes);

export const useLegacyProductsQuery = products.useList;
export const useCreateLegacyProduct = products.useCreate;
export const useUpdateLegacyProduct = products.useUpdate;
export const useDeleteLegacyProduct = products.useDelete;

export const useProductCaptionsQuery = captions.useList;
export const useCreateProductCaption = captions.useCreate;
export const useUpdateProductCaption = captions.useUpdate;
export const useDeleteProductCaption = captions.useDelete;

export const useSingleOffersQuery = singleOffers.useList;
export const useCreateSingleOffer = singleOffers.useCreate;
export const useUpdateSingleOffer = singleOffers.useUpdate;
export const useDeleteSingleOffer = singleOffers.useDelete;

export const useBundleOffersQuery = bundleOffers.useList;
export const useCreateBundleOffer = bundleOffers.useCreate;
export const useUpdateBundleOffer = bundleOffers.useUpdate;
export const useDeleteBundleOffer = bundleOffers.useDelete;

export const useProductTypesQuery = productTypes.useList;
export const useCreateProductType = productTypes.useCreate;
export const useUpdateProductType = productTypes.useUpdate;
export const useDeleteProductType = productTypes.useDelete;

export const useLegacyBundleGroupsQuery = bundleGroups.useList;
export const useCreateLegacyBundleGroup = bundleGroups.useCreate;
export const useUpdateLegacyBundleGroup = bundleGroups.useUpdate;
export const useDeleteLegacyBundleGroup = bundleGroups.useDelete;

export const useServiceTypesQuery = serviceTypes.useList;
export const useCreateServiceType = serviceTypes.useCreate;
export const useUpdateServiceType = serviceTypes.useUpdate;
export const useDeleteServiceType = serviceTypes.useDelete;
