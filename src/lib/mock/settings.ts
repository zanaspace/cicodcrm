"use client";

import { createStore, useStore } from "@/lib/store";
import { CURRENT_USER, daysFromToday, newId } from "@/lib/format";
import { COUNTRIES as SEED_COUNTRIES, SECTORS as SEED_SECTORS, customersStore, type Customer } from "@/lib/mock/customers";
import { bundlesStore, plansStore } from "@/lib/mock/catalogue";
import { paymentsStore, type PaymentMethod } from "@/lib/mock/billing";
import type { TemplateCategory } from "@/lib/mock/messaging";

const isoAgo = (days: number, h = 10, m = 0) => { const d = new Date(daysFromToday(-days)); d.setHours(h, m, 0, 0); return d.toISOString(); };
/** Names compared without case, spaces or punctuation ("Broadcast Media (TV, Radio)" = "broadcast media tv radio"). */
export const sameName = (a: string, b: string) => a.toLowerCase().replace(/[^a-z0-9]/g, "") === b.toLowerCase().replace(/[^a-z0-9]/g, "");

/* ================= Audit log ================= */

export type AuditArea = "Users" | "Roles" | "Profile" | "Reference data" | "API keys" | "Notifications";
export type AuditEntry = { id: string; at: string; actor: string; area: AuditArea; action: string; target: string; detail?: string };

const AUDIT_SEED: Omit<AuditEntry, "id">[] = [
  { at: isoAgo(0, 9, 12), actor: "Isaac Adegunle", area: "Reference data", action: "Added business type", target: "Food Production", detail: "Sector: Manufacturing" },
  { at: isoAgo(1, 16, 40), actor: CURRENT_USER, area: "Users", action: "Changed role", target: "Ope Sangobowale", detail: "Sales → Customer Success" },
  { at: isoAgo(2, 11, 5), actor: CURRENT_USER, area: "API keys", action: "Generated key", target: "crmdemo (#23488)", detail: "Label: Storefront sync · ends 7Q2M" },
  { at: isoAgo(5, 14, 30), actor: CURRENT_USER, area: "Users", action: "Deactivated user", target: "Kemi Balogun", detail: "Reason: Left the company" },
  { at: isoAgo(9, 10, 0), actor: "Femi Adebayo", area: "Notifications", action: "Turned off", target: "Partner verified", detail: "No partner template yet" },
  { at: isoAgo(12, 15, 22), actor: CURRENT_USER, area: "Users", action: "Invited user", target: "Zainab Musa", detail: "Role: Finance" },
  { at: isoAgo(20, 9, 45), actor: CURRENT_USER, area: "Roles", action: "Edited role", target: "Sales", detail: "Billing: No access → View" },
  { at: isoAgo(33, 13, 10), actor: "Femi Adebayo", area: "API keys", action: "Revoked key", target: "Superstore (#23491)", detail: "Reason: Key shared in a support chat" },
];
export const auditStore = createStore<AuditEntry[]>(AUDIT_SEED.map((a, i) => ({ ...a, id: `au-${i}` })));
export const useAudit = () => useStore(auditStore);
export function audit(area: AuditArea, action: string, target: string, detail?: string) {
  auditStore.set((prev) => [{ id: newId("au"), at: new Date().toISOString(), actor: CURRENT_USER, area, action, target, detail }, ...prev]);
}

/* ================= Roles and permissions ================= */

export const MODULES = [
  { id: "customers", label: "Customers", full: "Suspend and reactivate customers" },
  { id: "catalogue", label: "Catalogue", full: "Publish, unpublish and archive plans and bundles" },
  { id: "billing", label: "Billing & Payments", full: "Record payments, suspend for non-payment, publish dunning policies" },
  { id: "pipeline", label: "Pipeline", full: "Convert leads, manage pipeline stages" },
  { id: "marketing", label: "Marketing & Messaging", full: "Launch campaigns, edit shared templates" },
  { id: "partners", label: "Partners", full: "Verify, reject and suspend partners; change commission" },
  { id: "settings", label: "Settings", full: "Users, roles, reference data, API keys" },
] as const;
export type ModuleId = (typeof MODULES)[number]["id"];
export type Access = "none" | "view" | "edit" | "full";
export const ACCESS_LEVELS: { id: Access; label: string; hint: string }[] = [
  { id: "none", label: "No access", hint: "Hidden from the menu" },
  { id: "view", label: "View", hint: "See records, change nothing" },
  { id: "edit", label: "Edit", hint: "Create and edit records" },
  { id: "full", label: "Full", hint: "Edit, plus the risky actions" },
];
export type Role = { id: string; name: string; description: string; builtIn: boolean; locked?: boolean; access: Record<ModuleId, Access> };

