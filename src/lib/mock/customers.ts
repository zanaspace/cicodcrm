"use client";

import { createStore, useStore } from "@/lib/store";
import { CURRENT_USER, daysFromToday, daysUntil } from "@/lib/format";
import {
  INITIAL_BUNDLES, INITIAL_PLANS, groupByKey, productByCode,
  type Bundle, type Currency, type Period, type Plan,
} from "@/lib/mock/catalogue";

export type CustomerStatus = "Active" | "Suspended";

export const LIFECYCLE_STAGES = [
  { id: "contact_added", label: "Contact details added" },
  { id: "setup_approved", label: "Setup approved" },
  { id: "setup_completed", label: "Setup completed" },
  { id: "provisioned", label: "Provisioned" },
] as const;
export type Lifecycle = (typeof LIFECYCLE_STAGES)[number]["id"];
export const lifecycleLabel = (id: Lifecycle) => LIFECYCLE_STAGES.find((s) => s.id === id)!.label;

export type Contact = { name: string; email: string; phone: string; role: "Admin" | "Technical" | "Billing" };

export type ActivityItem = {
  id: string;
  at: string;
  kind: "note" | "status" | "lifecycle" | "payment" | "ticket" | "invoice" | "created";
  title: string;
  body?: string;
  by: string;
};

export type Subscription = {
  kind: "bundle" | "plan";
  code: string;
  period: Period;
  currency: Currency;
  users: number;
  startedAt: string;
  renewsAt: string;
  trialEndsAt: string | null;
  lastPaymentAt: string | null;
  addOns: { name: string; amount: number; frequency: Period }[];
};

export type Customer = {
  cicod: string;
  company: string;
  domain: string;
  status: CustomerStatus;
  sector: string;
  businessType: string;
  email: string;
  phone: string;
  country: string;
  state: string;
  address: string;
  lifecycle: Lifecycle;
  createdAt: string;
  contacts: Contact[];
  subscription: Subscription;
  openTickets: number;
  activity: ActivityItem[];
};

export const SECTORS: Record<string, string[]> = {
  Agriculture: ["Aggregator", "Farming Input Supplier", "Agro-processing"],
  Aviation: ["Aircraft Parts Sales", "Ground Handling"],
  "Beauty and Personal Care": ["Hair Salon/Barber Shop", "Cosmetics Retail", "Spa"],
  "Ecommerce/Hospitality/Entertainment": ["Food and Beverages", "Hotel", "Events"],
  FMCG: ["Food and Beverage", "Household Goods", "Distribution"],
  Manufacturing: ["Food Production", "Plastics", "Textiles"],
  "Professional Services": ["Design", "Consulting", "Legal"],
  Retail: ["Department store", "Pharmacy", "Electronics"],
  "Information Technology": ["Software", "IT Consulting"],
  Logistics: ["Courier", "Haulage"],
  Others: ["Drinks", "General"],
};

export const COUNTRIES: Record<string, string[]> = {
  Nigeria: ["Abuja (FCT)", "Lagos", "Ogun", "Oyo", "Rivers", "Kano", "Enugu", "Delta", "Kaduna", "Anambra"],
  Ghana: ["Greater Accra", "Ashanti", "Western"],
  Kenya: ["Nairobi", "Mombasa"],
  "United Kingdom": ["England", "Scotland", "Wales"],
};

type Seed = {
  cicod: string; company: string; domain: string; contact: string; email: string; phone: string;
  sector: string; businessType: string; state: string; area: string;
  sub: ["bundle" | "plan", string]; users?: number; period?: Period;
  created: number; lifecycle: Lifecycle;
  renews: number; trialEnds?: number | null; paid?: number | null;
  status?: CustomerStatus; tickets?: number;
};

