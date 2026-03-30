import { useMemo } from "react";

export type PasswordRule = {
  label: string;
  validate: (password: string) => boolean;
};

export const passwordRules: PasswordRule[] = [
  {
    label: "Mínimo de 8 caracteres",
    validate: (password) => password.length >= 8,
  },
  {
    label: "Pelo menos uma letra maiúscula",
    validate: (password) => /[A-Z]/.test(password),
  },
  {
    label: "Pelo menos uma letra minúscula",
    validate: (password) => /[a-z]/.test(password),
  },
  {
    label: "Pelo menos um número",
    validate: (password) => /[0-9]/.test(password),
  },
  {
    label: "Pelo menos um caractere especial",
    validate: (password) => /[^A-Za-z0-9]/.test(password),
  },
];

export function usePasswordValidation(
  password: string,
  confirmPassword?: string,
) {
  return useMemo(() => {
    const validations = passwordRules.map((rule) => ({
      ...rule,
      valid: rule.validate(password),
    }));

    const passwordsMatch =
      confirmPassword === undefined ||
      (password === confirmPassword && password.length > 0);

    const allValid = validations.every((rule) => rule.valid) && passwordsMatch;

    return {
      validations,
      passwordsMatch,
      allValid,
    };
  }, [password, confirmPassword]);
}