const acc = (c: Access, cat: Access, b: Access, p: Access, m: Access, pa: Access, s: Access): Record<ModuleId, Access> =>
  ({ customers: c, catalogue: cat, billing: b, pipeline: p, marketing: m, partners: pa, settings: s });
const ROLE_SEED: Role[] = [
  { id: "admin", name: "Admin", description: "Everything, including users and API keys", builtIn: true, locked: true, access: acc("full", "full", "full", "full", "full", "full", "full") },
  { id: "sales", name: "Sales", description: "Works leads and partners; sees customers and prices", builtIn: true, access: acc("edit", "view", "view", "full", "edit", "edit", "none") },
  { id: "success", name: "Customer Success", description: "Onboards and supports customers", builtIn: true, access: acc("full", "view", "view", "view", "view", "view", "none") },
  { id: "finance", name: "Finance", description: "Payments, collections, dunning and commission", builtIn: true, access: acc("view", "view", "full", "none", "none", "full", "none") },
  { id: "developer", name: "Developer", description: "Merchant API keys and catalogue set-up", builtIn: true, access: acc("view", "edit", "view", "none", "none", "none", "edit") },
  { id: "readonly", name: "Read-only", description: "Sees everything, changes nothing", builtIn: true, access: acc("view", "view", "view", "view", "view", "view", "view") },
];
export const rolesStore = createStore<Role[]>(ROLE_SEED);
export const useRoles = () => useStore(rolesStore);
export const roleName = (id: string) => rolesStore.get().find((r) => r.id === id)?.name ?? id;
const levelLabel = (a: Access) => ACCESS_LEVELS.find((l) => l.id === a)!.label;

/** Differences between two access maps, e.g. ["Billing & Payments: View → Full"]. */
export function accessChanges(from: Record<ModuleId, Access>, to: Record<ModuleId, Access>) {
  return MODULES.filter((m) => from[m.id] !== to[m.id]).map((m) => `${m.label}: ${levelLabel(from[m.id])} → ${levelLabel(to[m.id])}`);
}
export function saveRole(role: Role) {
  const before = rolesStore.get().find((r) => r.id === role.id);
  rolesStore.set((prev) => (before ? prev.map((r) => (r.id === role.id ? role : r)) : [...prev, role]));
  if (!before) audit("Roles", "Created role", role.name, accessChanges(acc("none", "none", "none", "none", "none", "none", "none"), role.access).join("; ") || "No access anywhere");
  else audit("Roles", "Edited role", role.name, [before.name !== role.name ? `Renamed from ${before.name}` : "", ...accessChanges(before.access, role.access)].filter(Boolean).join("; "));
}
export function deleteRole(id: string) {
  const r = rolesStore.get().find((x) => x.id === id);
  rolesStore.set((prev) => prev.filter((x) => x.id !== id));
  if (r) audit("Roles", "Deleted role", r.name);
}

/* ================= Users ================= */

export type UserStatus = "Active" | "Invited" | "Deactivated";
export type User = {
  id: string; name: string; email: string; phone: string; roleId: string; status: UserStatus;
  createdAt: string; createdBy: string; lastActiveAt: string | null;
  invitedAt?: string; deactivatedAt?: string; deactivatedReason?: string;
};
export const STALE_DAYS = 90;
export const DEACTIVATE_REASONS = ["Left the company", "Changed team, no longer needs access", "Account was shared", "Security concern", "Other"];

