/**
 * Server-side calls to the CRM backend's authentication endpoints (live mode), plus the mock equivalents.
 *
 * TODO(confirm against Angular): the endpoint paths, request fields and response shape below are
 * placeholders. Read the Angular AuthService / login component and the backend contract, then update
 * AUTH_ENDPOINTS and mapBackendUser. Until confirmed, run with NEXT_PUBLIC_API_MODE=mock.
 */
import { isMockMode, serverEnv } from "@/lib/env";
import { findSeedStaff } from "@/lib/mock/seed/staff";
import type { SessionUser } from "@/lib/auth/session";
import { MODULES, type AccessMap } from "@/lib/permissions/model";

export const AUTH_ENDPOINTS = {
  login: "/auth/login", // TODO(confirm): Angular AuthService login URL and payload
  logout: "/auth/logout", // TODO(confirm)
  me: "/auth/me", // TODO(confirm): current-user endpoint, incl. role and permissions
  forgotPassword: "/auth/forgot-password", // TODO(confirm): does the backend support this flow?
  resetPassword: "/auth/reset-password", // TODO(confirm)
};

export class AuthError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

type LoginResult = { user: SessionUser; token?: string };

async function backend<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const base = serverEnv.crmApiBaseUrl();
  if (!base) throw new AuthError("CRM_API_BASE_URL is not configured on the server.", 500);
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { Accept: "application/json", "Content-Type": "application/json", ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}), ...init.headers },
    cache: "no-store",
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : undefined;
  if (!res.ok) throw new AuthError(body?.message ?? "Sign-in failed.", res.status);
  return body as T;
}

/** TODO(confirm): map the backend's user/role/permission payload onto the CRM permission model. */
function mapBackendUser(raw: Record<string, unknown>): SessionUser {
  const access = Object.fromEntries(MODULES.map((m) => [m.id, "view"])) as AccessMap;
  return {
    id: String(raw.id ?? raw.userId ?? ""),
    name: String(raw.name ?? raw.fullName ?? raw.email ?? ""),
    email: String(raw.email ?? ""),
    role: { id: String(raw.role ?? "unknown"), name: String(raw.roleName ?? raw.role ?? "Unknown") },
    access,
  };
}

export async function login(email: string, password: string): Promise<LoginResult> {
  if (isMockMode()) {
    const staff = findSeedStaff(email);
    // Same message for unknown email and wrong password, so the form does not reveal who has an account.
    if (!staff || password !== serverEnv.mockLoginPassword()) throw new AuthError("Email or password is incorrect.", 401);
    if (staff.status === "Invited") throw new AuthError("Accept your invite from the email we sent before signing in.", 403);
    if (staff.status === "Deactivated") throw new AuthError("This account has been deactivated. Ask an admin to restore access.", 403);
    const { status: _status, ...user } = staff;
    return { user };
  }
  const res = await backend<{ token: string; user: Record<string, unknown> }>(AUTH_ENDPOINTS.login, { method: "POST", body: JSON.stringify({ email, password }) });
  return { token: res.token, user: mapBackendUser(res.user) };
}

export async function logout(token?: string) {
  if (isMockMode() || !token) return;
  await backend(AUTH_ENDPOINTS.logout, { method: "POST", token }).catch(() => undefined);
}

export async function requestPasswordReset(email: string) {
  if (isMockMode()) return; // always succeeds, so the response never reveals whether the email exists
  await backend(AUTH_ENDPOINTS.forgotPassword, { method: "POST", body: JSON.stringify({ email }) });
}

export async function resetPassword(token: string, password: string) {
  if (isMockMode()) {
    if (!token) throw new AuthError("This reset link is invalid or has expired. Request a new one.", 400);
    return;
  }
  await backend(AUTH_ENDPOINTS.resetPassword, { method: "POST", body: JSON.stringify({ token, password }) });
}