const SEEDS: Seed[] = [
  { cicod: "23493", company: "Obiora", domain: "obiora", contact: "Obiora Lebechukwu", email: "obiora.lebechukwu@cicod.com", phone: "+2349078520406", sector: "Aviation", businessType: "Aircraft Parts Sales", state: "Lagos", area: "127 Crown Street, Abernethy", sub: ["bundle", "CICODSUPPLYCHAIN001"], created: -16, lifecycle: "contact_added", renews: 14, trialEnds: 14, paid: null },
  { cicod: "23492", company: "prince", domain: "princetest", contact: "Prince Ekpenyong", email: "prince.ekpenyong@cicod.com", phone: "+2348031234567", sector: "Agriculture", businessType: "Aggregator", state: "Abuja (FCT)", area: "Plot 12, Wuse II", sub: ["bundle", "CICODSUPPLYCHAIN001"], created: -26, lifecycle: "contact_added", renews: 4, trialEnds: 4, paid: null },
  { cicod: "23491", company: "Superstore", domain: "superstore", contact: "Eyitayo Abidogun", email: "eyitayo@superstore.ng", phone: "+2348099887766", sector: "Ecommerce/Hospitality/Entertainment", businessType: "Food and Beverages", state: "Lagos", area: "14 Admiralty Way, Lekki", sub: ["plan", "COM009"], users: 4, created: -57, lifecycle: "setup_completed", renews: -12, paid: -42, tickets: 2 },
  { cicod: "23490", company: "Drinkables", domain: "drinkables", contact: "Tayo Abidogun", email: "tayo@drinkables.ng", phone: "+2348022223333", sector: "Others", businessType: "Drinks", state: "Ogun", area: "3 Abeokuta Road, Sango", sub: ["plan", "COM009"], users: 2, created: -57, lifecycle: "setup_approved", renews: 9, paid: -21 },
  { cicod: "23489", company: "Omoyeme", domain: "omoyeme", contact: "Mercy Osoria", email: "mercy.osoria@cicod.com", phone: "+2348055554444", sector: "FMCG", businessType: "Food and Beverage", state: "Delta", area: "22 Nnebisi Road, Asaba", sub: ["bundle", "CICODSUPPLYCHAIN002"], users: 12, created: -68, lifecycle: "contact_added", renews: 22, paid: -8 },
  { cicod: "23488", company: "crmdemo", domain: "crmdemo", contact: "Adeola Adesina", email: "adeola.adesina@crowninteractive.com", phone: "+2348084673103", sector: "Beauty and Personal Care", businessType: "Hair Salon/Barber Shop", state: "Lagos", area: "", sub: ["bundle", "CICODSUPPLYCHAIN001"], created: -71, lifecycle: "provisioned", renews: -41, paid: null },
  { cicod: "23487", company: "SJ enterprise", domain: "sje", contact: "Sola James", email: "solajames@sjenterprise.ng", phone: "+2348123456789", sector: "Retail", businessType: "Department store", state: "Oyo", area: "Ring Road, Ibadan", sub: ["bundle", "CICODECOM002"], users: 6, created: -71, lifecycle: "contact_added", renews: 3, paid: -27 },
  { cicod: "23486", company: "Gracemid Agro", domain: "hanort", contact: "Mide Ayobami", email: "mide@gracemidagro.com", phone: "+2347012345678", sector: "Agriculture", businessType: "Farming Input Supplier", state: "Kaduna", area: "Kachia Road", sub: ["plan", "COM010"], users: 3, created: -71, lifecycle: "setup_completed", renews: 18, paid: -12 },
  { cicod: "23485", company: "Desto", domain: "desto", contact: "Destiny Hope", email: "destiny.hope@cicod.com", phone: "+2348076543210", sector: "Professional Services", businessType: "Design", state: "Rivers", area: "Trans Amadi, Port Harcourt", sub: ["plan", "COM009"], created: -79, lifecycle: "setup_approved", renews: -6, paid: -36, tickets: 1 },
  { cicod: "23484", company: "Spar", domain: "spar", contact: "Blessing Orewa", email: "blessing.orewa@cicod.com", phone: "+2348011112222", sector: "FMCG", businessType: "Food and Beverage", state: "Lagos", area: "Adeniran Ogunsanya, Surulere", sub: ["bundle", "CICODSUPPLYCHAIN002"], users: 40, created: -82, lifecycle: "provisioned", renews: 25, paid: -5 },
  { cicod: "23483", company: "Crown Foods", domain: "crownfoods", contact: "Olufisayo Odukoya", email: "fisayo@crownfoods.ng", phone: "+2348098765432", sector: "Manufacturing", businessType: "Food Production", state: "Ogun", area: "Agbara Industrial Estate", sub: ["bundle", "CICODSUPPLYCHAIN002"], users: 18, period: "ANNUALLY", created: -83, lifecycle: "provisioned", renews: 282, paid: -83 },
  { cicod: "23482", company: "Kola Pharmacy", domain: "kolapharm", contact: "Kola Adebayo", email: "kola@kolapharm.ng", phone: "+2348033445566", sector: "Retail", businessType: "Pharmacy", state: "Lagos", area: "Allen Avenue, Ikeja", sub: ["bundle", "CICODECOM001"], users: 3, created: -95, lifecycle: "provisioned", renews: 5, paid: -25 },
  { cicod: "23481", company: "Eko Logistics", domain: "ekologistics", contact: "Chinedu Okafor", email: "chinedu@ekologistics.ng", phone: "+2348066778899", sector: "Logistics", businessType: "Courier", state: "Lagos", area: "Oregun Road, Ikeja", sub: ["plan", "WFM008"], users: 15, created: -110, lifecycle: "provisioned", renews: -3, paid: -33 },
  { cicod: "23480", company: "Bloom Spa", domain: "bloomspa", contact: "Ifeoma Nwosu", email: "ifeoma@bloomspa.ng", phone: "+2348091122334", sector: "Beauty and Personal Care", businessType: "Spa", state: "Enugu", area: "Independence Layout", sub: ["bundle", "CICODECOM001"], created: -112, lifecycle: "provisioned", renews: 17, paid: -13 },
  { cicod: "23479", company: "Northgate Mills", domain: "northgate", contact: "Aminu Bello", email: "aminu@northgatemills.com", phone: "+2348035556677", sector: "Manufacturing", businessType: "Food Production", state: "Kano", area: "Sharada Industrial Area", sub: ["bundle", "CICODSUPPLYCHAIN002"], users: 60, period: "ANNUALLY", created: -130, lifecycle: "provisioned", renews: 235, paid: -130 },
  { cicod: "23478", company: "Tech Hub Ventures", domain: "techhub", contact: "Bisi Fashola", email: "bisi@techhub.ng", phone: "+2348027788990", sector: "Information Technology", businessType: "Software", state: "Lagos", area: "Yaba", sub: ["plan", "UCG008"], users: 5, created: -140, lifecycle: "provisioned", renews: 11, paid: -19, status: "Suspended", tickets: 1 },
  { cicod: "23477", company: "Mama Put Kitchens", domain: "mamaput", contact: "Grace Etim", email: "grace@mamaput.ng", phone: "+2348123344556", sector: "Ecommerce/Hospitality/Entertainment", businessType: "Food and Beverages", state: "Lagos", area: "Ikoyi", sub: ["bundle", "NIP001"], created: -150, lifecycle: "provisioned", renews: 20, paid: -10 },
  { cicod: "23476", company: "Delta Agro Co-op", domain: "deltaagro", contact: "Efe Okoro", email: "efe@deltaagro.org", phone: "+2348039988776", sector: "Agriculture", businessType: "Agro-processing", state: "Delta", area: "Warri", sub: ["bundle", "NIP001"], users: 2, created: -160, lifecycle: "provisioned", renews: -19, paid: -49, tickets: 3 },
  { cicod: "23475", company: "Lekki Electronics", domain: "lekkielectro", contact: "Tunde Bakare", email: "tunde@lekkielectro.ng", phone: "+2348051239876", sector: "Retail", businessType: "Electronics", state: "Lagos", area: "Ajah", sub: ["bundle", "CICODECOM002"], users: 8, created: -170, lifecycle: "provisioned", renews: 8, paid: -22 },
  { cicod: "23474", company: "Abuja Legal Partners", domain: "alp", contact: "Hauwa Musa", email: "hauwa@alp.ng", phone: "+2348067891234", sector: "Professional Services", businessType: "Legal", state: "Abuja (FCT)", area: "Maitama", sub: ["plan", "WFM009"], users: 20, created: -180, lifecycle: "provisioned", renews: 29, paid: -1 },
  { cicod: "23473", company: "Harvest Retail", domain: "harvestretail", contact: "Segun Ajayi", email: "segun@harvestretail.ng", phone: "+2348074455667", sector: "Retail", businessType: "Department store", state: "Oyo", area: "Bodija, Ibadan", sub: ["bundle", "CICODECOM001"], users: 4, created: -9, lifecycle: "setup_approved", renews: 21, trialEnds: 21, paid: null },
  { cicod: "23472", company: "Palmline Distribution", domain: "palmline", contact: "Uche Eze", email: "uche@palmline.ng", phone: "+2348082233445", sector: "FMCG", businessType: "Distribution", state: "Anambra", area: "Onitsha", sub: ["bundle", "CICODSUPPLYCHAIN001"], users: 7, created: -200, lifecycle: "provisioned", renews: 2, paid: -28 },
  { cicod: "23471", company: "Bright Events", domain: "brightevents", contact: "Funke Ade", email: "funke@brightevents.ng", phone: "+2348091239087", sector: "Ecommerce/Hospitality/Entertainment", businessType: "Events", state: "Lagos", area: "Victoria Island", sub: ["plan", "COM008"], created: -220, lifecycle: "provisioned", renews: -2, paid: -32, status: "Suspended" },
  { cicod: "23470", company: "Sahel Haulage", domain: "sahelhaulage", contact: "Ibrahim Sani", email: "ibrahim@sahelhaulage.com", phone: "+2348063344221", sector: "Logistics", businessType: "Haulage", state: "Kano", area: "Bompai", sub: ["plan", "WFM008"], users: 9, created: -4, lifecycle: "contact_added", renews: 26, trialEnds: 26, paid: null },
  { cicod: "23469", company: "Greenfield Textiles", domain: "greenfield", contact: "Ngozi Obi", email: "ngozi@greenfieldtex.com", phone: "+2348045566778", sector: "Manufacturing", businessType: "Textiles", state: "Kaduna", area: "Kakuri", sub: ["bundle", "CICODSUPPLYCHAIN002"], users: 25, created: -240, lifecycle: "provisioned", renews: 13, paid: -17, tickets: 1 },
  { cicod: "23468", company: "Cloudnine Consulting", domain: "cloudnine", contact: "Oluwatoyin Adewale", email: "toyin@cloudnine.ng", phone: "+2348025566443", sector: "Information Technology", businessType: "IT Consulting", state: "Lagos", area: "Ikeja GRA", sub: ["plan", "UCG001"], users: 3, created: -250, lifecycle: "provisioned", renews: 6, paid: -24 },
];