type UserSeed = [string, string, string, UserStatus, number, number | null, string?];
// name, role, phone (local part), status, created (days ago), last active (days ago), deactivation reason
const USER_SEED: UserSeed[] = [
  [CURRENT_USER, "admin", "8024019361", "Active", 2160, 0],
  ["Isaac Adegunle", "sales", "8101767458", "Active", 2400, 0],
  ["Tolu Animashaun", "sales", "8051344205", "Active", 2190, 1],
  ["Ope Sangobowale", "success", "8024019362", "Active", 2190, 0],
  ["Femi Adebayo", "developer", "8031127744", "Active", 1340, 3],
  ["Chiamaka Obi", "finance", "8122450981", "Active", 610, 2],
  ["Ngozi Eze", "success", "8099031275", "Active", 410, 6],
  ["Bola Ajayi", "sales", "8162204519", "Active", 980, 141],
  ["Musa Ibrahim", "success", "8034470021", "Active", 730, 96],
  ["Kelechi Nnaji", "readonly", "9022318840", "Active", 300, 212],
  ["Zainab Musa", "finance", "8187703350", "Invited", 12, null],
  ["Emeka Okafor", "sales", "8066124478", "Invited", 3, null],
  ["Kemi Balogun", "admin", "8023356611", "Deactivated", 1500, 40, "Left the company"],
  ["Yusuf Bello", "admin", "8140098812", "Deactivated", 1800, 420, "Left the company"],
  ["Funmi Alade", "sales", "8095521006", "Deactivated", 1200, 300, "Left the company"],
  ["Daniel Etim", "developer", "8057781234", "Deactivated", 1010, 260, "Changed team, no longer needs access"],
  ["Shared Admin", "admin", "8000000000", "Deactivated", 2550, 900, "Account was shared"],
];
const emailOf = (name: string) => `${name.toLowerCase().replace(/[^a-z ]/g, "").trim().replace(/\s+/g, ".")}@cicod.com`;
export const usersStore = createStore<User[]>(USER_SEED.map(([name, roleId, phone, status, created, active, reason], i) => ({
  id: `u-${i + 1}`, name, email: emailOf(name), phone: `+234${phone}`, roleId, status,
  createdAt: daysFromToday(-created), createdBy: i < 4 ? "Shared Admin" : CURRENT_USER,
  lastActiveAt: active == null ? null : isoAgo(active, 9 + (i % 7), (i * 13) % 60),
  invitedAt: status === "Invited" ? daysFromToday(-created) : undefined,
  deactivatedAt: status === "Deactivated" ? daysFromToday(-Math.max(1, (active ?? 1) - 2)) : undefined,
  deactivatedReason: reason,
})));
export const useUsers = () => useStore(usersStore);
/** The signed-in user (seeded first). Looked up by id so renaming yourself keeps working. */
export const CURRENT_USER_ID = "u-1";
export const currentUser = () => usersStore.get().find((u) => u.id === CURRENT_USER_ID)!;
export const useCurrentUser = () => useStore(usersStore).find((u) => u.id === CURRENT_USER_ID)!;
const patchUser = (id: string, p: Partial<User>) => usersStore.set((prev) => prev.map((u) => (u.id === id ? { ...u, ...p } : u)));
const byId = (id: string) => usersStore.get().find((u) => u.id === id)!;

