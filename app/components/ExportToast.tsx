import { Download, FileText, X } from "lucide-react";
import { useEffect, useState } from "react";

interface ExportToastProps {
  isVisible: boolean;
  onClose: () => void;
  status: "processing" | "success" | "error";
  message?: string;
}

export function ExportToast({ isVisible, onClose, status, message }: ExportToastProps) {
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
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 transform ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div
        className={`${config.bgColor} ${config.textColor} rounded-lg shadow-lg p-4 max-w-sm min-w-[300px]`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {config.icon}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{config.title}</h4>
            <p className="text-xs opacity-90 mt-1">{config.description}</p>
          </div>
          {status !== "processing" && (
            <button
              onClick={onClose}
              className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {status === "processing" && (
          <div className="mt-3">
            <div className="w-full bg-black/20 rounded-full h-1.5">
              <div className="bg-white h-1.5 rounded-full animate-pulse" style={{ width: "60%" }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
