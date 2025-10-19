import React from "react";
import { registerUser } from "../lib/auth";
import { useNavigate, Link } from "@remix-run/react";
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
import { PasswordChecklist } from "../components/PasswordChecklist";
import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { unformatPhoneNumber } from "~/lib/utils";

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
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader
    ?.split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (token) return redirect("/");

  return null;
}

export default function Register() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [registerError, setRegisterError] = React.useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = React.useState(true);
  const [isPasswordValid, setIsPasswordValid] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    setIsPageLoading(false);
  }, []);

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

  async function onSubmit(values: RegisterFormValues) {
    setIsSubmitting(true);

    try {
      setRegisterError(null);
      const normalizedPhone = values.phone
        ? unformatPhoneNumber(values.phone)
        : "";
      const result = await registerUser({
        name: values.name,
        email: values.email,
        phone: normalizedPhone,
        password: values.password,
      });

      if (result) {
        navigate("/");
      } else {
        setRegisterError("Erro ao criar conta.");
      }
    } catch (error: any) {
      console.error("Erro no registro:", error);
      if (error.response?.data?.message) {
        setRegisterError(error.response.data.message);
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        setRegisterError(errors[Object.keys(errors)[0]][0]);
      } else {
        setRegisterError("Erro ao criar conta.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen bg-transparent">
      <div className="relative z-10 w-full md:w-[50%] mr-auto flex items-center justify-center bg-white rounded-none md:rounded-e-3xl">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full max-w-md flex flex-col gap-4 p-12"
            autoComplete="off"
          >
            <div className="flex flex-col">
              <div className="flex justify-center mb-14">
                <img src="/logo-document.jpg" alt="Logo" />
              </div>

              <div className="flex flex-col gap-1">
                <h2 className="text-2xl text-gray-900">Criar conta</h2>
                <p className="text-xs text-gray-600 max-w-xs">
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
              onValidChange={setIsPasswordValid}
            />

            {registerError && (
              <div className="text-red-600 text-sm mb-2">{registerError}</div>
            )}

            <Button
              type="submit"
              size={"lg"}
              className={`bg-gray-900 text-white`}
              disabled={!isPasswordValid || isSubmitting || isPageLoading}
            >
              {isSubmitting ? "Criando conta..." : "Criar conta"}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Já tem uma conta?{" "}
              <Link
                to="/login"
                className="text-gray-900 font-medium hover:underline"
              >
                Fazer login
              </Link>
            </div>
          </form>
        </Form>
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
