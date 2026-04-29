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
import { useForgotPasswordMutation } from "~/hooks/useForgotPassword";

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  form,
  onBackToLogin,
}) => {
  const forgotPasswordMutation = useForgotPasswordMutation();
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

  const handleSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      await forgotPasswordMutation.mutateAsync({ email: values.email });
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
      await forgotPasswordMutation.mutateAsync({
        email: form.getValues().email,
      });
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
        className="flex w-full flex-col gap-4 px-8 pt-12 pb-0"
      >
        <div className="mb-10 flex flex-col items-center">
          <img
            src="/logo-santomimo.png"
            alt="Logo"
            className="max-w-40 rounded-lg"
          />
        </div>
        {!emailSent ? (
          <>
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl text-gray-900">Esqueceu sua senha?</h2>
              <p className="max-w-xs text-xs text-gray-600">
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
            <Button type="submit" size="lg">
              {forgotPasswordMutation.isPending ? "Enviando..." : "Enviar"}
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <p className="max-w-xs text-center text-sm text-gray-900">
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
                disabled={!canResend || forgotPasswordMutation.isPending}
                className="text-gray-900"
              >
                {forgotPasswordMutation.isPending
                  ? "Enviando..."
                  : "Enviar novamente"}
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
          className="flex items-center justify-center gap-2 text-gray-900"
          onClick={onBackToLogin}
        >
          <ArrowLeft size={18} />
          Voltar para o login
        </Button>
      </form>
    </Form>
  );
};
