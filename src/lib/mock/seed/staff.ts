/**
 * Sample staff accounts and roles. Plain data with no store, so the server (mock sign-in, session) and the
 * browser (Settings › Users and Roles) start from the same records. Used only when NEXT_PUBLIC_API_MODE=mock.
 */
import { CURRENT_USER } from "@/lib/format";
import type { Access, AccessMap } from "@/lib/permissions/model";

export type UserStatus = "Active" | "Invited" | "Deactivated";

export type RoleSeed = { id: string; name: string; description: string; builtIn: boolean; locked?: boolean; access: AccessMap };

const acc = (c: Access, cat: Access, b: Access, p: Access, m: Access, pa: Access, s: Access): AccessMap =>
  ({ customers: c, catalogue: cat, billing: b, pipeline: p, marketing: m, partners: pa, settings: s });

export const ROLE_SEED: RoleSeed[] = [
  { id: "admin", name: "Admin", description: "Everything, including users and API keys", builtIn: true, locked: true, access: acc("full", "full", "full", "full", "full", "full", "full") },
  { id: "sales", name: "Sales", description: "Works leads and partners; sees customers and prices", builtIn: true, access: acc("edit", "view", "view", "full", "edit", "edit", "none") },
  { id: "success", name: "Customer Success", description: "Onboards and supports customers", builtIn: true, access: acc("full", "view", "view", "view", "view", "view", "none") },
  { id: "finance", name: "Finance", description: "Payments, collections, dunning and commission", builtIn: true, access: acc("view", "view", "full", "none", "none", "full", "none") },
  { id: "developer", name: "Developer", description: "Merchant API keys and catalogue set-up", builtIn: true, access: acc("view", "edit", "view", "none", "none", "none", "edit") },
  { id: "readonly", name: "Read-only", description: "Sees everything, changes nothing", builtIn: true, access: acc("view", "view", "view", "view", "view", "view", "view") },
];

export type UserSeed = [name: string, roleId: string, phoneLocal: string, status: UserStatus, createdDaysAgo: number, lastActiveDaysAgo: number | null, deactivationReason?: string];

export const USER_SEED: UserSeed[] = [
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

export const emailOf = (name: string) => `${name.toLowerCase().replace(/[^a-z ]/g, "").trim().replace(/\s+/g, ".")}@cicod.com`;
export const userIdAt = (index: number) => `u-${index + 1}`;

/** Sign-in lookup for mock mode: the sample staff member with this email, if any. */
export function findSeedStaff(email: string) {
  const i = USER_SEED.findIndex(([name]) => emailOf(name) === email.trim().toLowerCase());
  if (i < 0) return null;
  const [name, roleId, , status] = USER_SEED[i];
  const role = ROLE_SEED.find((r) => r.id === roleId)!;
  return { id: userIdAt(i), name, email: emailOf(name), status, role: { id: role.id, name: role.name }, access: role.access };
}

export function findSeedStaffById(id: string) {
  const i = USER_SEED.findIndex((_, idx) => userIdAt(idx) === id);
  return i < 0 ? null : findSeedStaff(emailOf(USER_SEED[i][0]));
}
