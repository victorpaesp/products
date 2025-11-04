import React, { forwardRef } from "react";
import { Input } from "~/components/ui/input";
import { formatPhoneNumber, unformatPhoneNumber } from "~/lib/utils";

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  value?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value,
      onChange,
      placeholder = "(99) 99999-9999",
      disabled,
      readOnly,
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      const digits = unformatPhoneNumber(input);

      if (digits.length > 11) return;

      const formatted = formatPhoneNumber(input);

      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: formatted,
          name: props.name || "",
        },
      };

      if (onChange) {
        onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="tel"
        inputMode="numeric"
        placeholder={placeholder}
        value={value || ""}
        onChange={handleChange}
        disabled={disabled}
        readOnly={readOnly}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";