/** Why a user can't be deactivated or lose the Admin role, or null when they can. */
export function adminGuard(userId: string): string | null {
  const u = byId(userId);
  if (u.id === CURRENT_USER_ID) return "You can't remove your own access. Ask another admin.";
  const admins = usersStore.get().filter((x) => x.status === "Active" && x.roleId === "admin");
  if (u.roleId === "admin" && u.status === "Active" && admins.length <= 1) return "This is the last active admin. Make someone else an admin first.";
  return null;
}
export function inviteUser(input: { name: string; email: string; phone: string; roleId: string }): User {
  const u: User = { id: newId("u"), ...input, status: "Invited", createdAt: daysFromToday(0), createdBy: CURRENT_USER, lastActiveAt: null, invitedAt: daysFromToday(0) };
  usersStore.set((prev) => [u, ...prev]);
  audit("Users", "Invited user", u.name, `Role: ${roleName(u.roleId)}`);
  return u;
}
export function changeRole(id: string, roleId: string) {
  const u = byId(id);
  patchUser(id, { roleId });
  audit("Users", "Changed role", u.name, `${roleName(u.roleId)} → ${roleName(roleId)}`);
}
export function deactivateUser(id: string, reason: string, note?: string) {
  const u = byId(id);
  patchUser(id, { status: "Deactivated", deactivatedAt: daysFromToday(0), deactivatedReason: reason });
  audit("Users", u.status === "Invited" ? "Cancelled invite" : "Deactivated user", u.name, `Reason: ${reason}${note ? `. ${note}` : ""}`);
}
export function reactivateUser(id: string) {
  const u = byId(id);
  patchUser(id, { status: u.lastActiveAt ? "Active" : "Invited", deactivatedAt: undefined, deactivatedReason: undefined, invitedAt: u.lastActiveAt ? u.invitedAt : daysFromToday(0) });
  audit("Users", "Reactivated user", u.name, `Role: ${roleName(u.roleId)}`);
}
export function resendInvite(id: string) {
  patchUser(id, { invitedAt: daysFromToday(0) });
  audit("Users", "Resent invite", byId(id).name);
}
export function updateProfile(id: string, p: { name: string; phone: string }) {
  const u = byId(id);
  patchUser(id, p);
  const changes = [u.name !== p.name ? `Name: ${u.name} → ${p.name}` : "", u.phone !== p.phone ? "Phone number changed" : ""].filter(Boolean).join("; ");
  audit("Profile", "Updated profile", p.name, changes || undefined);
}
export function changePassword() {
  audit("Profile", "Changed password", CURRENT_USER);
}

/* ================= Reference data: sectors and business types ================= */

export type BusinessType = { id: string; name: string; active: boolean };
export type Sector = { id: string; name: string; active: boolean; types: BusinessType[] };

const SECTOR_SEED: Record<string, string[]> = {
  ...SEED_SECTORS,
  Construction: [],
  Media: ["Broadcast Media (TV, Radio)", "Publishing", "Advertising"],
  Utility: ["Water Supply"],
};
export const sectorsStore = createStore<Sector[]>(Object.entries(SECTOR_SEED).sort(([a], [b]) => a.localeCompare(b)).map(([name, types], i) => ({
  id: `sec-${i}`, name, active: true, types: types.map((t, k) => ({ id: `bt-${i}-${k}`, name: t, active: true })),
})));
export const useSectorList = () => useStore(sectorsStore);

/** Active sectors and their active business types, for every form that asks for them. */
export function useSectors(): Record<string, string[]> {
  const list = useStore(sectorsStore);
  return Object.fromEntries(list.filter((s) => s.active).map((s) => [s.name, s.types.filter((t) => t.active).map((t) => t.name)]));
}
export const customersInSector = (customers: Customer[], sector: string) => customers.filter((c) => c.sector === sector).length;
export const customersWithType = (customers: Customer[], sector: string, type: string) => customers.filter((c) => c.sector === sector && c.businessType === type).length;

