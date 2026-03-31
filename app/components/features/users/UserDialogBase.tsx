import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { PhoneInput } from "~/components/ui/phone-input";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { PasswordInput } from "~/components/ui/password-input";
import { PasswordChecklist } from "~/components/shared/PasswordChecklist";
import { usePasswordValidation } from "~/components/features/auth/hooks/usePasswordValidation";
import toast from "~/components/ui/toast-client";
import { formatPhoneNumber, unformatPhoneNumber } from "~/lib/utils";
import type { UsersTableUser } from "~/types/components";
import { useCreateOrUpdateUserMutation } from "~/hooks/useUsers";

type UserDialogMode = "create" | "edit";

type UserDialogBaseProps = {
  mode: UserDialogMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  user?: UsersTableUser | null;
};

type UserFormState = {
  name: string;
  email: string;
  phone: string;
  password: string;
  repeatPassword: string;
  role: "admin" | "user";
};

const createInitialState = (): UserFormState => ({
  name: "",
  email: "",
  phone: "",
  password: "",
  repeatPassword: "",
  role: "user",
});

export function UserDialogBase({
  mode,
  open,
  onOpenChange,
  onSuccess,
  user,
}: UserDialogBaseProps) {
  const [formData, setFormData] = useState<UserFormState>(createInitialState());
  const isCreateMode = mode === "create";
  const upsertUserMutation = useCreateOrUpdateUserMutation();

  const { allValid: isPasswordValid } = usePasswordValidation(
    formData.password,
    formData.repeatPassword,
  );

  useEffect(() => {
    if (!open) return;

    if (isCreateMode) {
      setFormData(createInitialState());
      return;
    }

    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: formatPhoneNumber(user?.phone || ""),
      password: "",
      repeatPassword: "",
      role: user?.role || "user",
    });
  }, [isCreateMode, open, user]);

  const title = useMemo(
    () => (isCreateMode ? "Criar novo usuário" : "Editar usuário"),
    [isCreateMode],
  );

  const description = useMemo(
    () =>
      isCreateMode
        ? "Preencha os dados para criar um novo usuário."
        : "Atualize os dados do usuário abaixo.",
    [isCreateMode],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: "admin" | "user") => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const resetForm = () => {
    setFormData(createInitialState());
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isCreateMode && !user?.id) return;
    if (isCreateMode && !isPasswordValid) return;

    const payload: Record<string, unknown> = {
      name: formData.name,
      email: formData.email,
      phone: unformatPhoneNumber(formData.phone),
      role: formData.role || "user",
    };

    if (isCreateMode) {
      payload.password = formData.password;
      payload.preferred_contact_method = "email";
    }

    try {
      await upsertUserMutation.mutateAsync({
        userId: isCreateMode ? undefined : user?.id,
        body: payload,
      });

      handleClose(false);
      onSuccess();
      toast.success(
        isCreateMode
          ? "Usuário criado com sucesso!"
          : "Usuário atualizado com sucesso!",
      );
    } catch {
      toast.error(
        isCreateMode
          ? "Não foi possível criar usuário."
          : "Não foi possível atualizar o usuário.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              autoComplete="off"
              readOnly={isCreateMode}
              onFocus={(e) => {
                if (isCreateMode) {
                  e.currentTarget.removeAttribute("readonly");
                }
              }}
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
              readOnly={isCreateMode}
              onFocus={(e) => {
                if (isCreateMode) {
                  e.currentTarget.removeAttribute("readonly");
                }
              }}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Tipo de usuário
            </label>
            <Select value={formData.role} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-full" id="role" name="role">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefone</label>
            <PhoneInput
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              autoComplete="off"
              readOnly={isCreateMode}
              onFocus={(e) => {
                if (isCreateMode) {
                  e.currentTarget.removeAttribute("readonly");
                }
              }}
            />
          </div>

          {isCreateMode ? (
            <>
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
              />
            </>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            disabled={
              (isCreateMode && !isPasswordValid) || upsertUserMutation.isPending
            }
          >
            {upsertUserMutation.isPending
              ? "Salvando..."
              : isCreateMode
              ? "Criar"
              : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
