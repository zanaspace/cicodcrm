import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { queryKeys } from "@/lib/query-keys";
import { makeQueryClient } from "@/lib/query-client";
import { ApiError } from "@/lib/api-client";
import { useCrmMutation } from "@/lib/mutations";
import { customersService } from "@/services/customers";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

describe("query keys", () => {
  it("include every parameter that changes the result", () => {
    expect(queryKeys.customers.list({ q: "acme" })).toEqual(["customers", "list", { q: "acme" }]);
    expect(queryKeys.customers.detail(23488)).toEqual(["customers", "detail", "23488"]);
    expect(queryKeys.billing.scoped("payments")).toEqual(["billing", "payments"]);
  });
});

describe("query client defaults", () => {
  it("does not retry client errors", () => {
    const qc = makeQueryClient();
    const retry = qc.getDefaultOptions().queries!.retry as (n: number, e: unknown) => boolean;
    expect(retry(0, new ApiError("nope", 404))).toBe(false);
    expect(retry(0, new ApiError("down", 503))).toBe(true);
    expect(retry(2, new ApiError("down", 503))).toBe(false);
  });
});

describe("customers service (mock mode)", () => {
  it("returns copies, so callers cannot mutate the store", async () => {
    const list = await customersService.list();
    list[0].company = "Changed";
    const again = await customersService.list();
    expect(again[0].company).not.toBe("Changed");
  });

  it("fails like a 404 for an unknown customer", async () => {
    const err = await customersService.get("does-not-exist").catch((e: unknown) => e as ApiError);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
  });
});

describe("useCrmMutation", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={makeQueryClient()}>{children}</QueryClientProvider>;

  it("ignores a second run while the first is pending", async () => {
    let resolve!: () => void;
    const fn = vi.fn(() => new Promise<void>((r) => { resolve = r; }));
    const { result } = renderHook(() => useCrmMutation({ mutationFn: fn }), { wrapper });
    act(() => result.current.run());
    await waitFor(() => expect(result.current.isPending).toBe(true));
    act(() => result.current.run());
    expect(fn).toHaveBeenCalledTimes(1);
    await act(async () => resolve());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("exposes backend field errors for the form", async () => {
    const fn = vi.fn(async () => { throw new ApiError("Invalid", 422, undefined, { email: "Already used" }); });
    const { result } = renderHook(() => useCrmMutation({ mutationFn: fn }), { wrapper });
    act(() => result.current.run());
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.fieldErrors).toEqual({ email: "Already used" });
  });
});