const patchSector = (id: string, fn: (s: Sector) => Sector) => sectorsStore.set((prev) => prev.map((s) => (s.id === id ? fn(s) : s)));
export function addSector(name: string): Sector {
  const s: Sector = { id: newId("sec"), name: name.trim(), active: true, types: [] };
  sectorsStore.set((prev) => [...prev, s].sort((a, b) => a.name.localeCompare(b.name)));
  audit("Reference data", "Added sector", s.name);
  return s;
}
/** Renaming also updates customers that use the old name, so records stay linked. */
export function renameSector(id: string, name: string) {
  const s = sectorsStore.get().find((x) => x.id === id)!;
  patchSector(id, (x) => ({ ...x, name: name.trim() }));
  customersStore.set((prev) => prev.map((c) => (c.sector === s.name ? { ...c, sector: name.trim() } : c)));
  audit("Reference data", "Renamed sector", name.trim(), `Was ${s.name}`);
}
export function setSectorActive(id: string, active: boolean) {
  const s = sectorsStore.get().find((x) => x.id === id)!;
  patchSector(id, (x) => ({ ...x, active }));
  audit("Reference data", active ? "Turned on sector" : "Turned off sector", s.name);
}
export function addBusinessType(sectorId: string, name: string) {
  const s = sectorsStore.get().find((x) => x.id === sectorId)!;
  patchSector(sectorId, (x) => ({ ...x, types: [...x.types, { id: newId("bt"), name: name.trim(), active: true }] }));
  audit("Reference data", "Added business type", name.trim(), `Sector: ${s.name}`);
}
export function renameBusinessType(sectorId: string, typeId: string, name: string) {
  const s = sectorsStore.get().find((x) => x.id === sectorId)!;
  const t = s.types.find((x) => x.id === typeId)!;
  patchSector(sectorId, (x) => ({ ...x, types: x.types.map((y) => (y.id === typeId ? { ...y, name: name.trim() } : y)) }));
  customersStore.set((prev) => prev.map((c) => (c.sector === s.name && c.businessType === t.name ? { ...c, businessType: name.trim() } : c)));
  audit("Reference data", "Renamed business type", name.trim(), `Was ${t.name} · Sector: ${s.name}`);
}
export function setBusinessTypeActive(sectorId: string, typeId: string, active: boolean) {
  const s = sectorsStore.get().find((x) => x.id === sectorId)!;
  const t = s.types.find((x) => x.id === typeId)!;
  patchSector(sectorId, (x) => ({ ...x, types: x.types.map((y) => (y.id === typeId ? { ...y, active } : y)) }));
  audit("Reference data", active ? "Turned on business type" : "Turned off business type", t.name, `Sector: ${s.name}`);
}

/* ================= Reference data: locations ================= */

export type Region = { id: string; name: string; active: boolean; areas: string[] };
export type Country = {
  code: string; name: string; continent: string; enabled: boolean;
  regionLabel: string; areaLabel: string; expectedRegions: number; regions: Region[];
};

