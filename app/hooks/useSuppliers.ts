import { useQuery } from "@tanstack/react-query";
import type { ProductSupplier } from "~/types";

export const suppliersQueryKeys = {
  all: ["suppliers"] as const,
  list: () => [...suppliersQueryKeys.all, "list"] as const,
};

async function fetchSuppliersQuery(token: string): Promise<ProductSupplier[]> {
  const response = await fetch("/api/suppliers", {
    method: "GET",
    credentials: "same-origin",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erro ao carregar os fornecedores.");
  }

  return response.json();
}

export function useSuppliersQuery(token: string) {
  return useQuery({
    queryKey: suppliersQueryKeys.list(),
    queryFn: () => fetchSuppliersQuery(token),
    staleTime: Infinity,
  });
}
