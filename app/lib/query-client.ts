import { QueryCache, QueryClient } from "@tanstack/react-query";
import { redirectToExpiredLogin, SessionExpiredError } from "~/lib/session-expired";

export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (error instanceof SessionExpiredError) {
          redirectToExpiredLogin();
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 5 * 60_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) =>
          error instanceof SessionExpiredError ? false : failureCount < 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