const NG_STATES = ["Abia", "Abuja (FCT)", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"];
const NG_AREAS: Record<string, string[]> = {
  Lagos: ["Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa", "Badagry", "Epe", "Eti-Osa", "Ibeju-Lekki", "Ifako-Ijaiye", "Ikeja", "Ikorodu", "Kosofe", "Lagos Island", "Lagos Mainland", "Mushin", "Ojo", "Oshodi-Isolo", "Shomolu", "Surulere"],
  "Abuja (FCT)": ["Abaji", "Abuja Municipal (AMAC)", "Bwari", "Gwagwalada", "Kuje", "Kwali"],
};
const GH_REGIONS = ["Ahafo", "Ashanti", "Bono", "Bono East", "Central", "Eastern", "Greater Accra", "North East", "Northern", "Oti", "Savannah", "Upper East", "Upper West", "Volta", "Western", "Western North"];
const KE_COUNTIES = ["Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu", "Garissa", "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi", "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya", "Taita-Taveta", "Tana River", "Tharaka-Nithi", "Trans-Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"];

const country = (code: string, name: string, continent: string, enabled: boolean, regionLabel: string, areaLabel: string, expectedRegions: number, regions: string[], areas: Record<string, string[]> = {}): Country => ({
  code, name, continent, enabled, regionLabel, areaLabel, expectedRegions,
  regions: regions.map((r, i) => ({ id: `${code}-${i}`, name: r, active: true, areas: areas[r] ?? [] })),
});
// Regions used by seeded customers are always present (SEED_COUNTRIES), so no record points at a missing state.
const withSeed = (name: string, list: string[]) => [...new Set([...list, ...(SEED_COUNTRIES[name] ?? [])])];
export const countriesStore = createStore<Country[]>([
  country("NG", "Nigeria", "Africa", true, "State", "LGA", 37, withSeed("Nigeria", NG_STATES), NG_AREAS),
  country("GH", "Ghana", "Africa", true, "Region", "District", 16, withSeed("Ghana", GH_REGIONS)),
  country("KE", "Kenya", "Africa", true, "County", "Sub-county", 47, withSeed("Kenya", KE_COUNTIES)),
  country("GB", "United Kingdom", "Europe", true, "Nation", "County", 4, withSeed("United Kingdom", ["England", "Northern Ireland", "Scotland", "Wales"])),
  country("ZA", "South Africa", "Africa", false, "Province", "Municipality", 9, ["Eastern Cape", "Gauteng", "KwaZulu-Natal", "Western Cape"]),
  country("CM", "Cameroon", "Africa", false, "Region", "Department", 10, ["Centre", "Littoral", "North-West", "West"]),
  country("RW", "Rwanda", "Africa", false, "Province", "District", 5, ["Eastern", "Kigali", "Northern", "Southern", "Western"]),
  country("US", "United States", "North America", false, "State", "County", 50, []),
]);
export const useCountryList = () => useStore(countriesStore);
/** Countries we operate in, with their active states/regions, for every address form. */
export function useCountries(): Record<string, string[]> {
  const list = useStore(countriesStore);
  return Object.fromEntries(list.filter((c) => c.enabled).map((c) => [c.name, c.regions.filter((r) => r.active).map((r) => r.name)]));
}
/** Countries that can still be added (a short ISO list for the prototype). */
export const MORE_COUNTRIES: [string, string, string][] = [
  ["BJ", "Benin", "Africa"], ["CI", "Côte d'Ivoire", "Africa"], ["EG", "Egypt", "Africa"], ["ET", "Ethiopia", "Africa"], ["SN", "Senegal", "Africa"],
  ["TG", "Togo", "Africa"], ["TZ", "Tanzania", "Africa"], ["UG", "Uganda", "Africa"], ["AE", "United Arab Emirates", "Asia"], ["IN", "India", "Asia"],
  ["CA", "Canada", "North America"], ["DE", "Germany", "Europe"], ["FR", "France", "Europe"], ["IE", "Ireland", "Europe"], ["NL", "Netherlands", "Europe"],
];
export const customersInCountry = (customers: Customer[], name: string) => customers.filter((c) => c.country === name).length;
export const customersInRegion = (customers: Customer[], countryName: string, region: string) => customers.filter((c) => c.country === countryName && c.state === region).length;

const patchCountry = (code: string, fn: (c: Country) => Country) => countriesStore.set((prev) => prev.map((c) => (c.code === code ? fn(c) : c)));
export function addCountry(code: string) {
  const [c, name, continent] = MORE_COUNTRIES.find(([x]) => x === code)!;
  countriesStore.set((prev) => [...prev, country(c, name, continent, true, "Region", "District", 0, [])].sort((a, b) => a.name.localeCompare(b.name)));
  audit("Reference data", "Added country", name);
}
export function setCountryEnabled(code: string, enabled: boolean) {
  const c = countriesStore.get().find((x) => x.code === code)!;
  patchCountry(code, (x) => ({ ...x, enabled }));
  audit("Reference data", enabled ? "Turned on country" : "Turned off country", c.name, enabled ? "Now offered in address forms" : "No longer offered in address forms");
}
export function addRegion(code: string, name: string) {
  const c = countriesStore.get().find((x) => x.code === code)!;
  patchCountry(code, (x) => ({ ...x, regions: [...x.regions, { id: newId(code), name: name.trim(), active: true, areas: [] }].sort((a, b) => a.name.localeCompare(b.name)) }));
  audit("Reference data", `Added ${c.regionLabel.toLowerCase()}`, name.trim(), `Country: ${c.name}`);
}
export function setRegionActive(code: string, regionId: string, active: boolean) {
  const c = countriesStore.get().find((x) => x.code === code)!;
  const r = c.regions.find((x) => x.id === regionId)!;
  patchCountry(code, (x) => ({ ...x, regions: x.regions.map((y) => (y.id === regionId ? { ...y, active } : y)) }));
  audit("Reference data", active ? `Turned on ${c.regionLabel.toLowerCase()}` : `Turned off ${c.regionLabel.toLowerCase()}`, r.name, `Country: ${c.name}`);
}
export function addArea(code: string, regionId: string, name: string) {
  const c = countriesStore.get().find((x) => x.code === code)!;
  const r = c.regions.find((x) => x.id === regionId)!;
  patchCountry(code, (x) => ({ ...x, regions: x.regions.map((y) => (y.id === regionId ? { ...y, areas: [...y.areas, name.trim()].sort() } : y)) }));
  audit("Reference data", `Added ${c.areaLabel}`, name.trim(), `${r.name}, ${c.name}`);
}

/* ================= Reference data: currencies ================= */

export type CurrencySetting = { code: string; name: string; symbol: string; enabled: boolean; replacedBy?: string };
export const currenciesStore = createStore<CurrencySetting[]>([
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", enabled: true },
  { code: "USD", name: "US Dollar", symbol: "$", enabled: true },
  { code: "GBP", name: "British Pound", symbol: "£", enabled: true },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵", enabled: false },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", enabled: false },
  { code: "EUR", name: "Euro", symbol: "€", enabled: false },
  { code: "ZAR", name: "South African Rand", symbol: "R", enabled: false },
  { code: "XOF", name: "CFA Franc BCEAO", symbol: "CFA", enabled: false },
  { code: "ZMK", name: "Zambian Kwacha (old)", symbol: "ZK", enabled: false, replacedBy: "ZMW" },
  { code: "VEF", name: "Venezuelan Bolívar (old)", symbol: "Bs", enabled: false, replacedBy: "VES" },
]);
export const useCurrencies = () => useStore(currenciesStore);
/** How many plans and bundles have a price in this currency. */
export function priceUsage(code: string) {
  const plans = plansStore.get().filter((p) => p.status !== "Archived" && p.prices.some((x) => x.currency === code)).length;
  const bundles = bundlesStore.get().filter((b) => b.status !== "Archived" && b.prices.some((x) => x.currency === code)).length;
  return { plans, bundles, total: plans + bundles };
}
export function setCurrencyEnabled(code: string, enabled: boolean) {
  currenciesStore.set((prev) => prev.map((c) => (c.code === code ? { ...c, enabled } : c)));
  audit("Reference data", enabled ? "Turned on currency" : "Turned off currency", code);
}

