import { Input } from "~/components/ui/input";
import { PhoneInput } from "~/components/ui/phone-input";
import { Button } from "~/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useFetcher, useSubmit } from "@remix-run/react";
import { PasswordChecklist } from "~/components/shared/PasswordChecklist";
import { PasswordInput } from "~/components/ui/password-input";
import toast from "~/components/ui/toast-client";
import { formatPhoneNumber } from "~/lib/utils";
import { usePasswordValidation } from "~/components/features/auth/hooks/usePasswordValidation";
import type { ProfileFormProps } from "~/types/components";
import type { SettingsActionData } from "~/types/routes";

export function ProfileForm({ currentUser, isAdmin }: ProfileFormProps) {
  const submit = useSubmit();
  const profileFetcher = useFetcher<SettingsActionData>();
  const passwordFetcher = useFetcher<SettingsActionData>();
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  const saving = profileFetcher.state !== "idle";
  const changingPassword = passwordFetcher.state !== "idle";

  const handleLogout = () => {
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

  useEffect(() => {
    if (profileFetcher.state !== "idle" || !profileFetcher.data) return;

    if (profileFetcher.data.error) {
      toast.error("Erro ao atualizar perfil.", {
        description: profileFetcher.data.error,
      });
      return;
    }

    if (profileFetcher.data.ok && profileFetcher.data.user) {
      setForm({
        name: profileFetcher.data.user.name,
        email: profileFetcher.data.user.email,
        phone: formatPhoneNumber(profileFetcher.data.user.phone || ""),
      });
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("users-table-page")) {
          sessionStorage.removeItem(key);
        }
      });
      toast.success("Perfil atualizado com sucesso!");
    }
  }, [profileFetcher.data, profileFetcher.state]);

  useEffect(() => {
    if (passwordFetcher.state !== "idle" || !passwordFetcher.data) return;

    if (passwordFetcher.data.error) {
      toast.error("Erro ao alterar senha.", {
        description: passwordFetcher.data.error,
      });
      setPasswordError(passwordFetcher.data.error);
      return;
    }

    if (!passwordFetcher.data.ok) return;

    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    const toastId = "logout-timer";
    let seconds = 10;
    const updateToast = () => {
      toast.success("Senha alterada com sucesso!", {
        description: `Você será deslogado para autenticação com a nova senha em ${seconds} segundos.`,
        id: toastId,
      });
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
  }, [passwordFetcher.data, passwordFetcher.state]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    profileFetcher.submit(
      {
        intent: "update-profile",
        name: form.name,
        email: form.email,
        phone: form.phone,
      },
      { method: "post", action: "/settings" },
    );
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    if (!isPasswordValid) {
      setPasswordError("A senha não atende todos os requisitos.");
      return;
    }
    passwordFetcher.submit(
      {
        intent: "update-password",
        password: newPassword,
      },
      { method: "post", action: "/settings" },
    );
  };

  return (
    <div>
      <div className="flex flex-col md:max-w-lg w-full gap-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Meu Perfil</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Gerencie e atualize seus dados de conta e informações de login.
          </p>
        </div>
        <form
          onSubmit={isAdmin ? handleSubmit : undefined}
          className="flex flex-col gap-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <Input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              readOnly={!isAdmin}
              disabled={!isAdmin}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              readOnly={!isAdmin}
              disabled={!isAdmin}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefone</label>
            <PhoneInput
              name="phone"
              value={form.phone}
              onChange={handleChange}
              readOnly={!isAdmin}
              disabled={!isAdmin}
            />
          </div>
          {isAdmin && (
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          )}
        </form>
      </div>
      {isAdmin && (
        <div>
          <div className="my-8 border-t" />
          <div className="flex flex-col md:max-w-lg w-full">
            <form
              onSubmit={handleChangePassword}
              className="flex flex-col gap-4"
            >
              <h3 className="text-lg font-semibold mb-2">Redefinir Senha</h3>
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
                <div className="text-red-500 text-sm">{passwordError}</div>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={changingPassword || !isPasswordValid}
              >
                {changingPassword ? "Salvando..." : "Salvar"}
              </Button>
            </form>
          </div>
        </div>
      )}
      <div className="my-8 border-t" />
      <Button variant="destructive" className="" onClick={handleLogout}>
        Sair
      </Button>
    </div>
  );
}
