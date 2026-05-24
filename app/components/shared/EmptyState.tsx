import { Search } from "lucide-react";
import type { EmptyStateProps } from "~/types/components";

export function EmptyState({
  message = "Nenhum resultado encontrado.",
}: EmptyStateProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center py-12 text-center">
      <Search className="mb-6 h-24 w-24 text-neutral-400 opacity-60" />
      <h2 className="mb-2 text-xl font-semibold text-neutral-700 dark:text-neutral-300">
        {message}
      </h2>
      <p className="text-neutral-500 dark:text-neutral-400">
        Tente buscar por outro termo ou verifique sua pesquisa.
      </p>
    </div>
  );
}
