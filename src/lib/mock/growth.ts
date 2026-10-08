"use client";

import { createStore, useStore } from "@/lib/store";
import { CURRENT_USER, daysFromToday, daysUntil } from "@/lib/format";
import { customersStore, getHealth, monthlyValue, SEGMENTS, type Customer } from "@/lib/mock/customers";
import { lastAttemptAt, paymentsStore, paymentStatus } from "@/lib/mock/billing";

/* ================= Pipeline ================= */

/** Badge tones a stage can use (the shared Badge variants). */
export type StageTone = "info" | "warning" | "success" | "secondary" | "muted" | "destructive";
export const STAGE_TONES: { tone: StageTone; name: string }[] = [
  { tone: "info", name: "Blue" },
  { tone: "warning", name: "Amber" },
  { tone: "success", name: "Green" },
  { tone: "secondary", name: "Navy" },
  { tone: "muted", name: "Grey" },
];
export type PipelineStage = { id: string; label: string; tone: StageTone };
export type StageId = string;

/** Won and Lost are fixed: Won only by converting to a customer, Lost only with a reason. */
export const WON_STAGE: PipelineStage = { id: "won", label: "Won", tone: "success" };
export const LOST_STAGE: PipelineStage = { id: "lost", label: "Lost", tone: "destructive" };
export const MAX_STAGES = 8;

const DEFAULT_STAGES: PipelineStage[] = [
  { id: "new", label: "New", tone: "info" },
  { id: "contacted", label: "Contacted", tone: "info" },
  { id: "presentation", label: "Presentation", tone: "warning" },
  { id: "proposal", label: "Proposal", tone: "warning" },
];

/** The open stages, in order. Teams can add, rename, recolour, reorder and remove them. */
export const stagesStore = createStore<PipelineStage[]>(DEFAULT_STAGES);
export const useStages = () => useStore(stagesStore);

export const isOpenStage = (id: StageId) => id !== WON_STAGE.id && id !== LOST_STAGE.id;
export function stageById(id: StageId): PipelineStage | undefined {
  if (id === WON_STAGE.id) return WON_STAGE;
  if (id === LOST_STAGE.id) return LOST_STAGE;
  return stagesStore.get().find((s) => s.id === id);
}
export const stageLabel = (id: StageId) => stageById(id)?.label ?? id;

/** Problems with a draft stage list, keyed by stage id (empty when it can be saved). */
export function stageErrors(list: PipelineStage[]): Record<string, string> {
  const errors: Record<string, string> = {};
  const reserved = [WON_STAGE.label, LOST_STAGE.label].map((n) => n.toLowerCase());
  list.forEach((s) => {
    const name = s.label.trim().toLowerCase();
    if (!name) errors[s.id] = "Give the stage a name";
    else if (s.label.trim().length > 24) errors[s.id] = "Keep it under 24 characters";
    else if (reserved.includes(name)) errors[s.id] = `“${s.label.trim()}” is a fixed stage`;
    else if (list.some((o) => o.id !== s.id && o.label.trim().toLowerCase() === name)) errors[s.id] = "Two stages have this name";
  });
  return errors;
}

/** Save the stage list. `moves` maps each removed stage to the stage its leads move to. */
export function saveStages(next: PipelineStage[], moves: Record<string, string>) {
  const names = Object.fromEntries(stagesStore.get().map((s) => [s.id, s.label]));
  const cleaned = next.map((s) => ({ ...s, label: s.label.trim() }));
  const label = (id: string) => cleaned.find((s) => s.id === id)?.label ?? id;
  leadsStore.set((prev) => prev.map((l) => {
    const to = moves[l.stage];
    if (!to) return l;
    const entry: LeadActivity = { id: `${l.id}-mv-${Date.now()}`, at: new Date().toISOString(), by: CURRENT_USER, kind: "stage", title: `Moved to ${label(to)}`, body: `The “${names[l.stage]}” stage was removed.` };
    return { ...l, stage: to, activity: [entry, ...l.activity] };
  }));
  stagesStore.set(cleaned);
}

