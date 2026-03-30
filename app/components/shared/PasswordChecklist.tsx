import React, { useEffect } from "react";
import { Check, X } from "lucide-react";
import type { PasswordChecklistProps } from "~/types/components";
import { usePasswordValidation } from "~/components/features/auth/hooks/usePasswordValidation";

export const PasswordChecklist: React.FC<PasswordChecklistProps> = ({
  password,
  confirmPassword,
  onValidChange,
}) => {
  const { allValid, validations, passwordsMatch } = usePasswordValidation(
    password,
    confirmPassword,
  );

  useEffect(() => {
    if (onValidChange) onValidChange(allValid);
  }, [allValid, onValidChange]);

  return (
    <ul className="text-sm grid grid-cols-2 gap-3">
      {validations.map((rule) => {
        const valid = rule.valid;
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
        <li className={passwordsMatch ? "text-green-600" : "text-red-600"}>
          {passwordsMatch ? (
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
