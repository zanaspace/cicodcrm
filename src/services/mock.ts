/**
 * Mock-mode transport. Each service's mock branch runs against the in-browser sample stores through
 * `mockCall`, which adds a short async delay so loading, pending and error states behave as they will
 * against the real backend. Errors thrown inside become ApiErrors, like a failed HTTP call.
 */
import { ApiError } from "@/lib/api-client";
import { isMockMode } from "@/lib/env";

const MOCK_LATENCY_MS = process.env.NODE_ENV === "test" ? 0 : 250;

export async function mockCall<T>(fn: () => T | Promise<T>, latency = MOCK_LATENCY_MS): Promise<T> {
  if (latency) await new Promise((r) => setTimeout(r, latency));
  try {
    // Copy the result so callers can never mutate the store's state by accident.
    const value = await fn();
    return value === undefined ? value : structuredClone(value);
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(e instanceof Error ? e.message : "Something went wrong.", 400);
  }
}

/** For mock implementations to reject like the backend would, e.g. mockReject("Plan code already exists", 409). */
export function mockReject(message: string, status = 400, fieldErrors: Record<string, string> = {}): never {
  throw new ApiError(message, status, undefined, fieldErrors);
}

/**
 * Runs the mock implementation in mock mode, otherwise the backend call. Every service operation is written as
 *   via(() => mockStoreLogic(...), () => api.post(ENDPOINTS.x, { body }))
 */
export function via<T>(mock: () => T | Promise<T>, live: () => Promise<T>): Promise<T> {
  return isMockMode() ? mockCall(mock) : live();
}