/** Legacy "Marketing Channels" are really where a lead came from. */
export const SOURCES = [
  { name: "Website", active: true },
  { name: "Facebook", active: true },
  { name: "Affiliate (ICE)", active: true },
  { name: "Affiliate (Business Partner)", active: true },
  { name: "Referral", active: true },
  { name: "Event", active: true },
  { name: "Email", active: false },
];

export const OWNERS = [CURRENT_USER, "Isaac Adegunle", "Tolu Animashaun", "Ope Sangobowale"];
export const LOST_REASONS = ["Price", "Timing", "Chose a competitor", "No response", "Not a fit"];

export type LeadActivity = { id: string; at: string; kind: "note" | "stage" | "call" | "created" | "owner"; title: string; body?: string; by: string };

export type Lead = {
  id: string;
  company: string;
  contact: string;
  designation: string;
  email: string;
  phone: string;
  sector: string;
  state: string;
  source: string;
  owner: string | null;
  stage: StageId;
  interest: string;
  estMonthly: number;
  createdAt: string;
  nextFollowUp: string | null;
  lostReason?: string;
  /** Stage the lead was in when it was marked lost, so Reopen puts it back there. */
  lostFromStage?: StageId;
  customerCicod?: string;
  partnerId?: string;
  activity: LeadActivity[];
};

type LeadSeed = [string, string, string, string, string, string, string, string | null, StageId, string, number, number, number | null, string?];
// company, contact, designation, sector, state, source, interest, owner, stage, email domain, est ₦/mo, created (days ago), follow-up (days from today), partnerId
const LEAD_SEEDS: LeadSeed[] = [
  ["Adaeze Stores", "Adaeze Okafor", "Owner", "Retail", "Lagos", "Facebook", "CICOD eCommerce · Standard", CURRENT_USER, "proposal", "adaezestores.ng", 12000, 18, 1],
  ["Kano Grains Ltd", "Musa Abdullahi", "Operations Manager", "Agriculture", "Kano", "Affiliate (ICE)", "CICOD Supply Chain · Standard", "Isaac Adegunle", "presentation", "kanograins.com", 24000, 25, 3, "p-ice-02"],
  ["Bayelsa Fresh Fish", "Tamara Ebi", "CEO", "FMCG", "Rivers", "Referral", "Customer Order Management · Basic", CURRENT_USER, "contacted", "bayelsafresh.ng", 3000, 6, 0],
  ["Ibadan Prints", "Kunle Adeyemi", "Director", "Professional Services", "Oyo", "Event", "Workflow Manager · Standard", "Tolu Animashaun", "contacted", "ibadanprints.com", 10000, 9, -2],
  ["Zaria Pharma", "Hadiza Bello", "Pharmacist", "Retail", "Kaduna", "Website", "CICOD eCommerce · Standard", null, "new", "zariapharma.ng", 12000, 2, null],
  ["Lekki Bakehouse", "Ronke Ade", "Owner", "Ecommerce/Hospitality/Entertainment", "Lagos", "Facebook", "Customer Order Management · Standard", CURRENT_USER, "presentation", "lekkibakehouse.ng", 16000, 14, 2],
  ["Aba Leatherworks", "Chidi Nnamdi", "Founder", "Manufacturing", "Anambra", "Affiliate (Business Partner)", "CICOD Supply Chain · Supply Chain & Manufacturing", "Ope Sangobowale", "proposal", "abaleather.com", 88000, 33, -1, "p-bp-01"],
  ["Jos Hilltop Hotel", "Danjuma Pam", "GM", "Ecommerce/Hospitality/Entertainment", "Abuja (FCT)", "Referral", "Workflow Manager · Premium", "Isaac Adegunle", "new", "hilltophotel.ng", 18000, 1, 1],
  ["Ogun Agro Inputs", "Bola Ogunleye", "Sales Lead", "Agriculture", "Ogun", "Affiliate (ICE)", "Inventory Management System · Standard", CURRENT_USER, "won", "ogunagro.ng", 9000, 40, null, "p-ice-01"],
  ["Calabar Couture", "Ekaette Bassey", "Creative Director", "Retail", "Rivers", "Facebook", "CICOD eCommerce · Premium", "Tolu Animashaun", "lost", "calabarcouture.com", 20000, 52, null],
  ["Ikeja Auto Parts", "Femi Lawal", "Manager", "Retail", "Lagos", "Website", "Inventory Management System · Basic", null, "new", "ikejaauto.ng", 4000, 3, null],
  ["Enugu Coal Logistics", "Obinna Eze", "COO", "Logistics", "Enugu", "Event", "Workflow Manager · Standard", "Ope Sangobowale", "presentation", "enugucoal.com", 30000, 21, 5],
];

