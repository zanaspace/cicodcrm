"use client";

import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-client";
import { toast } from "@/components/ui/Toast";

export type CrmMutationOptions<TVars, TData> = {
  mutationFn: (vars: TVars) => Promise<TData>;
  /** Query keys to refresh after success, so every list and detail showing this data updates. */
  invalidate?: QueryKey[] | ((data: TData, vars: TVars) => QueryKey[]);
  /** Toast shown on success; omit for silent mutations. */
  success?: string | ((data: TData, vars: TVars) => string);
  /** Toast shown on failure when the error has no message of its own. */
  failure?: string;
  /** Set false for forms that show the error inline instead of as a toast. */
  toastErrors?: boolean;
  onSuccess?: (data: TData, vars: TVars) => void;
  onError?: (error: ApiError, vars: TVars) => void;
};

/**
 * Standard create/update/delete behaviour: pending state (`isPending`) to disable the submit button and block
 * double submits, success and failure toasts, field errors exposed for forms, and cache refresh on success.
 */
export function useCrmMutation<TVars = void, TData = unknown>(opts: CrmMutationOptions<TVars, TData>) {
  const qc = useQueryClient();
  const m = useMutation<TData, ApiError, TVars>({
    mutationFn: opts.mutationFn,
    onSuccess: async (data, vars) => {
      const keys = typeof opts.invalidate === "function" ? opts.invalidate(data, vars) : opts.invalidate ?? [];
      await Promise.all(keys.map((queryKey) => qc.invalidateQueries({ queryKey })));
      if (opts.success) toast.success(typeof opts.success === "function" ? opts.success(data, vars) : opts.success);
      opts.onSuccess?.(data, vars);
    },
    onError: (error, vars) => {
      // Field-level problems are shown next to the fields by the form; everything else gets a toast.
      if (opts.toastErrors !== false && !Object.keys(error.fieldErrors ?? {}).length) toast.error(error.message || opts.failure || "Something went wrong. Try again.");
      opts.onError?.(error, vars);
    },
  });

  return {
    ...m,
    /** Ignores calls while a previous one is still pending (double-click, Enter + click). */
    run: (vars: TVars) => { if (!m.isPending) m.mutate(vars); },
    fieldErrors: m.error?.fieldErrors ?? {},
  };
}

/** The per-call options a feature mutation hook passes through (toast text, callbacks). */
export type MutationHookOptions<TVars, TData = unknown> = Pick<CrmMutationOptions<TVars, TData>, "success" | "failure" | "onSuccess" | "onError" | "toastErrors">;
