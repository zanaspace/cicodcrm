/**
 * Campaign Studio access control (ported from authStore.js). Kept separate from CRM Settings › Roles
 * so the team can review Campaign Studio as it was built.
 * A permission is (module, view | manage); manage implies view. The signed-in CRM user is the Studio user.
 */
import { createStore, useStore } from "@/lib/store";
import { daysFromToday } from "@/lib/format";
import { CURRENT_USER_ID, currentUser } from "@/lib/mock/settings";

export const STUDIO_MODULES = [
  ["templates", "Template Library"],
  ["contacts", "Contacts"],
  ["campaigns", "Campaigns"],
  ["integrations", "Integrations"],
  ["admin", "Studio Admin"],
] as const;
export type StudioModule = (typeof STUDIO_MODULES)[number][0];
export type Perm = { view: boolean; manage: boolean };
export type StudioRole = { id: string; name: string; system: boolean; description: string; perms: Record<StudioModule, Perm> };
export type StudioUser = { id: string; crmUserId?: string; name: string; email: string; roleId: string; status: "Active" | "Invited"; createdAt: string };

const all = (v: boolean) => Object.fromEntries(STUDIO_MODULES.map(([k]) => [k, { view: v, manage: v }])) as Record<StudioModule, Perm>;
const p = (t: [boolean, boolean], c: [boolean, boolean], cm: [boolean, boolean], i: [boolean, boolean], a: [boolean, boolean]): Record<StudioModule, Perm> => ({
  templates: { view: t[0], manage: t[1] }, contacts: { view: c[0], manage: c[1] }, campaigns: { view: cm[0], manage: cm[1] }, integrations: { view: i[0], manage: i[1] }, admin: { view: a[0], manage: a[1] },
});

export const studioAccessStore = createStore<{ roles: StudioRole[]; users: StudioUser[] }>({
  roles: [
    { id: "role_admin", name: "Administrator", system: true, description: "Full access, including Studio users and roles.", perms: all(true) },
    { id: "role_mkt", name: "Marketer", system: false, description: "Builds and sends campaigns; manages contacts.", perms: p([true, true], [true, true], [true, true], [true, false], [false, false]) },
    { id: "role_view", name: "Viewer", system: false, description: "Read-only across Campaign Studio.", perms: p([true, false], [true, false], [true, false], [true, false], [false, false]) },
  ],
  users: [
    { id: "su_1", crmUserId: CURRENT_USER_ID, name: "Adeola Adesina", email: "adeola.adesina@cicod.com", roleId: "role_admin", status: "Active", createdAt: daysFromToday(-200) },
    { id: "su_2", name: "Tolu Animashaun", email: "tolu.animashaun@cicod.com", roleId: "role_mkt", status: "Active", createdAt: daysFromToday(-180) },
    { id: "su_3", name: "Kelechi Nnaji", email: "kelechi.nnaji@cicod.com", roleId: "role_view", status: "Active", createdAt: daysFromToday(-120) },
    { id: "su_4", name: "Ngozi Eze", email: "ngozi.eze@cicod.com", roleId: "role_mkt", status: "Invited", createdAt: daysFromToday(-3) },
  ],
});
export const useStudioAccess = () => useStore(studioAccessStore);

export function can(role: StudioRole | undefined, m: StudioModule, action: "view" | "manage" = "view") {
  const x = role?.perms[m];
  if (!x) return false;
  return action === "view" ? x.view || x.manage : x.manage;
}
/** The Studio user for the signed-in CRM user (falls back to Administrator so the review isn't blocked). */
export function useStudioPermissions(m: StudioModule) {
  const { roles, users } = useStudioAccess();
  const me = users.find((u) => u.crmUserId === CURRENT_USER_ID);
  const role = roles.find((r) => r.id === me?.roleId) ?? roles.find((r) => r.id === "role_admin");
  return { me, role, canView: can(role, m, "view"), canManage: can(role, m, "manage") };
}
export const studioMe = () => studioAccessStore.get().users.find((u) => u.crmUserId === CURRENT_USER_ID) ?? { name: currentUser().name, email: currentUser().email };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let seq = 500;
const set = studioAccessStore.set;

export function inviteStudioUser(input: { name: string; email: string; roleId: string }): string | null {
  const e = input.email.trim().toLowerCase();
  if (!EMAIL_RE.test(e)) return "Enter a valid email address.";
  const { users } = studioAccessStore.get();
  if (users.some((u) => u.email.toLowerCase() === e)) return "A user with that email already exists.";
  set((s) => ({ ...s, users: [...s.users, { id: `su_${Date.now()}${++seq}`, name: input.name.trim() || e.split("@")[0], email: e, roleId: input.roleId, status: "Invited", createdAt: daysFromToday(0) }] }));
  return null;
}
export const setStudioUserRole = (id: string, roleId: string) => set((s) => ({ ...s, users: s.users.map((u) => (u.id === id ? { ...u, roleId } : u)) }));
export const removeStudioUser = (id: string) => set((s) => ({ ...s, users: s.users.filter((u) => u.id !== id) }));

export function createStudioRole(input: { name: string; description: string }): string | null {
  const name = input.name.trim();
  if (!name) return "Role name is required.";
  if (studioAccessStore.get().roles.some((r) => r.name.toLowerCase() === name.toLowerCase())) return "A role with that name already exists.";
  set((s) => ({ ...s, roles: [...s.roles, { id: `role_${Date.now()}${++seq}`, name, description: input.description.trim(), system: false, perms: all(false) }] }));
  return null;
}
/** Manage implies view; removing view removes manage. System roles can't change. */
export function setStudioPerm(roleId: string, m: StudioModule, action: "view" | "manage", value: boolean) {
  set((s) => ({ ...s, roles: s.roles.map((r) => {
    if (r.id !== roleId || r.system) return r;
    const x = { ...r.perms[m], [action]: value };
    if (action === "manage" && value) x.view = true;
    if (action === "view" && !value) x.manage = false;
    return { ...r, perms: { ...r.perms, [m]: x } };
  }) }));
}
export const removeStudioRole = (id: string) => set((s) => ({ ...s, roles: s.roles.filter((r) => r.id !== id) }));
