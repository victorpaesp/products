import { useQuery } from "@tanstack/react-query";
import type { ProductSupplier } from "~/types";
import { assertSessionActive } from "~/lib/session-expired";

export const suppliersQueryKeys = {
  all: ["suppliers"] as const,
  list: () => [...suppliersQueryKeys.all, "list"] as const,
};

async function fetchSuppliersQuery(token?: string): Promise<ProductSupplier[]> {
  const response = await fetch("/api/suppliers", {
    method: "GET",
    credentials: "same-origin",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  assertSessionActive(response);

  if (!response.ok) {
    throw new Error("Erro ao carregar os fornecedores.");
  }

  return response.json();
}

export function useSuppliersQuery(
  token?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: suppliersQueryKeys.list(),
    queryFn: () => fetchSuppliersQuery(token),
    staleTime: Infinity,
    enabled: options?.enabled ?? true,
  });
}
