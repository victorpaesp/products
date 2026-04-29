import { LoaderCircle } from "lucide-react";
import type { LoadingStateProps } from "~/types/components";

export function LoadingState({ compact = false }: LoadingStateProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <LoaderCircle
          strokeWidth={1}
          className="size-5 animate-spin text-gray-500"
        />
        <span className="text-sm text-gray-600">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-64 flex-col items-center justify-center">
      <LoaderCircle
        strokeWidth={0.75}
        className="mb-4 size-20 animate-spin text-gray-400"
      />
      <span className="text-lg text-gray-500">Carregando...</span>
    </div>
  );
}