const SIGNUPS: [string, string, number][] = [
  // email domain, contact first name, signed up (days ago)  → website sign-ups from the Subscription List
  ["mamatsweets.ng", "Mama T", 4],
  ["sokotoagro.com", "Sani", 11],
  ["glowbeauty.ng", "Ijeoma", 23],
  ["deltafurniture.ng", "Ese", 37],
];

function seedLeads(): Lead[] {
  const leads: Lead[] = LEAD_SEEDS.map(([company, contact, designation, sector, state, source, interest, owner, stage, domain, est, created, follow, partnerId], i) => {
    const id = `L-${1001 + i}`;
    const activity: LeadActivity[] = [{ id: `${id}-a0`, at: daysFromToday(-created), kind: "created", title: `Lead created from ${source}`, by: owner ?? "Website" }];
    const path = DEFAULT_STAGES.map((x) => x.id);
    const order = path.indexOf(stage);
    path.slice(1, order === -1 ? (stage === "won" ? 4 : 2) : order + 1).forEach((st, k) =>
      activity.push({ id: `${id}-s${k}`, at: daysFromToday(-created + 3 * (k + 1)), kind: "stage", title: `Moved to ${stageLabel(st)}`, by: owner ?? CURRENT_USER }),
    );
    if (stage === "won") activity.push({ id: `${id}-w`, at: daysFromToday(-created + 15), kind: "stage", title: "Won: converted to customer", by: owner ?? CURRENT_USER });
    if (stage === "lost") activity.push({ id: `${id}-l`, at: daysFromToday(-created + 20), kind: "stage", title: "Marked lost", body: "Reason: Price. Went with a cheaper local tool.", by: owner ?? CURRENT_USER });
    if (stage !== "new") activity.push({ id: `${id}-c`, at: daysFromToday(-created + 2), kind: "call", title: "Intro call", body: `Spoke with ${contact.split(" ")[0]} about ${interest}.`, by: owner ?? CURRENT_USER });
    return {
      id, company, contact, designation, email: `${contact.split(" ")[0].toLowerCase()}@${domain}`, phone: `+23480${String(31000000 + i * 7919).slice(0, 8)}`,
      sector, state, source, owner, stage, interest, estMonthly: est, createdAt: daysFromToday(-created),
      nextFollowUp: follow == null ? null : daysFromToday(follow), lostReason: stage === "lost" ? "Price" : undefined,
      customerCicod: stage === "won" ? "23468" : undefined, partnerId,
      activity: activity.sort((a, b) => b.at.localeCompare(a.at)),
    };
  });
  SIGNUPS.forEach(([domain, first, ago], i) => {
    const id = `L-${2001 + i}`;
    leads.push({
      id, company: domain.split(".")[0].replace(/^\w/, (c) => c.toUpperCase()), contact: first, designation: "", email: `hello@${domain}`, phone: "",
      sector: "Others", state: "", source: "Website", owner: null, stage: "new", interest: "Not stated (newsletter sign-up)", estMonthly: 0,
      createdAt: daysFromToday(-ago), nextFollowUp: null,
      activity: [{ id: `${id}-a0`, at: daysFromToday(-ago), kind: "created", title: "Signed up on cicod.com", body: "Subscribed to updates from the website footer.", by: "Website" }],
    });
  });
  return leads;
}

