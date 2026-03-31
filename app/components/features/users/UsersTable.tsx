import { useEffect, useState } from "react";
import { DataTable } from "~/components/DataTable";
import { columns } from "./columns";
import { Button } from "~/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import { CreateUserDialog } from "./CreateUserDialog";
import { EditUserDialog } from "./EditUserDialog";
import toast from "~/components/ui/toast-client";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import type { UsersTableUser } from "~/types/components";
import { useDeleteUserMutation, useUsersQuery } from "~/hooks/useUsers";
import { useCacheStatus } from "~/hooks/useCacheStatus";
import { CacheIndicator } from "~/components/shared/CacheIndicator";

export function UsersTable() {
  const [page, setPage] = useState(1);
  const per_page = 2;
  const [selectedUser, setSelectedUser] = useState<UsersTableUser | null>(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UsersTableUser | null>(null);
  const [openDeleteAlert, setOpenDeleteAlert] = useState(false);
  const queryClient = useQueryClient();
  const deleteUserMutation = useDeleteUserMutation();

  const {
    data: usersResponse,
    isLoading,
    isFetching,
    isError,
  } = useUsersQuery({
    page,
    perPage: per_page,
  });

  const cacheStatus = useCacheStatus({
    data: usersResponse,
    isLoading,
    isFetching,
  } as any);

  const users = usersResponse?.data || [];
  const totalPages = usersResponse?.last_page || 1;

  useEffect(() => {
    if (!isError) return;
    toast.error("Não foi possível carregar usuários.");
  }, [isError]);

  const handleEdit = (user: UsersTableUser) => {
    setSelectedUser(user);
    setOpenEdit(true);
  };

  const handleDelete = async (userId: string | number) => {
    try {
      await deleteUserMutation.mutateAsync(userId);
      setOpenDeleteAlert(false);
      setUserToDelete(null);
      toast.success("Usuário removido com sucesso!");
    } catch {
      toast.error("Não foi possível remover usuário.");
    }
  };

  const openDeleteConfirmation = (user: UsersTableUser) => {
    setUserToDelete(user);
    setOpenDeleteAlert(true);
  };

  const handleCreate = () => {
    setOpenCreate(true);
  };

  const handleSuccess = () => {
    setPage(1);
    void queryClient.invalidateQueries({ queryKey: ["users", "list"] });
  };

  const tableColumns = columns.map((col) =>
    col.id === "actions"
      ? {
          ...col,
          cell: ({ row }: { row: { original: UsersTableUser } }) => {
            const user = row.original;
            return (
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Edit"
                  onClick={() => handleEdit(user)}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Delete"
                  onClick={() => openDeleteConfirmation(user)}
                >
                  <Trash />
                </Button>
              </div>
            );
          },
        }
      : col,
  );

  return (
    <div className="w-full">
      <CacheIndicator status={cacheStatus} />
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-2xl font-bold mb-1">Gerenciar Usuários</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Gerencie usuários, edite dados e mantenha o controle do sistema.
          </p>
        </div>
      </div>
      <div className="flex items-center py-2 gap-2">
        <Button variant="default" onClick={handleCreate}>
          Criar novo usuário
        </Button>
      </div>
      {isLoading ? (
        <div className="py-8 text-center">Carregando...</div>
      ) : (
        <div className="w-full">
          <DataTable
            columns={tableColumns}
            data={users}
            globalFilterFn={(row, filterValue) => {
              const searchValue = filterValue.toLowerCase();
              return (
                row.name.toLowerCase().includes(searchValue) ||
                row.email.toLowerCase().includes(searchValue)
              );
            }}
            filterPlaceholder="Procurar..."
          />
        </div>
      )}
      {isFetching && !isLoading ? (
        <p className="text-xs text-muted-foreground mt-2">Atualizando...</p>
      ) : null}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Anterior
        </Button>
        <span className="text-sm">
          Página {page} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Próxima
        </Button>
      </div>

      <CreateUserDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        onSuccess={handleSuccess}
      />

      <EditUserDialog
        open={openEdit}
        onOpenChange={setOpenEdit}
        user={selectedUser}
        onSuccess={handleSuccess}
      />

      <AlertDialog open={openDeleteAlert} onOpenChange={setOpenDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Tem certeza que deseja remover este usuário?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O usuário será permanentemente
              removido do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && handleDelete(userToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
