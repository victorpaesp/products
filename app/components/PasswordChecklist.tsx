import React, { useEffect } from "react";
import { Check, X } from "lucide-react";

export type PasswordChecklistProps = {
  password: string;
  confirmPassword?: string;
  onValidChange?: (valid: boolean) => void;
};

const passwordRules = [
  {
    label: "Mínimo de 8 caracteres",
    validate: (pw: string) => pw.length >= 8,
  },
  {
    label: "Pelo menos uma letra maiúscula",
    validate: (pw: string) => /[A-Z]/.test(pw),
  },
  {
    label: "Pelo menos uma letra minúscula",
    validate: (pw: string) => /[a-z]/.test(pw),
  },
  {
    label: "Pelo menos um número",
    validate: (pw: string) => /[0-9]/.test(pw),
  },
  {
    label: "Pelo menos um caractere especial",
    validate: (pw: string) => /[^A-Za-z0-9]/.test(pw),
  },
];

export const PasswordChecklist: React.FC<PasswordChecklistProps> = ({
  password,
  confirmPassword,
  onValidChange,
}) => {
  const allValid =
    passwordRules.every((rule) => rule.validate(password)) &&
    (confirmPassword === undefined ||
      (password === confirmPassword && password.length > 0));

  useEffect(() => {
    if (onValidChange) onValidChange(allValid);
  }, [allValid, onValidChange]);

  return (
    <ul className="text-sm grid grid-cols-2 gap-3">
      {passwordRules.map((rule) => {
        const valid = rule.validate(password);
        return (
          <li
            key={rule.label}
            className={valid ? "text-green-600" : "text-red-600"}
          >
            {valid ? (
              <Check size={16} className="inline mr-1" />
            ) : (
              <X size={16} className="inline mr-1" />
            )}
            {rule.label}
          </li>
        );
      })}
      {confirmPassword !== undefined && (
        <li
          className={
            password === confirmPassword && password
              ? "text-green-600"
              : "text-red-600"
          }
        >
          {password === confirmPassword && password ? (
            <Check size={16} className="inline mr-1" />
          ) : (
            <X size={16} className="inline mr-1" />
          )}
          Senha e repetição estão iguais
        </li>
      )}
    </ul>
  );
};
