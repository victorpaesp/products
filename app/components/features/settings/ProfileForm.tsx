import { Input } from "~/components/ui/input";
import { PhoneInput } from "~/components/ui/phone-input";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { useState, useEffect, useRef } from "react";
import { useRevalidator, useSubmit, useOutletContext } from "@remix-run/react";
import { useQueryClient } from "@tanstack/react-query";
import { PasswordChecklist } from "~/components/shared/PasswordChecklist";
import { PasswordInput } from "~/components/ui/password-input";
import toast from "react-hot-toast";
import { Pencil, Save } from "lucide-react";
import { formatPhoneNumber } from "~/lib/utils";
import { usePasswordValidation } from "~/components/features/auth/hooks/usePasswordValidation";
import type { ProfileFormProps } from "~/types/components";
import {
  useUpdatePasswordMutation,
  useUpdateProfileMutation,
} from "~/hooks/useSettings";
import { usersQueryKeys } from "~/hooks/useUsers";
import type { ProductsOutletContextType } from "~/types/routes";

export function ProfileForm({ currentUser, isAdmin }: ProfileFormProps) {
  const submit = useSubmit();
  const revalidator = useRevalidator();
  const queryClient = useQueryClient();
  const { clearSelectedProducts } =
    useOutletContext<ProductsOutletContextType>();
  const profileMutation = useUpdateProfileMutation();
  const passwordMutation = useUpdatePasswordMutation();
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [editing, setEditing] = useState(false);
  const getUserInitials = (name?: string): string => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };
  const [form, setForm] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: formatPhoneNumber(currentUser.phone || ""),
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const { allValid: isPasswordValid } = usePasswordValidation(
    newPassword,
    confirmPassword,
  );

  const saving = profileMutation.isPending;
  const changingPassword = passwordMutation.isPending;

  const handleLogout = () => {
    clearSelectedProducts();
    sessionStorage.clear();
    submit(null, { method: "post", action: "/logout" });
  };

  useEffect(() => {
    setForm({
      name: currentUser.name,
      email: currentUser.email,
      phone: formatPhoneNumber(currentUser.phone || ""),
    });
  }, [currentUser.email, currentUser.name, currentUser.phone]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await profileMutation.mutateAsync({
        name: form.name,
        email: form.email,
        phone: form.phone,
      });

      if (response.user) {
        setForm({
          name: response.user.name,
          email: response.user.email,
          phone: formatPhoneNumber(response.user.phone || ""),
        });
      }

      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("users-table-page")) {
          sessionStorage.removeItem(key);
        }
      });

      void queryClient.invalidateQueries({ queryKey: usersQueryKeys.lists() });
      revalidator.revalidate();

      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao atualizar perfil.";
      toast.error(message);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    if (!isPasswordValid) {
      setPasswordError("A senha não atende todos os requisitos.");
      return;
    }

    try {
      await passwordMutation.mutateAsync({
        password: newPassword,
      });

      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
      const toastId = "logout-timer";
      let seconds = 10;
      const updateToast = () => {
        toast.success(
          `Senha alterada com sucesso! Você será deslogado para autenticação com a nova senha em ${seconds} segundos.`,
          {
            id: toastId,
          },
        );
      };
      updateToast();
      if (logoutTimeoutRef.current) clearInterval(logoutTimeoutRef.current);
      logoutTimeoutRef.current = setInterval(() => {
        seconds--;
        if (seconds <= 0) {
          clearInterval(logoutTimeoutRef.current!);
          handleLogout();
        } else {
          updateToast();
        }
      }, 1000);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao alterar senha.";
      toast.error(message);
      setPasswordError(message);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setForm({
      name: currentUser.name,
      email: currentUser.email,
      phone: formatPhoneNumber(currentUser.phone || ""),
    });
  };

  return (
    <div>
      <div className="flex w-full flex-col gap-6">
        <div>
          <h2 className="mb-1 text-2xl font-bold">Meu Perfil</h2>
          <p className="text-muted-foreground text-sm">
            Gerencie e atualize seus dados de conta e informações de login.
          </p>
        </div>
        <div className="rounded-lg bg-white px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-20 items-center justify-center rounded-full border border-neutral-200 bg-white text-3xl font-medium text-neutral-700">
                {getUserInitials(currentUser?.name)}
              </div>
              <div>
                <h3 className="text-lg font-medium">{form.name}</h3>
                <p className="text-muted-foreground text-sm">{form.email}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative flex flex-col gap-3 rounded-lg bg-white px-8 py-6">
          <div className="flex w-full justify-between border-b border-neutral-200 pb-3">
            <span className="text-lg font-medium text-neutral-900">
              Informações básicas
            </span>
            <div>
              {!editing ? (
                <Button size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                    Cancelar
                  </Button>
                  <Button size="sm" form="profile-form" type="submit">
                    <Save className="h-4 w-4" />
                    Salvar
                  </Button>
                </div>
              )}
            </div>
          </div>

          <form
            id="profile-form"
            onSubmit={editing ? handleSubmit : undefined}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            <div className="flex flex-col gap-1">
              <label className="block text-sm text-neutral-600">Nome</label>
              {editing ? (
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              ) : (
                <div className="font-medium text-neutral-900">{form.name}</div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="block text-sm text-neutral-600">Email</label>
              {editing ? (
                <Input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              ) : (
                <div className="font-medium text-neutral-900">{form.email}</div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="block text-sm text-neutral-600">Telefone</label>
              {editing ? (
                <PhoneInput
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                />
              ) : (
                <div className="font-medium text-neutral-900">{form.phone}</div>
              )}
            </div>
            <div className="flex flex-col items-start gap-2">
              <label className="block text-sm text-neutral-600">
                Tipo do usuário
              </label>
              <Badge
                variant="default"
                className={
                  currentUser.role === "admin" ? "bg-primary" : "bg-neutral-300"
                }
              >
                {currentUser.role === "admin" ? "Administrador" : "Padrão"}
              </Badge>
            </div>
          </form>
        </div>
      </div>
      <div>
        <div className="my-8 border-t" />
        <div className="rounded-lg bg-white px-8 py-6">
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <h3 className="mb-2 text-lg font-semibold">Redefinir Senha</h3>
            <div>
              <PasswordInput
                label="Nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <PasswordInput
                label="Repetir nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <PasswordChecklist
              password={newPassword}
              confirmPassword={confirmPassword}
            />
            {passwordError && (
              <div className="text-sm text-red-500">{passwordError}</div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={changingPassword || !isPasswordValid}
            >
              <Save className="h-4 w-4" />
              {changingPassword ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </div>
      </div>
      <div className="my-8 border-t" />
      <Button variant="destructive" className="" onClick={handleLogout}>
        Sair
      </Button>
    </div>
  );
}
