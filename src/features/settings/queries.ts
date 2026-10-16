"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSessionUser } from "@/features/auth/hooks";
import { queryKeys } from "@/lib/query-keys";
import { useCrmMutation, type MutationHookOptions } from "@/lib/mutations";
import { adminProblem, apiKeysService, auditService, notificationsService, profileService, rolesService, usersService, type NotificationPatch } from "@/services/settings";
import type { Role, User } from "@/lib/mock/settings";

const s = queryKeys.settings;
const usersKey = s.scoped("users");
const rolesKey = s.scoped("roles");
const auditKey = s.scoped("audit");
const apiKeysKey = s.scoped("api-keys");
const notificationsKey = s.scoped("notifications");
const profileKey = s.scoped("profile");

/** Every settings change is written to the audit log, so the log refreshes too. */
const withAudit = (...k: (readonly unknown[])[]) => [...k, auditKey];

export const useUsersQuery = () => useQuery({ queryKey: usersKey, queryFn: usersService.list });
export const useRolesQuery = () => useQuery({ queryKey: rolesKey, queryFn: rolesService.list });
export const useAuditQuery = (opts: { enabled?: boolean } = {}) => useQuery({ queryKey: auditKey, queryFn: auditService.list, enabled: opts.enabled ?? true });
export const useApiKeysQuery = () => useQuery({ queryKey: apiKeysKey, queryFn: apiKeysService.list });
export const useNotificationsQuery = () => useQuery({ queryKey: notificationsKey, queryFn: notificationsService.list });
/** The signed-in user's own profile (phone, last sign-in), for the Profile page. Open to every role. */
export function useProfileQuery() {
  const me = useSessionUser();
  return useQuery({ queryKey: [...profileKey, me?.id], queryFn: () => profileService.get(me!.id), enabled: !!me });
}

/**
 * Why a user can't be deactivated or lose the Admin role (last active admin, or yourself), or null when they can.
 * Run it before opening the action; the service enforces it too and answers 409.
 */
export function useAdminGuard(): (userId: string) => string | null {
  const { data } = useUsersQuery();
  const me = useSessionUser();
  return React.useCallback((userId: string) => adminProblem(data ?? [], userId, me?.id), [data, me?.id]);
}

/* ---------- Users ---------- */

export const useInviteUser = (o: MutationHookOptions<{ name: string; email: string; phone: string; roleId: string }, User> = {}) =>
  useCrmMutation({ mutationFn: usersService.invite, invalidate: withAudit(usersKey), ...o });
export function useChangeUserRole(o: MutationHookOptions<{ id: string; roleId: string }, void> = {}) {
  const me = useSessionUser();
  return useCrmMutation({ mutationFn: ({ id, roleId }) => usersService.changeRole(id, roleId, me?.id), invalidate: withAudit(usersKey, queryKeys.session.all), ...o });
}
export function useDeactivateUser(o: MutationHookOptions<{ id: string; reason: string; note?: string }, void> = {}) {
  const me = useSessionUser();
  return useCrmMutation({ mutationFn: ({ id, reason, note }) => usersService.deactivate(id, reason, note, me?.id), invalidate: withAudit(usersKey), ...o });
}
export const useReactivateUser = (o: MutationHookOptions<{ id: string }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ id }) => usersService.reactivate(id), invalidate: withAudit(usersKey), ...o });
export const useResendInvite = (o: MutationHookOptions<{ id: string }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ id }) => usersService.resendInvite(id), invalidate: withAudit(usersKey), ...o });

/* ---------- Roles ---------- */

export const useSaveRole = (o: MutationHookOptions<{ role: Role; isNew: boolean }, Role> = {}) =>
  useCrmMutation({ mutationFn: ({ role, isNew }) => rolesService.save(role, isNew), invalidate: withAudit(rolesKey, usersKey), ...o });
export const useDeleteRole = (o: MutationHookOptions<{ id: string }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ id }) => rolesService.remove(id), invalidate: withAudit(rolesKey, usersKey), ...o });

/* ---------- Own profile ---------- */

export const useUpdateProfile = (o: MutationHookOptions<{ id: string; name: string; phone: string }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ id, name, phone }) => profileService.update(id, { name, phone }), invalidate: withAudit(usersKey, profileKey, queryKeys.session.all), ...o });
export const useChangePassword = (o: MutationHookOptions<{ current: string; next: string }, void> = {}) =>
  useCrmMutation({ mutationFn: profileService.changePassword, invalidate: withAudit(), ...o });

/* ---------- Merchant API keys ---------- */

/** The returned secret is only in the mutation result (shown once); it is never written to the query cache. */
export const useGenerateApiKey = (o: MutationHookOptions<{ customer: { cicod: string; company: string }; label: string }, string> = {}) =>
  useCrmMutation({ mutationFn: ({ customer, label }) => apiKeysService.generate(customer, label), invalidate: withAudit(apiKeysKey), ...o });
export const useRevokeApiKey = (o: MutationHookOptions<{ id: string; reason: string; note?: string }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ id, reason, note }) => apiKeysService.revoke(id, reason, note), invalidate: withAudit(apiKeysKey), ...o });

/* ---------- Notification rules ---------- */

export const useUpdateNotification = (o: MutationHookOptions<{ id: string; patch: NotificationPatch; describe: string }, void> = {}) =>
  useCrmMutation({ mutationFn: ({ id, patch, describe }) => notificationsService.update(id, patch, describe), invalidate: withAudit(notificationsKey), ...o });
