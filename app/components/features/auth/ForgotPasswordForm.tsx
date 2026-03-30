import React, { useState, useEffect } from "react";
import toast from "~/components/ui/toast-client";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "~/components/ui/form";
import { ArrowLeft } from "lucide-react";
import type {
  ForgotPasswordFormProps,
  ForgotPasswordFormValues,
} from "~/types/components";

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  form,
  onBackToLogin,
}) => {
  const [emailSent, setEmailSent] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (emailSent && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setCanResend(true);
    }
  }, [emailSent, timer]);

  const sendForgotPasswordRequest = async (email: string) => {
    const payload = new FormData();
    payload.set("email", email);

    const response = await fetch("/api/password-forgot", {
      method: "POST",
      body: payload,
      credentials: "same-origin",
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(data?.error || "Erro ao enviar e-mail de recuperação.");
    }
  };

  const handleSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      await sendForgotPasswordRequest(values.email);
      setEmailSent(true);
      setTimer(30);
      setCanResend(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao enviar e-mail de recuperação.";
      toast.error(message);
    }
  };

  const handleResend = async () => {
    try {
      await sendForgotPasswordRequest(form.getValues().email);
      setTimer(30);
      setCanResend(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao reenviar e-mail de recuperação.";
      toast.error(message);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="w-full flex flex-col gap-4 pt-12 px-8 pb-0"
      >
        <div className="flex flex-col items-center mb-10">
          <img
            src="/logo-santomimo.png"
            alt="Logo"
            className="rounded-lg max-w-40"
          />
        </div>
        {!emailSent ? (
          <>
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl text-gray-900">Esqueceu sua senha?</h2>
              <p className="text-xs text-gray-600 max-w-xs">
                Digite seu e-mail abaixo para que sejam enviadas as intruções
                para redefinição de sua senha.
              </p>
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
            <Button type="submit" size="lg" className="bg-gray-900 text-white">
              Enviar
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-gray-900 text-center max-w-xs">
              Um link foi enviado para seu e-mail caso ele esteja cadastrado.
              Siga as instruções para redefinir sua senha.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">
                Não recebeu o e-mail?
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResend}
                disabled={!canResend}
                className="text-gray-900"
              >
                Enviar novamente
              </Button>
              {!canResend && (
                <span className="text-xs text-gray-500">({timer}s)</span>
              )}
            </div>
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          className="flex items-center gap-2 justify-center text-gray-900"
          onClick={onBackToLogin}
        >
          <ArrowLeft size={18} />
          Voltar para o login
        </Button>
      </form>
    </Form>
  );
};
