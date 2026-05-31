import { useQuery } from "@tanstack/react-query";
import type { ProductColor } from "~/types";

export const colorsQueryKeys = {
  all: ["colors"] as const,
  list: () => [...colorsQueryKeys.all, "list"] as const,
};

async function fetchColorsQuery(token: string): Promise<ProductColor[]> {
  const response = await fetch("/api/colors", {
    method: "GET",
    credentials: "same-origin",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erro ao carregar as cores.");
  }

  return response.json();
}

export function useColorsQuery(token: string) {
  return useQuery({
    queryKey: colorsQueryKeys.list(),
    queryFn: () => fetchColorsQuery(token),
    staleTime: Infinity,
  });
}
