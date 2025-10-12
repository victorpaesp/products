import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { PasswordInput } from "~/components/ui/password-input";
import { PasswordChecklist } from "./PasswordChecklist";
import { api } from "~/lib/axios";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateUserDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    repeatPassword: "",
  });
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      preferred_contact_method: "email",
    };

    try {
      await api.post("/users", userData);
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        repeatPassword: "",
      });
      setIsPasswordValid(false);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      alert("Erro ao criar usuário.");
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        repeatPassword: "",
      });
      setIsPasswordValid(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogTitle>Criar novo usuário</DialogTitle>
        <DialogDescription>
          Preencha os dados para criar um novo usuário.
        </DialogDescription>
        <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              autoComplete="off"
              readOnly
              onFocus={(e) => e.currentTarget.removeAttribute("readonly")}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              autoComplete="off"
              readOnly
              onFocus={(e) => e.currentTarget.removeAttribute("readonly")}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefone</label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              autoComplete="off"
              readOnly
              onFocus={(e) => e.currentTarget.removeAttribute("readonly")}
              maxLength={20}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Senha</label>
            <PasswordInput
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              autoComplete="off"
              readOnly
              onFocus={(e) => e.currentTarget.removeAttribute("readonly")}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Repetir Senha
            </label>
            <PasswordInput
              id="repeatPassword"
              name="repeatPassword"
              value={formData.repeatPassword}
              onChange={handleInputChange}
              autoComplete="off"
              readOnly
              onFocus={(e) => e.currentTarget.removeAttribute("readonly")}
              required
            />
          </div>
          <PasswordChecklist
            password={formData.password}
            confirmPassword={formData.repeatPassword}
            onValidChange={setIsPasswordValid}
          />
          <Button type="submit" className="w-full" disabled={!isPasswordValid}>
            Criar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
