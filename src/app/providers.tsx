"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { setUnauthorizedHandler } from "@/lib/api-client";
import { getQueryClient } from "@/lib/query-client";
import { Toaster } from "@/components/ui/Toast";
import { TooltipProvider } from "@/components/ui/primitives/tooltip";

/**
 * App-wide client providers: the shared TanStack Query client, tooltips and toasts. Also decides what happens
 * when any request comes back 401: cached data is dropped and the user is sent to sign in again, then
 * returned to the page they were on.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  React.useEffect(() => {
    setUnauthorizedHandler(() => {
      queryClient.clear();
      const next = window.location.pathname + window.location.search;
      window.location.assign(`/login?expired=1&next=${encodeURIComponent(next)}`);
    });
    return () => setUnauthorizedHandler(null);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        {children}
        <Toaster />
      </TooltipProvider>
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />}
    </QueryClientProvider>
  );
}