function seedToCustomer(s: Seed): Customer {
  const created = daysFromToday(s.created);
  const activity: ActivityItem[] = [
    { id: `${s.cicod}-a1`, at: created, kind: "created", title: "Account created", body: `Signed up for ${subscriptionLabel({ kind: s.sub[0], code: s.sub[1] }).name}.`, by: "Self-service" },
  ];
  const stageIdx = LIFECYCLE_STAGES.findIndex((x) => x.id === s.lifecycle);
  LIFECYCLE_STAGES.slice(1, stageIdx + 1).forEach((stage, i) =>
    activity.push({ id: `${s.cicod}-l${i}`, at: daysFromToday(s.created + 1 + i), kind: "lifecycle", title: `Moved to "${stage.label}"`, by: "System" }),
  );
  if (s.paid != null) activity.push({ id: `${s.cicod}-p`, at: daysFromToday(s.paid), kind: "payment", title: "Payment received", body: "Subscription renewal paid by card.", by: "Paystack" });
  if (s.status === "Suspended") activity.push({ id: `${s.cicod}-s`, at: daysFromToday(-1), kind: "status", title: "Customer suspended", body: "Reason: Non-payment. Grace period ended.", by: "Isaac Adegunle" });
  if (s.tickets) activity.push({ id: `${s.cicod}-t`, at: daysFromToday(-3), kind: "ticket", title: "Ticket opened: Unable to process payment", by: s.contact });

  return {
    cicod: s.cicod, company: s.company, domain: s.domain, status: s.status ?? "Active",
    sector: s.sector, businessType: s.businessType, email: s.email, phone: s.phone,
    country: "Nigeria", state: s.state, address: s.area,
    lifecycle: s.lifecycle, createdAt: created,
    contacts: [{ name: s.contact, email: s.email, phone: s.phone, role: "Admin" }],
    subscription: {
      kind: s.sub[0], code: s.sub[1], period: s.period ?? "MONTHLY", currency: "NGN", users: s.users ?? 1,
      startedAt: created, renewsAt: daysFromToday(s.renews),
      trialEndsAt: s.trialEnds != null ? daysFromToday(s.trialEnds) : null,
      lastPaymentAt: s.paid != null ? daysFromToday(s.paid) : null,
      addOns: s.users && s.users > 10 ? [{ name: "Extra storage (500 GB)", amount: 2500, frequency: "MONTHLY" }] : [],
    },
    openTickets: s.tickets ?? 0,
    activity: activity.sort((a, b) => b.at.localeCompare(a.at)),
  };
}

