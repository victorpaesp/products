import { LoaderCircle } from "lucide-react";

export function LoadingState() {
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
