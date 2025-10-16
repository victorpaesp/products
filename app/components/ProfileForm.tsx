import { useAuth } from "~/hooks/useAuth";
import { Input } from "~/components/ui/input";
import { PhoneInput } from "~/components/ui/phone-input";
import { Button } from "~/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { api } from "~/lib/axios";
import { PasswordChecklist } from "./PasswordChecklist";
import { PasswordInput } from "~/components/ui/password-input";
import toast from "~/components/ui/toast-client";
import { formatPhoneNumber, unformatPhoneNumber } from "~/lib/utils";

export function ProfileForm() {
  const { logout, isAdmin } = useAuth();
  const [logoutTimer, setLogoutTimer] = useState<number>(10);
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  useEffect(() => {
    const cachedUser = localStorage.getItem("user");
    if (cachedUser) {
      try {
        const data = JSON.parse(cachedUser);
        setForm({
          name: data.name || "",
          email: data.email || "",
          phone: formatPhoneNumber(data.phone || ""),
        });
        return;
      } catch (e) {
        console.error("Erro", e);
      }
    }
    async function fetchMe() {
      try {
        const res = await api.get("/me");
        const data = res.data;
        setForm({
          name: data.name || "",
          email: data.email || "",
          phone: formatPhoneNumber(data.phone || ""),
        });
        localStorage.setItem("user", JSON.stringify(data));
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
      }
    }
    fetchMe();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const currentUser = await api.get("/me");
      const userId = currentUser.data.id;
      const payload = {
        ...form,
        phone: unformatPhoneNumber(form.phone),
      };
      await api.put(`/users/${userId}`, payload);
      const res = await api.get("/me");
      const data = res.data;
      setForm({
        name: data.name || "",
        email: data.email || "",
        phone: formatPhoneNumber(data.phone || ""),
      });
      localStorage.setItem("user", JSON.stringify(data));
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("users-table-page")) {
          sessionStorage.removeItem(key);
        }
      });
      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Erro ao atualizar perfil.", {
        description: "Algo deu errado. Tente novamente mais tarde.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordError("");
    if (!isPasswordValid) {
      setPasswordError("A senha não atende todos os requisitos.");
      setChangingPassword(false);
      return;
    }
    try {
      const currentUser = await api.get("/me");
      const userId = currentUser.data.id;
      await api.put(`/users/${userId}`, { password: newPassword });
      setNewPassword("");
      setConfirmPassword("");
      setIsPasswordValid(false);
      setPasswordError("");
      setLogoutTimer(10);
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
          logout();
        } else {
          updateToast();
        }
      }, 1000);
    } catch (err) {
      toast.error("Erro ao alterar senha.", {
        description: `Algo deu errado ao alterar senha, tente novamente mais tarde.`,
      });
      setPasswordError("Erro ao alterar senha.");
    }
    setChangingPassword(false);
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
                onValidChange={setIsPasswordValid}
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
      <Button variant="destructive" className="" onClick={logout}>
        Sair
      </Button>
    </div>
  );
}
