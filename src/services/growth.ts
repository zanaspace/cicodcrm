import { api } from "@/lib/api-client";
import {
  addLead, addLeadNote, addPartner, assignLead, campaignsStore, leadsStore, linkSubscriber, markLost, markWon, moveLead,
  partnersStore, plansStore, reopenLead, saveStages, setPartnerStatus, setSubscriberStatus, stagesStore, subscribersStore,
  updateCommissionPlan, updateLead, upsertCampaign,
  type Campaign, type CommissionPlan, type Lead, type LeadActivity, type Partner, type PartnerStatus, type PipelineStage,
  type StageId, type Subscriber,
} from "@/lib/mock/growth";
import { mockReject, via } from "@/services/mock";

/**
 * Growth: leads and pipeline stages, newsletter subscribers, partners and commission plans, campaigns
 * (legacy Angular: Marketing › Leads, Prospects, Manage Campaign; Communication › Subscription List;
 * Sales › Sales Channels, Sales Commission; Affiliate).
 * TODO(confirm against Angular): endpoint paths and payloads for every operation below.
 */
export const GROWTH_ENDPOINTS = {
  leads: "/leads", // TODO(confirm)
  lead: (id: string) => `/leads/${encodeURIComponent(id)}`, // TODO(confirm)
  leadAction: (id: string, action: string) => `/leads/${encodeURIComponent(id)}/${action}`, // TODO(confirm)
  stages: "/pipeline/stages", // TODO(confirm)
  subscribers: "/subscribers", // TODO(confirm)
  subscriber: (email: string) => `/subscribers/${encodeURIComponent(email)}`, // TODO(confirm)
  partners: "/partners", // TODO(confirm)
  partner: (id: string) => `/partners/${encodeURIComponent(id)}`, // TODO(confirm)
  commissionPlans: "/commission-plans", // TODO(confirm)
  commissionPlan: (id: string) => `/commission-plans/${encodeURIComponent(id)}`, // TODO(confirm)
  campaigns: "/campaigns", // TODO(confirm)
  campaign: (id: string) => `/campaigns/${encodeURIComponent(id)}`, // TODO(confirm)
};

const findMockLead = (id: string) => leadsStore.get().find((l) => l.id === id) ?? mockReject("Lead not found.", 404);
const findMockPartner = (id: string) => partnersStore.get().find((p) => p.id === id) ?? mockReject("Partner not found.", 404);

export type NewLead = Omit<Lead, "id" | "activity" | "createdAt">;
export type NewPartner = Pick<Partner, "name" | "type" | "email" | "phone" | "state">;

export const leadsService = {
  list: () => via(() => leadsStore.get(), () => api.get<Lead[]>(GROWTH_ENDPOINTS.leads)),
  get: (id: string) => via(() => findMockLead(id), () => api.get<Lead>(GROWTH_ENDPOINTS.lead(id))),
  create: (input: NewLead) => via(() => addLead(input), () => api.post<Lead>(GROWTH_ENDPOINTS.leads, { body: input })),
  update: (id: string, patch: Partial<Lead>) =>
    via(() => { findMockLead(id); updateLead(id, patch); return findMockLead(id); }, () => api.patch<Lead>(GROWTH_ENDPOINTS.lead(id), { body: patch })),
  move: (id: string, stage: StageId, note?: string) =>
    via(() => { findMockLead(id); moveLead(id, stage, note); }, () => api.post<void>(GROWTH_ENDPOINTS.leadAction(id, "move"), { body: { stage, note } })),
  assign: (id: string, owner: string) =>
    via(() => { findMockLead(id); assignLead(id, owner); }, () => api.post<void>(GROWTH_ENDPOINTS.leadAction(id, "assign"), { body: { owner } })),
  markLost: (id: string, reason: string, note: string) =>
    via(() => { findMockLead(id); markLost(id, reason, note); }, () => api.post<void>(GROWTH_ENDPOINTS.leadAction(id, "lost"), { body: { reason, note } })),
  reopen: (id: string) => via(() => { findMockLead(id); reopenLead(id); }, () => api.post<void>(GROWTH_ENDPOINTS.leadAction(id, "reopen"))),
  markWon: (id: string, cicod: string, company: string) =>
    via(() => { findMockLead(id); markWon(id, cicod, company); }, () => api.post<void>(GROWTH_ENDPOINTS.leadAction(id, "won"), { body: { cicod, company } })),
  addNote: (id: string, title: string, body?: string, kind?: LeadActivity["kind"]) =>
    via(() => { findMockLead(id); addLeadNote(id, title, body, kind); }, () => api.post<void>(GROWTH_ENDPOINTS.leadAction(id, "notes"), { body: { title, body, kind } })),
};

export const stagesService = {
  list: () => via(() => stagesStore.get(), () => api.get<PipelineStage[]>(GROWTH_ENDPOINTS.stages)),
  /** `moves` maps each removed stage to the stage its leads move to. */
  save: (stages: PipelineStage[], moves: Record<string, string>) =>
    via(() => { saveStages(stages, moves); return stagesStore.get(); }, () => api.put<PipelineStage[]>(GROWTH_ENDPOINTS.stages, { body: { stages, moves } })),
};

export const subscribersService = {
  list: () => via(() => subscribersStore.get(), () => api.get<Subscriber[]>(GROWTH_ENDPOINTS.subscribers)),
  setStatus: (email: string, status: Subscriber["status"]) =>
    via(() => setSubscriberStatus(email, status), () => api.patch<void>(GROWTH_ENDPOINTS.subscriber(email), { body: { status } })),
  linkToLead: (email: string, leadId: string) =>
    via(() => linkSubscriber(email, leadId), () => api.patch<void>(GROWTH_ENDPOINTS.subscriber(email), { body: { leadId } })),
};

export const partnersService = {
  list: () => via(() => partnersStore.get(), () => api.get<Partner[]>(GROWTH_ENDPOINTS.partners)),
  get: (id: string) => via(() => findMockPartner(id), () => api.get<Partner>(GROWTH_ENDPOINTS.partner(id))),
  create: (input: NewPartner) => via(() => addPartner(input), () => api.post<Partner>(GROWTH_ENDPOINTS.partners, { body: input })),
  setStatus: (id: string, status: PartnerStatus, reason?: string) =>
    via(() => { findMockPartner(id); setPartnerStatus(id, status, reason); }, () => api.patch<void>(GROWTH_ENDPOINTS.partner(id), { body: { status, reason } })),
};

export const commissionService = {
  list: () => via(() => plansStore.get(), () => api.get<CommissionPlan[]>(GROWTH_ENDPOINTS.commissionPlans)),
  update: (id: string, patch: Partial<CommissionPlan>) =>
    via(() => updateCommissionPlan(id, patch), () => api.patch<void>(GROWTH_ENDPOINTS.commissionPlan(id), { body: patch })),
};

export const campaignsService = {
  list: () => via(() => campaignsStore.get(), () => api.get<Campaign[]>(GROWTH_ENDPOINTS.campaigns)),
  save: (campaign: Campaign, isNew: boolean) =>
    via(() => { upsertCampaign(campaign); return campaign; },
      () => (isNew ? api.post<Campaign>(GROWTH_ENDPOINTS.campaigns, { body: campaign }) : api.put<Campaign>(GROWTH_ENDPOINTS.campaign(campaign.id), { body: campaign }))),
};
