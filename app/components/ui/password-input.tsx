import React, { useState, forwardRef } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps extends React.ComponentProps<typeof Input> {
  label?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, ...props }, ref) => {
    const [show, setShow] = useState(false);

    return (
      <div className="w-full">
        {label && (
          <label className="block mb-1 text-sm text-gray-700">{label}</label>
        )}
        <div className="relative w-full">
          <Input
            {...props}
            ref={ref}
            type={show ? "text" : "password"}
            className={`${props.className} relative`}
          />
          <Button
            type="button"
            variant="ghost"
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 hover:bg-transparent p-0"
            onClick={() => setShow((v) => !v)}
          >
            {show ? <Eye size={18} /> : <EyeOff size={18} />}
          </Button>
        </div>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";
