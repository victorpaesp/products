import { HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useDehydratedState } from "use-dehydrated-state";
import { createQueryClient } from "~/lib/query-client";

type QueryProviderProps = {
  children: React.ReactNode;
};

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => createQueryClient());
  const dehydratedState = useDehydratedState();

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary>
    </QueryClientProvider>
  );
}
