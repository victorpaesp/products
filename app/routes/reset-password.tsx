import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "@remix-run/react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../components/ui/input";
import { PasswordInput } from "../components/ui/password-input";
import { Button } from "../components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "../components/ui/form";
import { PasswordChecklist } from "../components/PasswordChecklist";
import { toast } from "sonner";
import { api } from "../lib/axios";

const schema = z
  .object({
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "As senhas não coincidem.",
    path: ["password_confirmation"],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  useEffect(() => {
    if (!email || !token) {
      navigate("/login", { replace: true });
    }
  }, [email, token, navigate]);

  const form: UseFormReturn<FormValues> = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      password_confirmation: "",
    },
  });

  const [checklistSatisfied, setChecklistSatisfied] = useState(false);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      await api.post("password/reset", {
        email,
        token,
        password: values.password,
        password_confirmation: values.password_confirmation,
      });
      setSuccess(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao redefinir senha.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen bg-transparent">
      <div className="relative z-10 w-full md:w-[50%] mr-auto flex items-center justify-center bg-white rounded-none md:rounded-e-3xl">
        <div className="w-full max-w-md flex flex-col gap-4 p-12">
          <div className="flex flex-col">
            <div className="flex justify-center mb-14">
              <img src="/logo-document.jpg" alt="Logo" />
            </div>
            {!success && (
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl text-gray-900">Redefinir senha</h2>
                <p className="text-xs text-gray-600 max-w-xs">
                  Digite sua nova senha abaixo
                </p>
              </div>
            )}
          </div>
          {!success ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <PasswordInput placeholder="Nova senha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password_confirmation"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <PasswordInput
                          placeholder="Confirmar nova senha"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <PasswordChecklist
                  password={form.watch("password")}
                  confirmPassword={form.watch("password_confirmation")}
                  onValidChange={setChecklistSatisfied}
                />
                <Button
                  type="submit"
                  size="lg"
                  className="bg-gray-900 text-white"
                  disabled={!checklistSatisfied || isSubmitting}
                >
                  {isSubmitting ? "Redefinindo..." : "Redefinir senha"}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-lg">Senha redefinida com sucesso!</h3>
              <Button
                size="lg"
                className="bg-gray-900 text-white"
                onClick={() => navigate("/login")}
              >
                Ir para o login
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="absolute right-0 top-0 h-full w-[55%] z-0 hidden md:block">
        <img
          src="/william-koo-J-n31HMBjYE-unsplash.jpg"
          alt="Fundo"
          className="object-cover h-full w-full"
        />
      </div>
    </div>
  );
}
