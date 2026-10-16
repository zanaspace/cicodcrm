"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useCrmMutation, type MutationHookOptions } from "@/lib/mutations";
import { contactGroupsService } from "@/services/contact-groups";
import type { ContactGroupKind, ContactGroupRecord, ContactGroupRecordInput } from "@/lib/mock/contact-groups";

/** One cache entry per list: contact groups, types, lifecycles, marketing channels. */
export const contactGroupKey = (kind: ContactGroupKind) => queryKeys.contactGroups.scoped(kind);

export const useContactGroupRecordsQuery = (kind: ContactGroupKind) =>
  useQuery({ queryKey: contactGroupKey(kind), queryFn: () => contactGroupsService.list(kind) });

export const useCreateContactGroupRecord = (kind: ContactGroupKind, o: MutationHookOptions<ContactGroupRecordInput, ContactGroupRecord> = {}) =>
  useCrmMutation({ mutationFn: (input) => contactGroupsService.create(kind, input), invalidate: [contactGroupKey(kind)], ...o });

export const useUpdateContactGroupRecord = (kind: ContactGroupKind, o: MutationHookOptions<{ id: string; patch: Partial<ContactGroupRecordInput> }, ContactGroupRecord> = {}) =>
  useCrmMutation({ mutationFn: ({ id, patch }) => contactGroupsService.update(kind, id, patch), invalidate: [contactGroupKey(kind)], ...o });

export const useDeleteContactGroupRecord = (kind: ContactGroupKind, o: MutationHookOptions<{ id: string }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ id }) => contactGroupsService.remove(kind, id), invalidate: [contactGroupKey(kind)], ...o });