/* ================= Reference data: payment methods ================= */

export type PaymentMethodSetting = { id: PaymentMethod; online: boolean; enabled: boolean; requiresReference: boolean; hint: string };
export const paymentMethodsStore = createStore<PaymentMethodSetting[]>([
  { id: "Card", online: true, enabled: true, requiresReference: false, hint: "Paid online through the payment gateway" },
  { id: "Bank transfer", online: false, enabled: true, requiresReference: true, hint: "Recorded by staff with the bank reference" },
  { id: "POS", online: false, enabled: true, requiresReference: true, hint: "Recorded by staff with the POS slip number" },
  { id: "Cash", online: false, enabled: true, requiresReference: false, hint: "Recorded by staff; a receipt number is optional" },
  { id: "Cheque", online: false, enabled: false, requiresReference: true, hint: "Recorded by staff with the cheque number" },
]);
export const usePaymentMethods = () => useStore(paymentMethodsStore);
export const paymentsByMethod = (method: PaymentMethod) => paymentsStore.get().filter((p) => p.method === method).length;
export function updatePaymentMethod(id: PaymentMethod, p: Partial<Pick<PaymentMethodSetting, "enabled" | "requiresReference">>) {
  paymentMethodsStore.set((prev) => prev.map((m) => (m.id === id ? { ...m, ...p } : m)));
  if ("enabled" in p) audit("Reference data", p.enabled ? "Turned on payment method" : "Turned off payment method", id);
  if ("requiresReference" in p) audit("Reference data", p.requiresReference ? "Reference now required" : "Reference now optional", id);
}

/* ================= Merchant API keys ================= */

