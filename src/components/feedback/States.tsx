"use client";

import * as React from "react";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/primitives/skeleton";
import { ApiError } from "@/lib/api-client";

/** Shared loading, empty and error states, so every screen handles them the same way. */

export function LoadingState({ rows = 6, label = "Loading" }: { rows?: number; label?: string }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label={label}>
      <Skeleton className="h-9 w-56" />
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 flex flex-col gap-3">
        {Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center gap-2 py-14 px-6">
      <Inbox className="w-8 h-8 text-[var(--muted-foreground)]" aria-hidden />
      <h2 className="m-0 font-heading text-[1.05rem] font-bold">{title}</h2>
      {description && <p className="m-0 text-[0.9rem] text-[var(--muted-foreground)] max-w-[420px]">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return "Something went wrong while loading this page.";
}

export function ErrorState({ error, onRetry, title = "We couldn't load this" }: { error: unknown; onRetry?: () => void; title?: string }) {
  return (
    <div role="alert" className="bg-[var(--card)] border border-[var(--border)] rounded-xl flex flex-col items-center text-center gap-2 py-12 px-6">
      <AlertTriangle className="w-8 h-8 text-[var(--destructive)]" aria-hidden />
      <h2 className="m-0 font-heading text-[1.05rem] font-bold">{title}</h2>
      <p className="m-0 text-[0.9rem] text-[var(--muted-foreground)] max-w-[460px]">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          <RefreshCw className="w-4 h-4" /> Try again
        </Button>
      )}
    </div>
  );
}

/**
 * Renders loading / error / content for a TanStack Query result, so screens don't repeat the branching:
 *
 *   <QueryState query={customersQuery}>{(customers) => <CustomersTable rows={customers} />}</QueryState>
 */
export function QueryState<T>({ query, children, loading }: {
  query: { data: T | undefined; isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown };
  children: (data: T) => React.ReactNode;
  loading?: React.ReactNode;
}) {
  if (query.isPending) return <>{loading ?? <LoadingState />}</>;
  if (query.isError || query.data === undefined) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  return <>{children(query.data)}</>;
}
