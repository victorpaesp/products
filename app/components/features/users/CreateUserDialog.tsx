import type { CreateUserDialogProps } from "~/types/components";
import { UserDialogBase } from "./UserDialogBase";

export function CreateUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateUserDialogProps) {
  return (
    <UserDialogBase
      mode="create"
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
    />
  );
}
