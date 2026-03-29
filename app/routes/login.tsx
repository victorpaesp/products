import React from "react";
import {
  Link,
  useActionData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
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
import { ForgotPasswordForm } from "../components/ForgotPasswordForm";
import type { FormValues } from "../types";
import { ActionFunctionArgs, data, LoaderFunctionArgs } from "@remix-run/node";
import {
  backendCurrentUser,
  backendLogin,
  BackendApiError,
} from "~/lib/backend.server";
import { createUserSession, redirectIfAuthenticated } from "~/lib/auth.server";
import type { ForgotPasswordFormValues } from "~/types/components";
import type { LoginActionData } from "~/types/routes";

const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido." }),
  password: z.string().min(1, { message: "Senha é obrigatória." }),
});

export async function loader({ request }: LoaderFunctionArgs) {
  await redirectIfAuthenticated(request);
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return data<LoginActionData>(
      { error: parsed.error.issues[0]?.message || "Dados inválidos." },
      { status: 400 },
    );
  }

  try {
    const loginResponse = await backendLogin(email, password);
    const currentUser = await backendCurrentUser(loginResponse.token);

    return createUserSession({
      request,
      token: loginResponse.token,
      user: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
      },
      redirectTo: "/",
      maxAgeSeconds: loginResponse.expires_in,
    });
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 401) {
      return data<LoginActionData>(
        { error: "Email ou senha inválidos." },
        { status: 401 },
      );
    }

    return data<LoginActionData>({ error: "Erro no login." }, { status: 500 });
  }
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const [isForgotPassword, setIsForgotPassword] = React.useState(false);
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = React.useState(true);

  const isSubmitting = navigation.state === "submitting";

  React.useEffect(() => {
    setIsPageLoading(false);
  }, []);

  React.useEffect(() => {
    if (actionData?.error) {
      setLoginError(actionData.error);
    }
  }, [actionData]);

  const form: UseFormReturn<FormValues> = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setLoginError(null);
    submit(
      {
        email: values.email,
        password: values.password,
      },
      { method: "post" },
    );
  }

  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(
      z.object({ email: z.string().email({ message: "Email inválido." }) }),
    ),
    defaultValues: { email: "" },
  });

  return (
    <div className="relative flex min-h-screen bg-transparent">
      <div className="relative z-10 w-full md:w-[50%] mr-auto flex items-center justify-center bg-[#f7f7f7] rounded-none md:rounded-e-3xl">
        {isForgotPassword ? (
          <div className="flex flex-col">
            <ForgotPasswordForm
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
                  <img
                    src="/logo-santomimo.png"
                    alt="Logo"
                    className="rounded-lg max-w-40"
                  />
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
              {(loginError || actionData?.error) && (
                <div className="text-red-600 text-sm mb-2">
                  {loginError || actionData?.error}
                </div>
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
