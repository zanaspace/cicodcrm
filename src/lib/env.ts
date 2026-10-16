/**
 * Environment configuration. The API base URL and secrets are read here and nowhere else.
 * Only NEXT_PUBLIC_* values are available in the browser; the server-only values throw if read there.
 */
export type ApiMode = "mock" | "live";

const mode = process.env.NEXT_PUBLIC_API_MODE === "live" ? "live" : "mock";

export const env = {
  /** "mock" serves the sample data in the browser; "live" calls the CRM backend through /api/backend. */
  apiMode: mode as ApiMode,
  /** Same-origin path the browser uses for backend calls; the route handler adds the session token. */
  backendProxyPath: "/api/backend",
};

export const isMockMode = () => env.apiMode === "mock";

function serverOnly(name: string): string | undefined {
  if (typeof window !== "undefined") throw new Error(`${name} is server-only and cannot be read in the browser`);
  return process.env[name];
}

export const serverEnv = {
  crmApiBaseUrl: () => serverOnly("CRM_API_BASE_URL") ?? "",
  sessionSecret: () => serverOnly("SESSION_SECRET") || "dev-only-session-secret-change-me",
  sessionTtlMinutes: () => Number(serverOnly("SESSION_TTL_MINUTES") || 480),
  mockLoginPassword: () => serverOnly("MOCK_LOGIN_PASSWORD") || "cicod-demo",
};
