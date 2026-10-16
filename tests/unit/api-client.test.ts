import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, api, resolveUrl, serializeQuery, setUnauthorizedHandler } from "@/lib/api-client";

function mockFetch(status: number, body: unknown, contentType = "application/json") {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  const fn = vi.fn(async () => new Response(status === 204 ? null : text, { status, headers: { "content-type": contentType } }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
  setUnauthorizedHandler(null);
});

describe("serializeQuery", () => {
  it("skips empty values and repeats array keys", () => {
    expect(serializeQuery({ q: "acme", page: 2, empty: "", none: undefined, nul: null, tag: ["a", "b"] })).toBe("?q=acme&page=2&tag=a&tag=b");
  });
  it("returns an empty string when there is nothing to send", () => {
    expect(serializeQuery()).toBe("");
    expect(serializeQuery({ q: "" })).toBe("");
  });
});

describe("resolveUrl", () => {
  it("sends backend paths through the same-origin proxy", () => {
    expect(resolveUrl("/customers", { q: "x" })).toBe("/api/backend/customers?q=x");
  });
  it("calls internal app routes as-is", () => {
    expect(resolveUrl("/api/auth/me")).toBe("/api/auth/me");
  });
});

describe("request", () => {
  it("sends JSON bodies and parses JSON responses", async () => {
    const fetch = mockFetch(200, { id: "1" });
    const res = await api.post<{ id: string }>("/customers", { body: { name: "Acme" } });
    expect(res).toEqual({ id: "1" });
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/backend/customers");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ name: "Acme" }));
    expect(init.credentials).toBe("same-origin");
  });

  it("sends multipart form data without forcing a content type", async () => {
    const fetch = mockFetch(200, {});
    const form = new FormData();
    form.append("file", new Blob(["x"]), "a.txt");
    await api.post("/uploads", { form });
    const init = (fetch.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(init.body).toBe(form);
    expect((init.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
  });

  it("normalizes backend errors, including field errors", async () => {
    mockFetch(422, { message: "Check the form", errors: { email: ["Already used"] } });
    const err = await api.post<never>("/users", { body: {} }).catch((e: unknown) => e as ApiError);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(422);
    expect(err.message).toBe("Check the form");
    expect(err.fieldErrors).toEqual({ email: "Already used" });
    expect(err.isValidation).toBe(true);
  });

  it("uses a readable fallback message when the body has none", async () => {
    mockFetch(404, "");
    const err = await api.get<never>("/customers/9").catch((e: unknown) => e as ApiError);
    expect(err.message).toBe("We couldn't find that record.");
  });

  it("reports network failures as status 0", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    const err = await api.get<never>("/customers").catch((e: unknown) => e as ApiError);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.isNetwork).toBe(true);
  });

  it("calls the session-expired handler on 401, unless told not to", async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    mockFetch(401, { message: "expired" });
    await api.get("/customers").catch(() => undefined);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    await api.get("/api/auth/me", { skipAuthRedirect: true }).catch(() => undefined);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
});
