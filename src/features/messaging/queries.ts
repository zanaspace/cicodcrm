"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useCrmMutation, type MutationHookOptions } from "@/lib/mutations";
import { messagingService } from "@/services/messaging";
import type { Template } from "@/lib/mock/messaging";

const templatesKey = queryKeys.messaging.scoped("templates");

export const useTemplatesQuery = () => useQuery({ queryKey: templatesKey, queryFn: messagingService.templates });

/** Templates are used by dunning steps and notification rules, so those views refresh too. */
export const useSaveTemplate = (o: MutationHookOptions<{ template: Template; isNew: boolean }, Template> = {}) =>
  useCrmMutation({
    mutationFn: ({ template, isNew }) => messagingService.saveTemplate(template, isNew),
    invalidate: [queryKeys.messaging.all, queryKeys.billing.scoped("policies"), queryKeys.settings.scoped("notifications")],
    ...o,
  });
