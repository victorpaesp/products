import { Info } from "lucide-react";
import type { ErrorStateProps } from "~/types/components";

export function ErrorState({
  message = "Ocorreu um erro ao carregar os produtos. Tente novamente mais tarde.",
}: ErrorStateProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center py-12 text-center">
      <Info className="mb-6 h-24 w-24 text-red-600 opacity-60" />
      <h2 className="mb-2 text-xl font-semibold text-red-600">{message}</h2>
    </div>
  );
}
