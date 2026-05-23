import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Download } from "lucide-react";
import type { ExportProposalModalProps } from "~/types/components";

export const ExportProposalModal: React.FC<ExportProposalModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
}) => {
  const [contact, setContact] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ company, contact, description });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] rounded-lg bg-white sm:max-w-lg dark:border-none dark:bg-neutral-900">
        <DialogHeader>
          <DialogTitle className="text-black dark:text-white">
            Exportar Proposta
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="mb-4 text-neutral-700 dark:text-neutral-300">
          Preencha as informações desejadas para a exportação da proposta.
        </DialogDescription>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="contact"
              className="mb-1 block text-sm font-medium text-black dark:text-white"
            >
              Contato{" "}
              <span className="text-xs text-neutral-400">(opcional)</span>
            </label>
            <Input
              id="contact"
              placeholder="Digite o contato"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="bg-white text-black dark:bg-neutral-800 dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="company"
              className="mb-1 block text-sm font-medium text-black dark:text-white"
            >
              Empresa{" "}
              <span className="text-xs text-neutral-400">(opcional)</span>
            </label>
            <Input
              id="company"
              placeholder="Digite o nome da empresa"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="bg-white text-black dark:bg-neutral-800 dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium text-black dark:text-white"
            >
              Descrição
              <span className="text-xs text-neutral-400">(opcional)</span>
            </label>
            <Input
              id="description"
              placeholder="Digite a descrição"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white text-black dark:bg-neutral-800 dark:text-white"
            />
          </div>
          <Button type="submit" className="w-full">
            <Download className="h-5 w-5" />
            Exportar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