export const customersStore = createStore<Customer[]>(SEEDS.map(seedToCustomer));
export const useCustomers = () => useStore(customersStore);

export function updateCustomer(cicod: string, patch: Partial<Customer>) {
  customersStore.set((prev) => prev.map((c) => (c.cicod === cicod ? { ...c, ...patch } : c)));
}

export function logActivity(cicod: string, item: Omit<ActivityItem, "id" | "at" | "by"> & { by?: string }) {
  customersStore.set((prev) =>
    prev.map((c) =>
      c.cicod === cicod
        ? { ...c, activity: [{ id: `${cicod}-${Date.now()}`, at: new Date().toISOString(), by: CURRENT_USER, ...item }, ...c.activity] }
        : c,
    ),
  );
}

export function addCustomer(c: Omit<Customer, "cicod" | "activity" | "openTickets">): Customer {
  const next = String(Math.max(...customersStore.get().map((x) => Number(x.cicod))) + 1);
  const customer: Customer = {
    ...c,
    cicod: next,
    openTickets: 0,
    activity: [{ id: `${next}-a1`, at: new Date().toISOString(), kind: "created", title: "Account created", body: `Created from the CRM and subscribed to ${subscriptionLabel(c.subscription).name}.`, by: CURRENT_USER }],
  };
  customersStore.set((prev) => [customer, ...prev]);
  return customer;
}

