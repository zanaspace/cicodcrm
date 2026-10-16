/**
 * Signed session cookie. The cookie is HttpOnly, SameSite=Lax and Secure in production, so browser code
 * can never read it; the HMAC signature stops it being edited. In live mode it also carries the backend
 * token, which /api/backend attaches to each request server-side.
 *
 * Uses Web Crypto only, so it runs both in proxy.ts and in route handlers.
 */
import { serverEnv } from "@/lib/env";
import type { AccessMap } from "@/lib/permissions/model";

export const SESSION_COOKIE = "crm_session";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: { id: string; name: string };
  access: AccessMap;
};

export type Session = SessionUser & {
  /** Expiry, in ms since epoch. */
  exp: number;
  /** Backend token (live mode only). Never sent to the browser in a response body. */
  token?: string;
};

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmacKey() {
  return crypto.subtle.importKey("raw", encoder.encode(serverEnv.sessionSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function signSession(session: Session): Promise<string> {
  const payload = toBase64Url(encoder.encode(JSON.stringify(session)));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(), encoder.encode(payload)));
  return `${payload}.${toBase64Url(sig)}`;
}

/** Returns the session if the cookie is present, correctly signed and not expired; otherwise null. */
export async function verifySession(value: string | undefined | null): Promise<Session | null> {
  if (!value) return null;
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(), fromBase64Url(sig) as BufferSource, encoder.encode(payload));
    if (!ok) return null;
    const session = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as Session;
    return typeof session.exp === "number" && session.exp > Date.now() ? session : null;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/** The user part of a session, safe to return to the browser. */
export const publicUser = ({ id, name, email, role, access }: Session): SessionUser => ({ id, name, email, role, access });
