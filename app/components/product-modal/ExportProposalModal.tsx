import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Download } from "lucide-react";

interface ExportProposalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    proposalName: string;
    seller: string;
    extraField: string;
  }) => void;
}

export const ExportProposalModal: React.FC<ExportProposalModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
}) => {
  const [seller, setSeller] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ proposalName: "", seller, extraField: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:bg-neutral-900 bg-white dark:border-none">
        <DialogHeader>
          <DialogTitle className="dark:text-white text-black">
            Exportar Proposta
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="mb-4 dark:text-gray-300 text-gray-700">
          Preencha as informações desejadas para a exportação da proposta.
        </DialogDescription>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="seller"
              className="block text-sm font-medium mb-1 dark:text-white text-black"
            >
              Vendedor <span className="text-xs text-gray-400">(opcional)</span>
            </label>
            <Input
              id="seller"
              placeholder="Digite o nome do vendedor"
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
              className="dark:bg-neutral-800 dark:text-white bg-white text-black"
            />
          </div>
          <Button
            type="submit"
            className="w-full flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-lg shadow-md transition-all duration-200 bg-black hover:bg-gray-700 dark:bg-gray-800 dark:hover:bg-gray-900 text-white"
          >
            <Download className="h-5 w-5" />
            Exportar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
