import { Download, FileText, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ExportToastProps } from "~/types/components";

export function ExportToast({
  isVisible,
  onClose,
  status,
  message,
}: ExportToastProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  const getStatusConfig = () => {
    switch (status) {
      case "processing":
        return {
          icon: <Download className="h-5 w-5 animate-bounce" />,
          title: "Gerando documento...",
          description: "Processando as imagens e criando o arquivo Word",
          bgColor: "bg-blue-600",
          textColor: "text-white",
        };
      case "success":
        return {
          icon: <FileText className="h-5 w-5" />,
          title: "Documento criado!",
          description: "O arquivo foi baixado com sucesso",
          bgColor: "bg-green-600",
          textColor: "text-white",
        };
      case "error":
        return {
          icon: <X className="h-5 w-5" />,
          title: "Erro ao gerar documento",
          description: message || "Ocorreu um erro durante o processamento",
          bgColor: "bg-red-600",
          textColor: "text-white",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={`fixed right-4 bottom-4 z-50 transform transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div
        className={`${config.bgColor} ${config.textColor} max-w-sm min-w-[300px] rounded-lg p-4 shadow-lg`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">{config.icon}</div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold">{config.title}</h4>
            <p className="mt-1 text-xs opacity-90">{config.description}</p>
          </div>
          {status !== "processing" && (
            <button
              onClick={onClose}
              className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {status === "processing" && (
          <div className="mt-3">
            <div className="h-1.5 w-full rounded-full bg-black/20">
              <div
                className="h-1.5 animate-pulse rounded-full bg-white"
                style={{ width: "60%" }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