export type ApiKey = {
  id: string; cicod: string; company: string; label: string; last4: string; createdAt: string; createdBy: string;
  lastUsedAt: string | null; status: "Active" | "Revoked"; revokedAt?: string; revokedBy?: string; revokeReason?: string;
};
export const KEY_PREFIX = "ck_live_";
export const REVOKE_REASONS = ["Key leaked or shared", "Integration no longer used", "Merchant asked for a new key", "Customer suspended", "Other"];
export const apiKeysStore = createStore<ApiKey[]>([
  { id: "k-1", cicod: "23488", company: "crmdemo", label: "Storefront sync", last4: "7Q2M", createdAt: isoAgo(2, 11, 5), createdBy: CURRENT_USER, lastUsedAt: isoAgo(0, 8, 40), status: "Active" },
  { id: "k-2", cicod: "23484", company: "Spar", label: "ERP connector", last4: "K9VD", createdAt: isoAgo(140, 15, 0), createdBy: "Femi Adebayo", lastUsedAt: isoAgo(0, 7, 55), status: "Active" },
  { id: "k-3", cicod: "23489", company: "Omoyeme", label: "Mobile app", last4: "P3XA", createdAt: isoAgo(70, 12, 20), createdBy: "Femi Adebayo", lastUsedAt: null, status: "Active" },
  { id: "k-4", cicod: "23491", company: "Superstore", label: "Website checkout", last4: "M1RT", createdAt: isoAgo(200, 9, 0), createdBy: "Femi Adebayo", lastUsedAt: isoAgo(34, 18, 2), status: "Revoked", revokedAt: isoAgo(33, 13, 10), revokedBy: "Femi Adebayo", revokeReason: "Key leaked or shared" },
]);
export const useApiKeys = () => useStore(apiKeysStore);
/** Creates a key and returns the full secret. Only the last 4 characters are kept. Call from an event handler. */
export function generateKey(c: { cicod: string; company: string }, label: string): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint8Array(32); crypto.getRandomValues(bytes);
  const secret = KEY_PREFIX + [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
  const key: ApiKey = { id: newId("k"), cicod: c.cicod, company: c.company, label: label.trim(), last4: secret.slice(-4), createdAt: new Date().toISOString(), createdBy: CURRENT_USER, lastUsedAt: null, status: "Active" };
  apiKeysStore.set((prev) => [key, ...prev]);
  audit("API keys", "Generated key", `${c.company} (#${c.cicod})`, `Label: ${key.label} · ends ${key.last4}`);
  return secret;
}
export function revokeKey(id: string, reason: string, note?: string) {
  const k = apiKeysStore.get().find((x) => x.id === id)!;
  apiKeysStore.set((prev) => prev.map((x) => (x.id === id ? { ...x, status: "Revoked", revokedAt: new Date().toISOString(), revokedBy: CURRENT_USER, revokeReason: reason } : x)));
  audit("API keys", "Revoked key", `${k.company} (#${k.cicod})`, `Ends ${k.last4} · Reason: ${reason}${note ? `. ${note}` : ""}`);
}

/* ================= Notifications (replaces Triggers) ================= */

export type NotificationRule = {
  id: string; event: string; when: string; recipients: string; channel: "email" | "sms";
  templateId: string | null; expects: TemplateCategory | "Internal"; enabled: boolean;
};
export const notificationsStore = createStore<NotificationRule[]>([
  { id: "n-created", event: "Customer created", when: "As soon as a customer is added", recipients: "Customer's primary contact", channel: "email", templateId: "em-welcome", expects: "Onboarding", enabled: true },
  { id: "n-trial", event: "Trial ending", when: "3 days before the trial ends", recipients: "Customer's primary contact", channel: "sms", templateId: "sms-trial", expects: "Marketing", enabled: true },
  { id: "n-failed", event: "Payment failed", when: "When a card payment fails", recipients: "Customer's primary contact", channel: "email", templateId: "em-warning", expects: "Billing", enabled: true },
  { id: "n-lead", event: "Lead assigned", when: "When a lead gets an owner", recipients: "The new lead owner", channel: "email", templateId: null, expects: "Internal", enabled: true },
  { id: "n-partner", event: "Partner verified", when: "When a partner application is verified", recipients: "The partner", channel: "email", templateId: null, expects: "Onboarding", enabled: false },
  { id: "n-invite", event: "User invited", when: "When someone is invited to the CRM", recipients: "The invited person", channel: "email", templateId: null, expects: "Internal", enabled: true },
]);
export const useNotifications = () => useStore(notificationsStore);
export function updateNotification(id: string, p: Partial<Pick<NotificationRule, "enabled" | "templateId" | "channel">>, describe: string) {
  const n = notificationsStore.get().find((x) => x.id === id)!;
  notificationsStore.set((prev) => prev.map((x) => (x.id === id ? { ...x, ...p } : x)));
  audit("Notifications", describe, n.event);
}
