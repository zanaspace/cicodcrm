import { QueryClient, isServer } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-client";

/** Shared defaults: data stays fresh for 30s, 4xx errors are not retried, no refetch storm on tab focus. */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
          return failureCount < 2;
        },
      },
      mutations: { retry: false },
    },
  });
}

let browserClient: QueryClient | undefined;

/** One client per browser tab; a fresh one per server render so requests never share cached data. */
export function getQueryClient() {
  if (isServer) return makeQueryClient();
  if (!browserClient) browserClient = makeQueryClient();
  return browserClient;
}
