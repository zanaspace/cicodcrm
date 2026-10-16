import { api } from "@/lib/api-client";
import {
  CURRENT_USER_ID, apiKeysStore, auditStore, changePassword, changeRole, deactivateUser, deleteRole, generateKey, inviteUser,
  notificationsStore, reactivateUser, resendInvite, revokeKey, rolesStore, saveRole, updateNotification, updateProfile,
  usersStore,
  type ApiKey, type AuditEntry, type NotificationRule, type Role, type User,
} from "@/lib/mock/settings";
import { mockReject, via } from "@/services/mock";

/**
 * Administration: users, roles and permissions, audit log, own profile, merchant API keys, notification rules
 * (legacy Angular: Settings › Manage Users, Profile Settings, Generate Merchant Key).
 * TODO(confirm against Angular): endpoint paths and payloads; how roles/permissions are represented by the backend.
 */
export const SETTINGS_ENDPOINTS = {
  users: "/users", // TODO(confirm)
  user: (id: string) => `/users/${encodeURIComponent(id)}`, // TODO(confirm)
  userAction: (id: string, action: string) => `/users/${encodeURIComponent(id)}/${action}`, // TODO(confirm)
  roles: "/roles", // TODO(confirm)
  role: (id: string) => `/roles/${encodeURIComponent(id)}`, // TODO(confirm)
  audit: "/audit-log", // TODO(confirm)
  profile: "/me/profile", // TODO(confirm)
  password: "/me/password", // TODO(confirm)
  apiKeys: "/merchant-keys", // TODO(confirm)
  apiKey: (id: string) => `/merchant-keys/${encodeURIComponent(id)}`, // TODO(confirm)
  notifications: "/notification-rules", // TODO(confirm)
  notification: (id: string) => `/notification-rules/${encodeURIComponent(id)}`, // TODO(confirm)
};

/**
 * Why `userId` can't be deactivated or lose the Admin role while `actorId` is signed in, or null when they can.
 * Pure, so screens run it on queried users before acting. The backend must enforce the same rule (409).
 */
export function adminProblem(users: User[], userId: string, actorId: string | undefined): string | null {
  const u = users.find((x) => x.id === userId);
  if (!u) return null;
  if (actorId && u.id === actorId) return "You can't remove your own access. Ask another admin.";
  const admins = users.filter((x) => x.status === "Active" && x.roleId === "admin");
  if (u.roleId === "admin" && u.status === "Active" && admins.length <= 1) return "This is the last active admin. Make someone else an admin first.";
  return null;
}

/** Mock only: the backend knows who is calling, the mock is told (`actorId`, the signed-in user). */
const guarded = (userId: string, actorId?: string) => {
  const problem = adminProblem(usersStore.get(), userId, actorId ?? CURRENT_USER_ID);
  if (problem) mockReject(problem, 409);
};

export const usersService = {
  list: () => via(() => usersStore.get(), () => api.get<User[]>(SETTINGS_ENDPOINTS.users)),
  invite: (input: { name: string; email: string; phone: string; roleId: string }) =>
    via(() => inviteUser(input), () => api.post<User>(SETTINGS_ENDPOINTS.users, { body: input })),
  changeRole: (id: string, roleId: string, actorId?: string) =>
    via(() => { guarded(id, actorId); changeRole(id, roleId); }, () => api.patch<void>(SETTINGS_ENDPOINTS.user(id), { body: { roleId } })),
  deactivate: (id: string, reason: string, note?: string, actorId?: string) =>
    via(() => { guarded(id, actorId); deactivateUser(id, reason, note); }, () => api.post<void>(SETTINGS_ENDPOINTS.userAction(id, "deactivate"), { body: { reason, note } })),
  reactivate: (id: string) => via(() => reactivateUser(id), () => api.post<void>(SETTINGS_ENDPOINTS.userAction(id, "reactivate"))),
  resendInvite: (id: string) => via(() => resendInvite(id), () => api.post<void>(SETTINGS_ENDPOINTS.userAction(id, "resend-invite"))),
};

export const rolesService = {
  list: () => via(() => rolesStore.get(), () => api.get<Role[]>(SETTINGS_ENDPOINTS.roles)),
  save: (role: Role, isNew: boolean) =>
    via(() => { saveRole(role); return role; },
      () => (isNew ? api.post<Role>(SETTINGS_ENDPOINTS.roles, { body: role }) : api.put<Role>(SETTINGS_ENDPOINTS.role(role.id), { body: role }))),
  remove: (id: string) => via(() => deleteRole(id), () => api.delete<void>(SETTINGS_ENDPOINTS.role(id))),
};

export const auditService = {
  list: () => via(() => auditStore.get(), () => api.get<AuditEntry[]>(SETTINGS_ENDPOINTS.audit)),
};

/** The signed-in user's own record (the session only carries id, name, email, role and access). */
export type Profile = Pick<User, "id" | "name" | "email" | "phone" | "lastActiveAt">;

export const profileService = {
  /** `id` is the signed-in user; only the mock needs it, the backend answers for the caller. */
  get: (id: string) =>
    via(() => {
      const u = usersStore.get().find((x) => x.id === id);
      if (!u) mockReject("We couldn't find your profile.", 404);
      return { id: u.id, name: u.name, email: u.email, phone: u.phone, lastActiveAt: u.lastActiveAt };
    }, () => api.get<Profile>(SETTINGS_ENDPOINTS.profile)),
  update: (id: string, p: { name: string; phone: string }) => via(() => updateProfile(id, p), () => api.patch<void>(SETTINGS_ENDPOINTS.profile, { body: p })),
  /** TODO(confirm): the backend's change-password contract (current + new password, policy). */
  changePassword: (input: { current: string; next: string }) =>
    via(() => changePassword(), () => api.post<void>(SETTINGS_ENDPOINTS.password, { body: input })),
};

export const apiKeysService = {
  list: () => via(() => apiKeysStore.get(), () => api.get<ApiKey[]>(SETTINGS_ENDPOINTS.apiKeys)),
  /** Returns the secret. It is shown once and never stored in the query cache. */
  generate: (customer: { cicod: string; company: string }, label: string) =>
    via(() => generateKey(customer, label), () => api.post<string>(SETTINGS_ENDPOINTS.apiKeys, { body: { cicod: customer.cicod, label } })),
  revoke: (id: string, reason: string, note?: string) =>
    via(() => revokeKey(id, reason, note), () => api.post<void>(`${SETTINGS_ENDPOINTS.apiKey(id)}/revoke`, { body: { reason, note } })),
};

export type NotificationPatch = Partial<Pick<NotificationRule, "enabled" | "templateId" | "channel">>;

export const notificationsService = {
  list: () => via(() => notificationsStore.get(), () => api.get<NotificationRule[]>(SETTINGS_ENDPOINTS.notifications)),
  update: (id: string, patch: NotificationPatch, describe: string) =>
    via(() => updateNotification(id, patch, describe), () => api.patch<void>(SETTINGS_ENDPOINTS.notification(id), { body: patch })),
};
