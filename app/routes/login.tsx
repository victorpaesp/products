import React from "react";
import { login as apiLogin } from "../lib/auth";
import { useNavigate, Link } from "@remix-run/react";
import { z } from "zod";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "~/components/ui/input";
import { PasswordInput } from "~/components/ui/password-input";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "~/components/ui/form";
import {
  ForgotPasswordForm,
  ForgotPasswordFormValues,
} from "../components/ForgotPasswordForm";
import type { FormValues } from "../types";
import { LoaderFunctionArgs, redirect } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader
    ?.split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (token) return redirect("/");

  return null;
}

export default function Login() {
  const [isForgotPassword, setIsForgotPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = React.useState(true);
  const navigate = useNavigate();
  React.useEffect(() => {
    setIsPageLoading(false);
  }, []);

  const loginSchema = z.object({
    email: z.string().email({ message: "Email inválido." }),
    password: z.string().min(1, { message: "Senha é obrigatória." }),
  });

  const form: UseFormReturn<FormValues> = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);

    try {
      setLoginError(null);
      const result = await apiLogin(values.email, values.password);
      if (result) {
        navigate("/");
      } else {
        setLoginError("Email ou senha inválidos.");
      }
    } catch (error: any) {
      console.error("Erro na autenticação:", error);
      if (error.response?.data?.message) {
        setLoginError(error.response.data.message);
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        setLoginError(errors[Object.keys(errors)[0]][0]);
      } else {
        setLoginError("Erro no login.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(
      z.object({ email: z.string().email({ message: "Email inválido." }) })
    ),
    defaultValues: { email: "" },
  });

  function onForgotPasswordSubmit(values: ForgotPasswordFormValues) {
    console.log("Forgot Password");
  }

  return (
    <div className="relative flex min-h-screen bg-transparent">
      <div className="relative z-10 w-full md:w-[50%] mr-auto flex items-center justify-center bg-white rounded-none md:rounded-e-3xl">
        {isForgotPassword ? (
          <div className="flex flex-col">
            <ForgotPasswordForm
              onSubmit={onForgotPasswordSubmit}
              form={forgotPasswordForm}
              onBackToLogin={() => {
                setIsForgotPassword(false);
                forgotPasswordForm.reset();
              }}
            />
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="w-full max-w-md flex flex-col gap-4 p-12"
            >
              <div className="flex flex-col">
                <div className="flex justify-center mb-14">
                  <img src="/logo-document.jpg" alt="Logo" />
                </div>

                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl text-gray-900">Iniciar sessão</h2>
                  <p className="text-xs text-gray-600 max-w-xs">
                    Faça o login para acessar a plataforma
                  </p>
                </div>
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Email" type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <PasswordInput placeholder="Senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                className="self-end"
                onClick={() => {
                  setIsForgotPassword(true);
                  form.clearErrors();
                }}
              >
                Esqueci minha senha
              </Button>
              {loginError && (
                <div className="text-red-600 text-sm mb-2">{loginError}</div>
              )}
              <Button
                type="submit"
                size={"lg"}
                className={`bg-gray-900 text-white`}
                disabled={isSubmitting || isPageLoading}
              >
                {isSubmitting ? "Entrando..." : "Login"}
              </Button>
              <div className="text-center text-sm text-gray-600">
                Não tem uma conta ainda?{" "}
                <Link
                  to="/register"
                  className="text-gray-900 font-medium hover:underline"
                >
                  Criar conta
                </Link>
              </div>
            </form>
          </Form>
        )}
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
