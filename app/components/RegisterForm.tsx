import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "~/components/ui/input";
import { PasswordInput } from "~/components/ui/password-input";
import { Button } from "~/components/ui/button";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "~/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { PasswordChecklist } from "./PasswordChecklist";
import type { FormValues } from "~/types";

interface RegisterFormProps {
  onSubmit: (values: FormValues) => void;
  isPasswordValid: boolean;
  setIsPasswordValid: (valid: boolean) => void;
  form: UseFormReturn<FormValues>;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  isPasswordValid,
  setIsPasswordValid,
  form,
}) => {
  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="w-full flex flex-col gap-4 pt-12 px-8 pb-0"
    >
      <div className="flex flex-col">
        <div className="flex justify-center mb-14">
          <img src="/logo-document.jpg" alt="Logo" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl text-gray-900">Registrar</h2>
          <p className="text-xs text-gray-600 max-w-xs">
            Crie sua conta para começar a usar a plataforma
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Nome completo *" type="text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cpf_cnpj"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="CPF/CNPJ *" type="text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input placeholder="Telefone" type="tel" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="preferred_contact_method"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Método de contato preferido *" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="phone">Telefone</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
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
      <FormField
        control={form.control}
        name="repeatPassword"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <PasswordInput placeholder="Repetir senha" {...field} />
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
      <Button
        type="submit"
        size={"lg"}
        className={`bg-gray-900 text-white`}
        disabled={!isPasswordValid}
      >
        Registrar
      </Button>
    </form>
  );
};
