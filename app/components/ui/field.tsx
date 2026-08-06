import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn("flex w-full flex-col gap-5", className)}
      {...props}
    />
  );
}

const fieldVariants = cva("group/field flex w-full gap-2", {
  variants: {
    orientation: {
      vertical: "flex-col",
      horizontal: "flex-row items-center",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
});

function Field({
  className,
  orientation,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  );
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn("flex w-fit gap-2 leading-snug", className)}
      {...props}
    />
  );
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        "text-muted-foreground text-left text-sm leading-normal",
        className,
      )}
      {...props}
    />
  );
}

function FieldError({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      role="alert"
      data-slot="field-error"
      className={cn("text-destructive text-sm", className)}
      {...props}
    />
  );
}

export { Field, FieldDescription, FieldError, FieldGroup, FieldLabel };
