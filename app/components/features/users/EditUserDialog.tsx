import type { EditUserDialogProps } from "~/types/components";
import { UserDialogBase } from "./UserDialogBase";

export function EditUserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: EditUserDialogProps) {
  return (
    <UserDialogBase
      mode="edit"
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      user={user}
    />
  );
}
