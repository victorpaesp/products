import { LoaderCircle } from "lucide-react";
import type { LoadingStateProps } from "~/types/components";

export function LoadingState({ compact = false }: LoadingStateProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <LoaderCircle
          strokeWidth={1}
          className="animate-spin size-5 text-gray-500"
        />
        <span className="text-sm text-gray-600">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-64">
      <LoaderCircle
        strokeWidth={0.75}
        className="animate-spin size-20 text-gray-400 mb-4"
      />
      <span className="text-lg text-gray-500">Carregando...</span>
    </div>
  );
}
