import { api } from "@/lib/api-client";
import type { SessionUser } from "@/lib/auth/session";

/**
 * Authentication operations. These always call the app's own /api/auth routes, which set and clear the
 * HttpOnly session cookie; in live mode those routes talk to the CRM backend (see lib/auth/backend-auth.ts).
 */
export type MeResponse = { user: SessionUser; expiresAt: number };

export const authService = {
  me: () => api.get<MeResponse>("/api/auth/me", { skipAuthRedirect: true }),
  login: (input: { email: string; password: string; remember: boolean }) =>
    api.post<{ user: SessionUser }>("/api/auth/login", { body: input, skipAuthRedirect: true }),
  logout: () => api.post<{ ok: true }>("/api/auth/logout", { skipAuthRedirect: true }),
  forgotPassword: (email: string) => api.post<{ message: string }>("/api/auth/forgot-password", { body: { email }, skipAuthRedirect: true }),
  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>("/api/auth/reset-password", { body: { token, password }, skipAuthRedirect: true }),
};
