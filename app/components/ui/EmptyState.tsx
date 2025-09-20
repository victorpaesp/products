import { Search } from "lucide-react";

interface EmptyStateProps {
  message?: string;
}

export function EmptyState({
  message = "Nenhum resultado encontrado.",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full py-12">
      <Search className="w-24 h-24 mb-6 opacity-60 text-gray-400" />
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {message}
      </h2>
      <p className="text-gray-500 dark:text-gray-400">
        Tente buscar por outro termo ou verifique sua pesquisa.
      </p>
    </div>
  );
}
