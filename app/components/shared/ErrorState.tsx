import { Info } from "lucide-react";

interface ErrorStateProps {
  message?: string;
}

export function ErrorState({
  message = "Ocorreu um erro ao carregar os produtos. Tente novamente mais tarde.",
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full py-12">
      <Info className="w-24 h-24 mb-6 opacity-60 text-red-600" />
      <h2 className="text-xl font-semibold text-red-600 mb-2">{message}</h2>
    </div>
  );
}
