"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/feedback/States";

/** Catches errors thrown while rendering a page, so the sidebar and header keep working. */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="max-w-[640px] mx-auto mt-10">
      <ErrorState title="This page ran into a problem" error={error} onRetry={reset} />
      {error.digest && <p className="text-center text-[0.75rem] text-[var(--muted-foreground)] mt-3">Reference: {error.digest}</p>}
    </div>
  );
}
