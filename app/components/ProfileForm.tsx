import { useAuth } from "~/hooks/useAuth";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
// import { Dialog, DialogContent } from "~/components/ui/dialog";
import { useState, useEffect } from "react";
import { api } from "~/lib/axios";
// import { PasswordChecklist } from "./PasswordChecklist";
// import { PasswordInput } from "~/components/ui/password-input";

export function ProfileForm() {
  const { logout, isAdmin } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  // const [showPasswordModal, setShowPasswordModal] = useState(false);
  // const [newPassword, setNewPassword] = useState("");
  // const [confirmPassword, setConfirmPassword] = useState("");
  // const [changingPassword, setChangingPassword] = useState(false);
  // const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const cachedUser = localStorage.getItem("user");
    if (cachedUser) {
      try {
        const data = JSON.parse(cachedUser);
        setForm({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
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
          phone: data.phone || "",
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

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => setEditMode(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const currentUser = await api.get("/me");
      const userId = currentUser.data.id;

      await api.put(`/users/${userId}`, form);

      const res = await api.get("/me");
      const data = res.data;
      setForm({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
      });
      sessionStorage.setItem("profile", JSON.stringify(data));
      setEditMode(false);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
    } finally {
      setSaving(false);
    }
  };

  // const handleOpenPasswordModal = () => {
  //   setShowPasswordModal(true);
  //   setNewPassword("");
  //   setConfirmPassword("");
  //   setPasswordError("");
  // };
  // const handleClosePasswordModal = () => {
  //   setShowPasswordModal(false);
  //   setNewPassword("");
  //   setConfirmPassword("");
  //   setPasswordError("");
  // };

  // const handleChangePassword = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setChangingPassword(true);
  //   setPasswordError("");
  //   if (newPassword.length < 8) {
  //     setPasswordError("A senha deve ter pelo menos 8 caracteres.");
  //     setChangingPassword(false);
  //     return;
  //   }
  //   if (newPassword !== confirmPassword) {
  //     setPasswordError("As senhas não coincidem.");
  //     setChangingPassword(false);
  //     return;
  //   }
  //   try {
  //     const token = localStorage.getItem("token");
  //     await api.post("/password/reset", {
  //       email: form.email,
  //       password: newPassword,
  //       password_confirmation: confirmPassword,
  //       token,
  //     });
  //     setShowPasswordModal(false);
  //   } catch (err) {
  //     setPasswordError("Erro ao mudar senha.");
  //   }
  //   setChangingPassword(false);
  // };

  return (
    <div>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-2xl font-bold mb-1">Meu Perfil</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Gerencie e atualize seus dados de conta e informações de login.
          </p>
        </div>
      </div>
      <div className="flex gap-2 justify-between w-full md:max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            {!editMode ? (
              <div className="text-base text-gray-800 mb-2">
                {form.name ? form.name : "Não definido"}
              </div>
            ) : (
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            {!editMode ? (
              <div className="text-base text-gray-800 mb-2">
                {form.email ? form.email : "Não definido"}
              </div>
            ) : (
              <Input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefone</label>
            {!editMode ? (
              <div className="text-base text-gray-800 mb-2">
                {form.phone ? form.phone : "Não definido"}
              </div>
            ) : (
              <Input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                maxLength={20}
              />
            )}
          </div>
          {editMode && (
            <div className="col-span-2 flex gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleCancel}
              >
                Cancelar
              </Button>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          )}
        </form>
        {!editMode && isAdmin && (
          <Button size="sm" variant="outline" onClick={handleEdit}>
            Editar
          </Button>
        )}
      </div>

      <div className="my-8 border-t" />

      {/* <div>
        <h3 className="text-lg font-semibold mb-2">Mudar Senha</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Troque sua senha de acesso.
        </p>
        <Button variant="outline" onClick={handleOpenPasswordModal}>
          Mudar Senha
        </Button>
        <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
          {showPasswordModal && (
            <DialogContent>
              <h4 className="text-lg font-bold mb-4">Alterar Senha</h4>
              <form onSubmit={handleChangePassword} className="space-y-3">
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
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleClosePasswordModal}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={changingPassword}
                  >
                    {changingPassword ? "Mudando..." : "Salvar Senha"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          )}
        </Dialog>
      </div>

      <div className="my-8 border-t" /> */}
      <Button variant="destructive" className="" onClick={logout}>
        Sair
      </Button>
    </div>
  );
}
