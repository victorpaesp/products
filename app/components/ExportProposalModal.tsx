import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Download } from "lucide-react";

interface ExportProposalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    seller: string;
    company: string;
    contact: string;
  }) => void;
}

export const ExportProposalModal: React.FC<ExportProposalModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
}) => {
  const [seller, setSeller] = useState("");
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ company, seller, contact });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:bg-neutral-900 bg-white dark:border-none max-w-[90vw] sm:max-w-lg rounded-lg">
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
          <div>
            <label
              htmlFor="company"
              className="block text-sm font-medium mb-1 dark:text-white text-black"
            >
              Empresa <span className="text-xs text-gray-400">(opcional)</span>
            </label>
            <Input
              id="company"
              placeholder="Digite o nome da empresa"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="dark:bg-neutral-800 dark:text-white bg-white text-black"
            />
          </div>
          <div>
            <label
              htmlFor="contact"
              className="block text-sm font-medium mb-1 dark:text-white text-black"
            >
              Contato <span className="text-xs text-gray-400">(opcional)</span>
            </label>
            <Input
              id="contact"
              placeholder="Digite o contato"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
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
