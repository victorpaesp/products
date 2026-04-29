import React from "react";
import {
  Link,
  useActionData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "~/components/ui/input";
import { PhoneInput } from "~/components/ui/phone-input";
import { PasswordInput } from "~/components/ui/password-input";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "~/components/ui/form";
import { PasswordChecklist } from "~/components/shared/PasswordChecklist";
import { usePasswordValidation } from "~/components/features/auth/hooks/usePasswordValidation";
import { ActionFunctionArgs, data, LoaderFunctionArgs } from "@remix-run/node";
import { unformatPhoneNumber } from "~/lib/utils";
import {
  backendCurrentUser,
  backendLogin,
  backendRegister,
  BackendApiError,
} from "~/lib/backend.server";
import { createUserSession, redirectIfAuthenticated } from "~/lib/auth.server";
import type { RegisterActionData } from "~/types/routes";

const registerSchema = z
  .object({
    name: z.string().min(1, { message: "Nome é obrigatório." }),
    email: z.string().email({ message: "Email inválido." }),
    phone: z.string().min(1, { message: "Telefone é obrigatório." }),
    password: z
      .string()
      .min(6, { message: "Senha deve ter no mínimo 6 caracteres." }),
    repeatPassword: z.string().min(1, { message: "Confirme sua senha." }),
  })
  .refine((data) => data.password === data.repeatPassword, {
    message: "As senhas não coincidem.",
    path: ["repeatPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export async function loader({ request }: LoaderFunctionArgs) {
  await redirectIfAuthenticated(request);
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const name = String(formData.get("name") || "");
  const email = String(formData.get("email") || "");
  const phone = String(formData.get("phone") || "");
  const password = String(formData.get("password") || "");
  const repeatPassword = String(formData.get("repeatPassword") || "");

  const parsed = registerSchema.safeParse({
    name,
    email,
    phone,
    password,
    repeatPassword,
  });

  if (!parsed.success) {
    return data<RegisterActionData>(
      { error: parsed.error.issues[0]?.message || "Dados inválidos." },
      { status: 400 },
    );
  }

  try {
    await backendRegister({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: unformatPhoneNumber(parsed.data.phone),
      password: parsed.data.password,
      preferred_contact_method: "email",
    });

    const loginResponse = await backendLogin(
      parsed.data.email,
      parsed.data.password,
    );
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
    if (error instanceof BackendApiError && error.status === 422) {
      return data<RegisterActionData>(
        { error: "Dados inválidos para cadastro." },
        { status: 422 },
      );
    }

    return data<RegisterActionData>(
      { error: "Erro ao criar conta." },
      { status: 500 },
    );
  }
}

export default function Register() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const [registerError, setRegisterError] = React.useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = React.useState(true);

  const isSubmitting = navigation.state === "submitting";

  React.useEffect(() => {
    setIsPageLoading(false);
  }, []);

  React.useEffect(() => {
    if (actionData?.error) {
      setRegisterError(actionData.error);
    }
  }, [actionData]);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      repeatPassword: "",
    },
  });

  const { allValid: isPasswordValid } = usePasswordValidation(
    form.watch("password"),
    form.watch("repeatPassword"),
  );

  async function onSubmit(values: RegisterFormValues) {
    setRegisterError(null);
    submit(
      {
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        repeatPassword: values.repeatPassword,
      },
      { method: "post" },
    );
  }

  return (
    <div className="relative flex min-h-screen bg-transparent">
      <div className="relative z-10 mr-auto flex w-full items-center justify-center rounded-none bg-[#f7f7f7] md:w-[50%] md:rounded-e-3xl">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex w-full max-w-md flex-col gap-4 p-12"
            autoComplete="off"
          >
            <div className="flex flex-col">
              <div className="mb-14 flex justify-center">
                <img
                  src="/logo-santomimo.png"
                  alt="Logo"
                  className="max-w-40 rounded-lg"
                />
              </div>

              <div className="flex flex-col gap-1">
                <h2 className="text-2xl text-gray-900">Criar conta</h2>
                <p className="max-w-xs text-xs text-gray-600">
                  Preencha os dados para criar sua conta
                </p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Nome completo"
                      type="text"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Email"
                      type="email"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PhoneInput
                      placeholder="Telefone"
                      autoComplete="off"
                      {...field}
                    />
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
                    <PasswordInput
                      placeholder="Senha"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="repeatPassword"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PasswordInput
                      placeholder="Confirmar senha"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <PasswordChecklist
              password={form.watch("password")}
              confirmPassword={form.watch("repeatPassword")}
            />

            {(registerError || actionData?.error) && (
              <div className="mb-2 text-sm text-red-600">
                {registerError || actionData?.error}
              </div>
            )}

            <Button
              type="submit"
              size={"lg"}
              disabled={!isPasswordValid || isSubmitting || isPageLoading}
            >
              {isSubmitting ? "Criando conta..." : "Criar conta"}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Já tem uma conta?{" "}
              <Link
                to="/login"
                className="font-medium text-gray-900 hover:underline"
              >
                Fazer login
              </Link>
            </div>
          </form>
        </Form>
      </div>

      <div className="absolute top-0 right-0 z-0 hidden h-full w-[55%] md:block">
        <img
          src="/william-koo-J-n31HMBjYE-unsplash.jpg"
          alt="Fundo"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
