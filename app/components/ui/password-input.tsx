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
          <label className="mb-1 block text-sm text-neutral-700">{label}</label>
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
            className="absolute top-1/2 right-1 -translate-y-1/2 p-0 text-neutral-500 hover:bg-transparent hover:text-neutral-700"
            onClick={() => setShow((v) => !v)}
          >
            {show ? <Eye size={18} /> : <EyeOff size={18} />}
          </Button>
        </div>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
