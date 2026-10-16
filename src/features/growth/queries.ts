"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useCrmMutation, type MutationHookOptions } from "@/lib/mutations";
import {
  campaignsService, commissionService, leadsService, partnersService, stagesService, subscribersService,
  type NewLead, type NewPartner,
} from "@/services/growth";
import type { Campaign, CommissionPlan, Lead, LeadActivity, Partner, PartnerStatus, PipelineStage, StageId, Subscriber } from "@/lib/mock/growth";

const g = queryKeys.growth;
const leadsKey = g.scoped("leads");
const stagesKey = g.scoped("stages");
const subscribersKey = g.scoped("subscribers");
const partnersKey = g.scoped("partners");
const commissionKey = g.scoped("commission");
const campaignsKey = g.scoped("campaigns");

/** Exposed for screens that read or patch the cache directly. */
export const growthKeys = { leads: leadsKey, lead: (id: string) => [...leadsKey, id] as const, stages: stagesKey, subscribers: subscribersKey, partners: partnersKey, commission: commissionKey, campaigns: campaignsKey };

/* ---------- Leads and pipeline ---------- */

export const useLeadsQuery = () => useQuery({ queryKey: leadsKey, queryFn: leadsService.list });
export const useLeadQuery = (id: string | undefined) =>
  useQuery({ queryKey: [...leadsKey, id], queryFn: () => leadsService.get(id!), enabled: !!id });
export const useStagesQuery = () => useQuery({ queryKey: stagesKey, queryFn: stagesService.list });

const leadsAffected = [leadsKey, queryKeys.dashboard.all];

export const useCreateLead = (o: MutationHookOptions<NewLead, Lead> = {}) =>
  useCrmMutation({ mutationFn: leadsService.create, invalidate: [leadsKey, subscribersKey], ...o });
export const useUpdateLead = (o: MutationHookOptions<{ id: string; patch: Partial<Lead> }, Lead> = {}) =>
  useCrmMutation({ mutationFn: ({ id, patch }) => leadsService.update(id, patch), invalidate: leadsAffected, ...o });
type MoveVars = { id: string; stage: StageId; note?: string };

/**
 * Moves a lead to another stage. The lead's stage changes in the cache straight away, so a card dropped on the board
 * stays in its new column while the request is pending, and goes back if the request fails.
 * `move()` allows moves of different leads at once (fast board drags); `run()` ignores calls while one is pending.
 * Both ignore a second move of a lead whose first move is still in flight.
 */
