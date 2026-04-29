export type CacheStatus = "idle" | "cache-hit" | "cache-miss" | "fetching";

type QueryState = {
  data: unknown;
  isLoading: boolean;
  isFetching: boolean;
};

export function useCacheStatus({
  data,
  isLoading,
  isFetching,
}: QueryState): CacheStatus {
  if (isLoading) return "fetching";
  if (isFetching && data !== undefined) return "fetching";
  if (data !== undefined) return "cache-hit";
  if (!isFetching && data === undefined) return "idle";
  return "cache-miss";
}
