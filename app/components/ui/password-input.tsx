import React, { useState, forwardRef } from "react";
import { Input } from "./input";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps extends React.ComponentProps<typeof Input> {
  label?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, ...props }, ref) => {
    const [show, setShow] = useState(false);

    return (
      <div className="relative w-full">
        {label && (
          <label className="block mb-1 text-sm text-gray-700">{label}</label>
        )}
        <Input
          {...props}
          ref={ref}
          type={show ? "text" : "password"}
          className={props.className}
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          onClick={() => setShow((v) => !v)}
        >
          {show ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";
