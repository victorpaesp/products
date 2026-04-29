import { useState, useEffect } from "react";
import {
  useActionData,
  useNavigate,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
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
import { PasswordChecklist } from "~/components/shared/PasswordChecklist";
import { usePasswordValidation } from "~/components/features/auth/hooks/usePasswordValidation";
import { toast } from "sonner";
import { ActionFunctionArgs, data } from "@remix-run/node";
import { backendResetPassword, BackendApiError } from "~/lib/backend.server";
import type { ResetPasswordActionData } from "~/types/routes";

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

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const password = String(formData.get("password") || "");
  const passwordConfirmation = String(
    formData.get("password_confirmation") || "",
  );

  const url = new URL(request.url);
  const email = decodeURIComponent(url.searchParams.get("email") || "");
  const token = decodeURIComponent(url.searchParams.get("token") || "");

  if (!email || !token) {
    return data<ResetPasswordActionData>(
      { error: "Link de redefinição inválido." },
      { status: 400 },
    );
  }

  const parsed = schema.safeParse({
    password,
    password_confirmation: passwordConfirmation,
  });

  if (!parsed.success) {
    return data<ResetPasswordActionData>(
      { error: parsed.error.issues[0]?.message || "Dados inválidos." },
      { status: 400 },
    );
  }

  try {
    await backendResetPassword({
      email,
      token,
      password: parsed.data.password,
      password_confirmation: parsed.data.password_confirmation,
    });

    return data<ResetPasswordActionData>({ ok: true });
  } catch (error) {
    if (error instanceof BackendApiError) {
      return data<ResetPasswordActionData>(
        { error: "Erro ao redefinir senha." },
        { status: error.status },
      );
    }

    return data<ResetPasswordActionData>(
      { error: "Erro ao redefinir senha." },
      { status: 500 },
    );
  }
}

export default function ResetPassword() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const isSubmitting = navigation.state === "submitting";

  const email = decodeURIComponent(searchParams.get("email") || "");
  const token = decodeURIComponent(searchParams.get("token") || "");

  useEffect(() => {
    if (!email || !token) {
      navigate("/login", { replace: true });
    }
  }, [email, token, navigate]);

  useEffect(() => {
    if (!actionData) return;
    if (actionData.ok) {
      setSuccess(true);
      return;
    }
    if (actionData.error) {
      toast.error(actionData.error);
    }
  }, [actionData]);

  const form: UseFormReturn<FormValues> = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      password_confirmation: "",
    },
  });
  const { allValid: checklistSatisfied } = usePasswordValidation(
    form.watch("password"),
    form.watch("password_confirmation"),
  );

  async function onSubmit(values: FormValues) {
    submit(
      {
        password: values.password,
        password_confirmation: values.password_confirmation,
      },
      { method: "post" },
    );
  }

  return (
    <div className="relative flex min-h-screen bg-transparent">
      <div className="relative z-10 mr-auto flex w-full items-center justify-center rounded-none bg-[#f7f7f7] md:w-[50%] md:rounded-e-3xl">
        <div className="flex w-full max-w-md flex-col gap-4 p-12">
          <div className="flex flex-col">
            <div className="mb-14 flex justify-center">
              <img
                src="/logo-santomimo.png"
                alt="Logo"
                className="max-w-40 rounded-lg"
              />
            </div>
            {!success && (
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl text-gray-900">Redefinir senha</h2>
                <p className="max-w-xs text-xs text-gray-600">
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