export const leadsStore = createStore<Lead[]>(seedLeads());
export const useLeads = () => useStore(leadsStore);

const logLead = (id: string, a: Omit<LeadActivity, "id" | "at" | "by"> & { by?: string }) =>
  leadsStore.set((prev) => prev.map((l) => (l.id === id ? { ...l, activity: [{ id: `${id}-${Date.now()}`, at: new Date().toISOString(), by: CURRENT_USER, ...a }, ...l.activity] } : l)));

export function updateLead(id: string, patch: Partial<Lead>) {
  leadsStore.set((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
}
export function moveLead(id: string, stage: StageId, note?: string) {
  const from = leadsStore.get().find((l) => l.id === id)?.stage;
  if (!from || from === stage) return;
  updateLead(id, { stage });
  logLead(id, { kind: "stage", title: `Moved to ${stageLabel(stage)}`, body: [`From ${stageLabel(from)}.`, note?.trim()].filter(Boolean).join(" ") });
}
export function assignLead(id: string, owner: string) {
  updateLead(id, { owner });
  logLead(id, { kind: "owner", title: `Assigned to ${owner}` });
}
export function markLost(id: string, reason: string, note: string) {
  const from = leadsStore.get().find((l) => l.id === id)?.stage;
  updateLead(id, { stage: "lost", lostReason: reason, lostFromStage: from, nextFollowUp: null });
  logLead(id, { kind: "stage", title: "Marked lost", body: `Reason: ${reason}.${note ? ` ${note}` : ""}` });
}
export function reopenLead(id: string) {
  const lead = leadsStore.get().find((l) => l.id === id);
  const stages = stagesStore.get();
  const back = stages.find((s) => s.id === lead?.lostFromStage) ?? stages[0];
  updateLead(id, { stage: back.id, lostReason: undefined, lostFromStage: undefined });
  logLead(id, { kind: "stage", title: `Reopened in ${back.label}` });
}
export function markWon(id: string, cicod: string, company: string) {
  updateLead(id, { stage: "won", customerCicod: cicod, nextFollowUp: null });
  logLead(id, { kind: "stage", title: "Won: converted to customer", body: `Created customer ${company} (#${cicod}).` });
}
export function addLeadNote(id: string, title: string, body?: string, kind: LeadActivity["kind"] = "note") {
  logLead(id, { kind, title, body });
}
export function addLead(l: Omit<Lead, "id" | "activity" | "createdAt">): Lead {
  const lead: Lead = { ...l, id: `L-${3000 + leadsStore.get().length}`, createdAt: daysFromToday(0), activity: [{ id: `new-${Date.now()}`, at: new Date().toISOString(), kind: "created", title: `Lead created from ${l.source}`, by: CURRENT_USER }] };
  leadsStore.set((prev) => [lead, ...prev]);
  return lead;
}

export const LEAD_VIEWS = [
  { id: "open", label: "Open", test: (l: Lead) => isOpenStage(l.stage) },
  { id: "unassigned", label: "Unassigned", test: (l: Lead) => !l.owner && isOpenStage(l.stage) },
  { id: "mine", label: "My leads", test: (l: Lead) => l.owner === CURRENT_USER && isOpenStage(l.stage) },
  { id: "followup", label: "Follow-up due", test: (l: Lead) => !!l.nextFollowUp && daysUntil(l.nextFollowUp) <= 0 && isOpenStage(l.stage) },
  { id: "won", label: "Won", test: (l: Lead) => l.stage === "won" },
  { id: "lost", label: "Lost", test: (l: Lead) => l.stage === "lost" },
] as const;

/* ================= Subscribers ================= */

export type Subscriber = { email: string; source: "Website" | "Checkout" | "Event"; subscribedAt: string; status: "Subscribed" | "Unsubscribed"; leadId?: string };

export const subscribersStore = createStore<Subscriber[]>([
  ...SIGNUPS.map(([domain, , ago], i) => ({ email: `hello@${domain}`, source: "Website" as const, subscribedAt: daysFromToday(-ago), status: "Subscribed" as const, leadId: `L-${2001 + i}` })),
  { email: "info@surulerefoods.ng", source: "Website", subscribedAt: daysFromToday(-52), status: "Subscribed" },
  { email: "orders@abujagadgets.com", source: "Checkout", subscribedAt: daysFromToday(-70), status: "Subscribed" },
  { email: "team@warrifabrics.ng", source: "Event", subscribedAt: daysFromToday(-96), status: "Subscribed" },
  { email: "admin@osogbobooks.ng", source: "Website", subscribedAt: daysFromToday(-131), status: "Unsubscribed" },
  { email: "hello@lagosplants.co", source: "Website", subscribedAt: daysFromToday(-160), status: "Subscribed" },
  { email: "contact@benincrafts.ng", source: "Website", subscribedAt: daysFromToday(-205), status: "Subscribed" },
]);
export const useSubscribers = () => useStore(subscribersStore);
export function setSubscriberStatus(email: string, status: Subscriber["status"]) {
  subscribersStore.set((prev) => prev.map((s) => (s.email === email ? { ...s, status } : s)));
}
export function linkSubscriber(email: string, leadId: string) {
  subscribersStore.set((prev) => prev.map((s) => (s.email === email ? { ...s, leadId } : s)));
}

/* ================= Partners and commission ================= */

export type PartnerType = "ICE" | "Business partner" | "Delivery partner";
export const PARTNER_TYPES: PartnerType[] = ["ICE", "Business partner", "Delivery partner"];
export const PARTNER_TYPE_LABEL: Record<PartnerType, string> = { ICE: "Independent CICOD Executive", "Business partner": "Business partner", "Delivery partner": "Delivery partner" };
export type PartnerStatus = "Pending" | "Verified" | "Suspended" | "Rejected";

export type Partner = {
  id: string;
  name: string;
  type: PartnerType;
  status: PartnerStatus;
  email: string;
  phone: string;
  state: string;
  bank: string;
  accountLast4: string;
  documents: { name: string; kind: "ID" | "CAC certificate" | "Utility bill" | "Bank letter" }[];
  referred: string[];
  deliveries: number;
  joinedAt: string;
  activity: { at: string; title: string; by: string }[];
};

const partner = (id: string, name: string, type: PartnerType, status: PartnerStatus, state: string, joined: number, referred: string[], docs: Partner["documents"], deliveries = 0): Partner => ({
  id, name, type, status, state, referred, documents: docs, deliveries,
  email: `${name.split(" ")[0].toLowerCase()}@${type === "ICE" ? "gmail.com" : name.split(" ")[0].toLowerCase() + ".ng"}`,
  phone: `+23490${String(20000000 + id.length * 104729 + joined).slice(0, 8)}`,
  bank: ["Access Bank", "GTBank", "Zenith Bank", "UBA", "Paycom"][joined % 5], accountLast4: String(1000 + ((joined * 37) % 9000)).slice(0, 4),
  joinedAt: daysFromToday(-joined),
  activity: [{ at: daysFromToday(-joined), title: "Signed up as a sales partner", by: "Website" }, ...(status === "Verified" ? [{ at: daysFromToday(-joined + 4), title: "Verified", by: "Isaac Adegunle" }] : [])],
});

export const partnersStore = createStore<Partner[]>([
  partner("p-ice-01", "Tochukwu Obiakonwa", "ICE", "Verified", "Ogun", 460, ["23484", "23482", "23472"], [{ name: "NIN slip.pdf", kind: "ID" }, { name: "Bank letter.pdf", kind: "Bank letter" }]),
  partner("p-ice-02", "Humphrey Ossai", "ICE", "Verified", "Kano", 430, ["23479", "23470"], [{ name: "Voter card.jpg", kind: "ID" }]),
  partner("p-ice-03", "Grace Etuk", "ICE", "Verified", "Lagos", 300, ["23480", "23477"], [{ name: "Passport.pdf", kind: "ID" }]),
  partner("p-ice-04", "Yusuf Danladi", "ICE", "Pending", "Kaduna", 6, [], [{ name: "NIN slip.pdf", kind: "ID" }, { name: "Utility bill.jpg", kind: "Utility bill" }]),
  partner("p-ice-05", "Blessing Okoro", "ICE", "Pending", "Lagos", 3, [], [{ name: "Drivers licence.jpg", kind: "ID" }]),
  partner("p-ice-06", "Samuel Ade", "ICE", "Pending", "Oyo", 12, [], []),
  partner("p-ice-07", "Halima Yakubu", "ICE", "Suspended", "Abuja (FCT)", 520, ["23478"], [{ name: "NIN slip.pdf", kind: "ID" }]),
  partner("p-bp-01", "Ifeanyi Nwocha Ventures", "Business partner", "Pending", "Lagos", 1, [], [{ name: "online sign up flow.docx", kind: "CAC certificate" }]),
  partner("p-bp-02", "Rebecca Adesina Consulting", "Business partner", "Pending", "Lagos", 2, [], [{ name: "CAC certificate.pdf", kind: "CAC certificate" }, { name: "Bank letter.pdf", kind: "Bank letter" }]),
  partner("p-bp-03", "Northern Retail Hub", "Business partner", "Verified", "Kano", 610, ["23476", "23474", "23469"], [{ name: "CAC certificate.pdf", kind: "CAC certificate" }]),
  partner("p-bp-04", "Coastal Merchants Network", "Business partner", "Verified", "Rivers", 380, ["23485", "23475"], [{ name: "CAC certificate.pdf", kind: "CAC certificate" }]),
  partner("p-dp-01", "Swift Dispatch Ltd", "Delivery partner", "Verified", "Lagos", 700, [], [{ name: "CAC certificate.pdf", kind: "CAC certificate" }], 46),
  partner("p-dp-02", "Kwik Riders", "Delivery partner", "Verified", "Abuja (FCT)", 640, [], [{ name: "CAC certificate.pdf", kind: "CAC certificate" }], 19),
]);
export const usePartners = () => useStore(partnersStore);

const logPartner = (id: string, title: string) =>
  partnersStore.set((prev) => prev.map((p) => (p.id === id ? { ...p, activity: [{ at: new Date().toISOString(), title, by: CURRENT_USER }, ...p.activity] } : p)));
export function setPartnerStatus(id: string, status: PartnerStatus, reason?: string) {
  partnersStore.set((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  logPartner(id, `${status === "Verified" ? "Verified" : status === "Rejected" ? "Rejected" : status === "Suspended" ? "Suspended" : "Reactivated"}${reason ? `: ${reason}` : ""}`);
}
export function addPartner(p: Pick<Partner, "name" | "type" | "email" | "phone" | "state">): Partner {
  const created: Partner = { ...p, id: `p-new-${Date.now()}`, status: "Pending", bank: "", accountLast4: "", documents: [], referred: [], deliveries: 0, joinedAt: daysFromToday(0), activity: [{ at: new Date().toISOString(), title: "Added by staff", by: CURRENT_USER }] };
  partnersStore.set((prev) => [created, ...prev]);
  return created;
}

export type CommissionUnit = "percent" | "per_delivery" | "per_customer";
export type CommissionPlan = { id: string; name: string; partnerType: PartnerType; unit: CommissionUnit; value: number; updatedAt: string; updatedBy: string };
export const UNIT_LABEL: Record<CommissionUnit, string> = { percent: "% of each payment from referred customers", per_delivery: "₦ per completed delivery", per_customer: "₦ once per new paying customer" };

export const plansStore = createStore<CommissionPlan[]>([
  // Legacy stored 0.3 and 0.1 with no unit; the prototype makes the unit explicit and treats them as percent.
  { id: "c-bp", name: "Business Partner Commission", partnerType: "Business partner", unit: "percent", value: 0.3, updatedAt: daysFromToday(-2141), updatedBy: "Isaac Adegunle" },
  { id: "c-dp", name: "Delivery Partner Commission", partnerType: "Delivery partner", unit: "per_delivery", value: 10000, updatedAt: daysFromToday(-2150), updatedBy: "Isaac Adegunle" },
  { id: "c-ice", name: "ICE Commission Plan", partnerType: "ICE", unit: "percent", value: 0.1, updatedAt: daysFromToday(-2150), updatedBy: "Isaac Adegunle" },
]);
export const useCommissionPlans = () => useStore(plansStore);
export function updateCommissionPlan(id: string, patch: Partial<CommissionPlan>) {
  plansStore.set((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: daysFromToday(0), updatedBy: CURRENT_USER } : p)));
}

export function describeCommission(plan: Pick<CommissionPlan, "unit" | "value">) {
  if (plan.unit === "percent") return `${plan.value}% of each payment from referred customers`;
  if (plan.unit === "per_delivery") return `₦${plan.value.toLocaleString()} per completed delivery`;
  return `₦${plan.value.toLocaleString()} once for each new paying customer`;
}

export function commissionExample(plan: Pick<CommissionPlan, "unit" | "value">) {
  if (plan.unit === "percent") return `A referred customer pays ₦8,000 → partner earns ₦${(8000 * plan.value / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (plan.unit === "per_delivery") return `10 deliveries this month → partner earns ₦${(plan.value * 10).toLocaleString()}`;
  return `3 new paying customers → partner earns ₦${(plan.value * 3).toLocaleString()}`;
}

/** Earnings in the last 30 days, from real payment records of the customers a partner referred. */
export function partnerEarnings(p: Partner, plans: CommissionPlan[]) {
  const plan = plans.find((x) => x.partnerType === p.type);
  const byCicod = new Set(p.referred);
  const paid = paymentsStore.get().filter((x) => byCicod.has(x.cicod) && paymentStatus(x) === "Paid" && -daysUntil(lastAttemptAt(x).slice(0, 10)) <= 30);
  const paidTotal = paid.reduce((t, x) => t + x.amount, 0);
  const customers = customersStore.get().filter((c) => byCicod.has(c.cicod));
  const monthly = customers.reduce((t, c) => t + monthlyValue(c), 0);
  let earned = 0;
  if (plan?.unit === "percent") earned = (paidTotal * plan.value) / 100;
  if (plan?.unit === "per_delivery") earned = plan.value * p.deliveries;
  if (plan?.unit === "per_customer") earned = plan.value * paid.length;
  return { plan, paid, paidTotal, customers, monthly, earned: Math.round(earned * 100) / 100 };
}

/* ================= Campaigns ================= */

export type AudienceRef = { kind: "segment"; id: string } | { kind: "partners"; type: PartnerType | "All" } | { kind: "leads"; stage: StageId | "open" };
export type CampaignStatus = "Draft" | "Scheduled" | "Running" | "Completed" | "Cancelled";

export type Campaign = {
  id: string;
  name: string;
  goal: string;
  audience: AudienceRef | null;
  channel: "email" | "sms";
  templateId: string | null;
  startAt: string | null;
  endAt: string | null;
  draft: boolean;
  cancelled: boolean;
  results?: { recipients: number; delivered: number; opened: number; clicked: number; leads: number; won: number };
  createdBy: string;
  createdAt: string;
};

export const GOALS = ["Upgrade existing customers", "Convert trials", "Win back overdue customers", "Recruit partners", "Announce a feature"];

export const campaignsStore = createStore<Campaign[]>([
  { id: "cmp-1", name: "Onboard CICOD Lyte Customers to CICOD Merchant", goal: "Upgrade existing customers", audience: { kind: "segment", id: "all" }, channel: "email", templateId: "em-upgrade", startAt: "2021-12-31", endAt: "2022-12-30", draft: false, cancelled: false, results: { recipients: 1055, delivered: 1012, opened: 388, clicked: 94, leads: 41, won: 12 }, createdBy: "Isaac Adegunle", createdAt: "2022-01-04" },
  { id: "cmp-2", name: "Trial ending: keep your plan", goal: "Convert trials", audience: { kind: "segment", id: "trial_ending" }, channel: "sms", templateId: "sms-trial", startAt: daysFromToday(-6), endAt: daysFromToday(8), draft: false, cancelled: false, results: { recipients: 1, delivered: 1, opened: 0, clicked: 0, leads: 0, won: 0 }, createdBy: CURRENT_USER, createdAt: daysFromToday(-8) },
  { id: "cmp-3", name: "Recruit ICEs in the North", goal: "Recruit partners", audience: { kind: "partners", type: "ICE" }, channel: "email", templateId: "em-welcome", startAt: daysFromToday(5), endAt: daysFromToday(35), draft: false, cancelled: false, createdBy: "Tolu Animashaun", createdAt: daysFromToday(-2) },
  { id: "cmp-4", name: "Win back overdue merchants", goal: "Win back overdue customers", audience: { kind: "segment", id: "overdue" }, channel: "email", templateId: null, startAt: null, endAt: null, draft: true, cancelled: false, createdBy: CURRENT_USER, createdAt: daysFromToday(-1) },
]);
export const useCampaigns = () => useStore(campaignsStore);
export function upsertCampaign(c: Campaign) {
  campaignsStore.set((prev) => (prev.some((x) => x.id === c.id) ? prev.map((x) => (x.id === c.id ? c : x)) : [c, ...prev]));
}

/** Status always follows the dates, so a finished campaign can never show as Active. */
export function campaignStatus(c: Campaign): CampaignStatus {
  if (c.cancelled) return "Cancelled";
  if (c.draft || !c.startAt) return "Draft";
  if (daysUntil(c.startAt) > 0) return "Scheduled";
  if (c.endAt && daysUntil(c.endAt) < 0) return "Completed";
  return "Running";
}

export function audienceLabel(a: AudienceRef | null): string {
  if (!a) return "No audience yet";
  if (a.kind === "segment") return `Customers · ${SEGMENTS.find((s) => s.id === a.id)?.label ?? a.id}`;
  if (a.kind === "partners") return `Partners · ${a.type === "All" ? "all types" : a.type}`;
  return `Leads · ${a.stage === "open" ? "all open" : stageLabel(a.stage)}`;
}

export type Recipient = { name: string; contact: string; email: string; phone: string; customer?: Customer };

/** Resolve an audience to the people it reaches today, from the live stores. */
export function resolveAudience(a: AudienceRef | null, leads: Lead[], partners: Partner[], customers: Customer[]): Recipient[] {
  if (!a) return [];
  if (a.kind === "segment") {
    const seg = SEGMENTS.find((s) => s.id === a.id) ?? SEGMENTS[0];
    return customers.filter((c) => seg.test(c) && (a.id === "suspended" || getHealth(c).id !== "suspended")).map((c) => ({ name: c.company, contact: c.contacts[0]?.name ?? "", email: c.contacts[0]?.email ?? c.email, phone: c.phone, customer: c }));
  }
  if (a.kind === "partners") return partners.filter((p) => p.status === "Verified" && (a.type === "All" || p.type === a.type)).map((p) => ({ name: p.name, contact: p.name, email: p.email, phone: p.phone }));
  return leads.filter((l) => (a.stage === "open" ? isOpenStage(l.stage) : l.stage === a.stage)).map((l) => ({ name: l.company, contact: l.contact, email: l.email, phone: l.phone }));
}
