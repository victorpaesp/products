import { useQuery } from "@tanstack/react-query";
import type { ProductColor } from "~/types";
import { assertSessionActive } from "~/lib/session-expired";

export const colorsQueryKeys = {
  all: ["colors"] as const,
  list: () => [...colorsQueryKeys.all, "list"] as const,
};

async function fetchColorsQuery(): Promise<ProductColor[]> {
  const response = await fetch("/api/colors", {
    method: "GET",
    credentials: "same-origin",
  });

  assertSessionActive(response);

  if (!response.ok) {
    throw new Error("Erro ao carregar as cores.");
  }

  return response.json();
}

export function useColorsQuery() {
  return useQuery({
    queryKey: colorsQueryKeys.list(),
    queryFn: fetchColorsQuery,
    staleTime: Infinity,
  });
}
