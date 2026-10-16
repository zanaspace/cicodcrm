import { env } from "@/lib/env";

/**
 * Centralized HTTP client. Every request to the CRM backend goes through here so headers, JSON/multipart
 * handling, error normalization and session expiry behave the same everywhere. Components never call fetch.
 *
 * Backend paths ("/customers") are sent to the same-origin /api/backend proxy, which attaches the session
 * token server-side, so the token is never readable by browser code. Internal Next.js routes ("/api/auth/...")
 * are called as-is.
 */

export type QueryValue = string | number | boolean | null | undefined | (string | number | boolean)[];
export type QueryParams = Record<string, QueryValue>;

export type RequestOptions = {
  query?: QueryParams;
  /** JSON body. Use `form` for multipart uploads instead. */
  body?: unknown;
  form?: FormData;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Skip the global "session expired" handling, e.g. for the login call itself. */
  skipAuthRedirect?: boolean;
};

/** Normalized error for any failed request: network failure, non-2xx status, or an unparseable body. */
export class ApiError extends Error {
  readonly status: number;
  /** Field-level validation messages from the backend, keyed by field name, when it sends them. */
  readonly fieldErrors: Record<string, string>;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.fieldErrors = fieldErrors;
  }

  get isUnauthorized() { return this.status === 401; }
  get isForbidden() { return this.status === 403; }
  get isValidation() { return this.status === 400 || this.status === 422; }
  get isNetwork() { return this.status === 0; }
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;
/** Registered once by the app providers: clears cached data and sends the user to sign in again. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) { onUnauthorized = handler; }

export function serializeQuery(query?: QueryParams): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) value.forEach((v) => params.append(key, String(v)));
    else params.append(key, String(value));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function resolveUrl(path: string, query?: QueryParams): string {
  const isInternal = path.startsWith("/api/");
  const base = isInternal ? "" : env.backendProxyPath;
  return `${base}${path.startsWith("/") ? path : `/${path}`}${serializeQuery(query)}`;
}

/** Pulls a readable message and field errors out of the common backend error shapes. */
function normalizeError(status: number, body: unknown, fallback: string): ApiError {
  let message = fallback;
  const fieldErrors: Record<string, string> = {};
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    const m = b.message ?? b.error ?? b.detail ?? b.title;
    if (typeof m === "string" && m.trim()) message = m;
    const errs = b.errors ?? b.fieldErrors;
    if (errs && typeof errs === "object" && !Array.isArray(errs)) {
      for (const [k, v] of Object.entries(errs as Record<string, unknown>)) {
        fieldErrors[k] = Array.isArray(v) ? String(v[0]) : String(v);
      }
    }
  } else if (typeof body === "string" && body.trim() && body.length < 300) {
    message = body;
  }
  return new ApiError(message, status, body, fieldErrors);
}

const STATUS_MESSAGES: Record<number, string> = {
  400: "Some details are not valid.",
  401: "Your session has expired. Sign in again.",
  403: "You don't have permission to do that.",
  404: "We couldn't find that record.",
  409: "This record was changed by someone else. Reload and try again.",
  422: "Some details are not valid.",
  429: "Too many requests. Wait a moment and try again.",
};

export async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json", ...opts.headers };
  let body: BodyInit | undefined;
  if (opts.form) {
    body = opts.form; // the browser sets the multipart boundary
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(resolveUrl(path, opts.query), { method, headers, body, signal: opts.signal, credentials: "same-origin" });
  } catch (e) {
    if ((e as Error)?.name === "AbortError") throw e;
    throw new ApiError("We couldn't reach the server. Check your connection and try again.", 0);
  }

  const text = await res.text();
  let parsed: unknown = undefined;
  if (text) {
    try { parsed = JSON.parse(text); } catch { parsed = text; }
  }

  if (!res.ok) {
    if (res.status === 401 && !opts.skipAuthRedirect) onUnauthorized?.();
    throw normalizeError(res.status, parsed, STATUS_MESSAGES[res.status] ?? `Request failed (${res.status}).`);
  }
  return parsed as T;
}

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions, "body" | "form">) => request<T>("GET", path, opts),
  post: <T>(path: string, opts?: RequestOptions) => request<T>("POST", path, opts),
  put: <T>(path: string, opts?: RequestOptions) => request<T>("PUT", path, opts),
  patch: <T>(path: string, opts?: RequestOptions) => request<T>("PATCH", path, opts),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>("DELETE", path, opts),
};
