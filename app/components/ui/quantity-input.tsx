import { Minus, Plus } from "lucide-react";
import * as React from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

export interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

const QuantityInput = React.forwardRef<HTMLDivElement, QuantityInputProps>(
  ({ className, value, onChange, min = 1, max = 99999, ...props }, ref) => {
    const handleDecrement = () => {
      if (value > min) onChange(value - 1);
    };

    const handleIncrement = () => {
      if (value < max) onChange(value + 1);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      if (!isNaN(val) && val >= min && val <= max) {
        onChange(val);
      }
    };

    return (
      <div ref={ref} className={cn("relative w-28", className)} {...props}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleDecrement}
          disabled={value <= min}
          className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
          tabIndex={-1}
        >
          <Minus size={16} />
        </Button>
        <Input
          type="number"
          value={value}
          onChange={handleChange}
          className="w-full text-center no-spinner px-8"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleIncrement}
          disabled={value >= max}
          className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
          tabIndex={-1}
        >
          <Plus size={16} />
        </Button>
      </div>
    );
  }
);

QuantityInput.displayName = "QuantityInput";

export { QuantityInput };
