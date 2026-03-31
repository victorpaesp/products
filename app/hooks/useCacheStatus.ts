import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

export type CacheStatus = "idle" | "cache-hit" | "cache-miss" | "fetching";

export function useCacheStatus(query: ReturnType<typeof useQuery>) {
  const [status, setStatus] = useState<CacheStatus>("idle");
  const hadDataRef = useRef(false);
  const isFirstRenderRef = useRef(true);

  const { data, isLoading, isFetching } = query;

  useEffect(() => {
    if (isFirstRenderRef.current && data !== undefined) {
      hadDataRef.current = true;
      setStatus("cache-hit");
      isFirstRenderRef.current = false;
      return;
    }

    isFirstRenderRef.current = false;

    if (isFetching) {
      setStatus("fetching");
      return;
    }

    if (!isFetching && !isLoading) {
      if (hadDataRef.current) {
        setStatus("cache-hit");
      } else if (data !== undefined) {
        setStatus("cache-miss");
        hadDataRef.current = true;
      } else {
        setStatus("idle");
      }
    }
  }, [isFetching, isLoading, data]);

  return status;
}