export function useMoveLead(o: MutationHookOptions<MoveVars, void> = {}) {
  const qc = useQueryClient();
  const previous = React.useRef(new Map<string, StageId>());
  const patchStage = (id: string, stage: StageId) => {
    qc.setQueryData<Lead[]>(leadsKey, (prev) => prev?.map((l) => (l.id === id ? { ...l, stage } : l)));
    qc.setQueryData<Lead>([...leadsKey, id], (prev) => (prev ? { ...prev, stage } : prev));
  };
  const m = useCrmMutation<MoveVars, void>({
    mutationFn: ({ id, stage, note }) => leadsService.move(id, stage, note),
    invalidate: leadsAffected,
    ...o,
    onSuccess: (data, vars) => { previous.current.delete(vars.id); o.onSuccess?.(data, vars); },
    onError: (error, vars) => {
      const from = previous.current.get(vars.id);
      previous.current.delete(vars.id);
      if (from) patchStage(vars.id, from);
      void qc.invalidateQueries({ queryKey: leadsKey });
      o.onError?.(error, vars);
    },
  });
  const optimistic = (vars: MoveVars) => {
    if (previous.current.has(vars.id)) return false;
    const current = qc.getQueryData<Lead[]>(leadsKey)?.find((l) => l.id === vars.id)?.stage ?? qc.getQueryData<Lead>([...leadsKey, vars.id])?.stage;
    if (current) previous.current.set(vars.id, current);
    void qc.cancelQueries({ queryKey: leadsKey });
    patchStage(vars.id, vars.stage);
    return true;
  };
  return {
    ...m,
    move: (vars: MoveVars) => { if (optimistic(vars)) m.mutate(vars); },
    run: (vars: MoveVars) => { if (!m.isPending && optimistic(vars)) m.mutate(vars); },
  };
}
export const useAssignLead = (o: MutationHookOptions<{ id: string; owner: string }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ id, owner }) => leadsService.assign(id, owner), invalidate: leadsAffected, ...o });
export const useMarkLeadLost = (o: MutationHookOptions<{ id: string; reason: string; note: string }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ id, reason, note }) => leadsService.markLost(id, reason, note), invalidate: leadsAffected, ...o });
export const useReopenLead = (o: MutationHookOptions<{ id: string }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ id }) => leadsService.reopen(id), invalidate: leadsAffected, ...o });
export const useMarkLeadWon = (o: MutationHookOptions<{ id: string; cicod: string; company: string }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ id, cicod, company }) => leadsService.markWon(id, cicod, company), invalidate: [...leadsAffected, queryKeys.customers.all], ...o });
export const useAddLeadNote = (o: MutationHookOptions<{ id: string; title: string; body?: string; kind?: LeadActivity["kind"] }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ id, title, body, kind }) => leadsService.addNote(id, title, body, kind), invalidate: [leadsKey], ...o });
export const useSaveStages = (o: MutationHookOptions<{ stages: PipelineStage[]; moves: Record<string, string> }, PipelineStage[]> = {}) =>
  useCrmMutation({ mutationFn: ({ stages, moves }) => stagesService.save(stages, moves), invalidate: [stagesKey, leadsKey], ...o });

/* ---------- Subscribers ---------- */

export const useSubscribersQuery = () => useQuery({ queryKey: subscribersKey, queryFn: subscribersService.list });
export const useSetSubscriberStatus = (o: MutationHookOptions<{ email: string; status: Subscriber["status"] }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ email, status }) => subscribersService.setStatus(email, status), invalidate: [subscribersKey], ...o });
export const useLinkSubscriber = (o: MutationHookOptions<{ email: string; leadId: string }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ email, leadId }) => subscribersService.linkToLead(email, leadId), invalidate: [subscribersKey, leadsKey], ...o });

/* ---------- Partners and commission ---------- */

export const usePartnersQuery = () => useQuery({ queryKey: partnersKey, queryFn: partnersService.list });
export const usePartnerQuery = (id: string | undefined) =>
  useQuery({ queryKey: [...partnersKey, id], queryFn: () => partnersService.get(id!), enabled: !!id });
export const useCreatePartner = (o: MutationHookOptions<NewPartner, Partner> = {}) =>
  useCrmMutation({ mutationFn: partnersService.create, invalidate: [partnersKey], ...o });
export const useSetPartnerStatus = (o: MutationHookOptions<{ id: string; status: PartnerStatus; reason?: string }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ id, status, reason }) => partnersService.setStatus(id, status, reason), invalidate: [partnersKey], ...o });

export const useCommissionPlansQuery = () => useQuery({ queryKey: commissionKey, queryFn: commissionService.list });
export const useUpdateCommissionPlan = (o: MutationHookOptions<{ id: string; patch: Partial<CommissionPlan> }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ id, patch }) => commissionService.update(id, patch), invalidate: [commissionKey, partnersKey], ...o });

/* ---------- Campaigns ---------- */

export const useCampaignsQuery = () => useQuery({ queryKey: campaignsKey, queryFn: campaignsService.list });
export const useSaveCampaign = (o: MutationHookOptions<{ campaign: Campaign; isNew: boolean }, Campaign> = {}) =>
  useCrmMutation({ mutationFn: ({ campaign, isNew }) => campaignsService.save(campaign, isNew), invalidate: [campaignsKey], ...o });