/* ---------------- Derived values ---------------- */

/** Resolve what the customer is on, in catalogue terms: "CICOD Supply Chain · Standard". */
export function subscriptionLabel(sub: Pick<Subscription, "kind" | "code">, bundles: Bundle[] = INITIAL_BUNDLES, plans: Plan[] = INITIAL_PLANS) {
  if (sub.kind === "bundle") {
    const b = bundles.find((x) => x.code === sub.code);
    return { group: groupByKey(b?.groupKey ?? "")?.name ?? "Bundle", name: b?.name ?? sub.code, item: b };
  }
  const p = plans.find((x) => x.code === sub.code);
  return { group: productByCode(p?.productCode ?? "")?.name ?? "Product", name: p?.name ?? sub.code, item: p };
}

export function monthlyValue(c: Customer, bundles: Bundle[] = INITIAL_BUNDLES, plans: Plan[] = INITIAL_PLANS): number {
  const { item } = subscriptionLabel(c.subscription, bundles, plans);
  if (!item) return 0;
  const p = item.prices.find((x) => x.currency === c.subscription.currency && x.period === c.subscription.period) ?? item.prices[0];
  if (!p) return 0;
  const perMonth = p.period === "ANNUALLY" ? p.amount / 12 : p.amount;
  const seats = item.billingModel === "PER_USER" ? c.subscription.users : 1;
  const addOns = c.subscription.addOns.reduce((s, a) => s + (a.frequency === "ANNUALLY" ? a.amount / 12 : a.amount), 0);
  return Math.round(perMonth * seats + addOns);
}

export type Health =
  | { id: "suspended"; label: "Suspended" }
  | { id: "overdue"; label: string; days: number }
  | { id: "trial_ending"; label: string; days: number }
  | { id: "trial"; label: string; days: number }
  | { id: "due_soon"; label: string; days: number }
  | { id: "healthy"; label: "Healthy" };

export function getHealth(c: Customer): Health {
  if (c.status === "Suspended") return { id: "suspended", label: "Suspended" };
  const { trialEndsAt, renewsAt } = c.subscription;
  if (trialEndsAt && daysUntil(trialEndsAt) >= 0) {
    const days = daysUntil(trialEndsAt);
    return days <= 7 ? { id: "trial_ending", label: `Trial ends in ${days}d`, days } : { id: "trial", label: `Trial · ${days}d left`, days };
  }
  const due = daysUntil(renewsAt);
  if (due < 0) return { id: "overdue", label: `Overdue ${-due}d`, days: -due };
  if (due <= 7) return { id: "due_soon", label: `Due in ${due}d`, days: due };
  return { id: "healthy", label: "Healthy" };
}

export const SEGMENTS = [
  { id: "all", label: "All customers", test: () => true },
  { id: "trial_ending", label: "Trials ending", test: (c: Customer) => getHealth(c).id === "trial_ending" },
  { id: "overdue", label: "Renewal overdue", test: (c: Customer) => getHealth(c).id === "overdue" },
  { id: "due_soon", label: "Due this week", test: (c: Customer) => getHealth(c).id === "due_soon" },
  { id: "onboarding", label: "Onboarding stuck", test: (c: Customer) => c.status === "Active" && c.lifecycle !== "provisioned" && daysUntil(c.createdAt) <= -14 },
  { id: "suspended", label: "Suspended", test: (c: Customer) => c.status === "Suspended" },
] as const;
export type SegmentId = (typeof SEGMENTS)[number]["id"];
