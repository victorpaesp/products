import { useState, useEffect } from "react";
import { DataTable } from "~/components/DataTable";
import { columns } from "./columns";
import { Button } from "~/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import { CreateUserDialog } from "./CreateUserDialog";
import { EditUserDialog } from "./EditUserDialog";
import toast from "~/components/ui/toast-client";
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

export function UsersTable() {
  const [filter, setFilter] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [page, setPage] = useState(1);
  const per_page = 2;
  const [users, setUsers] = useState<UsersTableUser[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UsersTableUser | null>(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UsersTableUser | null>(null);
  const [openDeleteAlert, setOpenDeleteAlert] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilter(filter);
    }, 500);
    return () => clearTimeout(handler);
  }, [filter]);

  const fetchUsers = async () => {
    setLoading(true);
    const cacheKey = `users-table-page-${page}-filter-${debouncedFilter}`;
    if (!debouncedFilter) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setUsers(parsed.users || []);
          setTotalPages(parsed.totalPages || 1);
          setLoading(false);
          return;
        } catch (e) {}
      }
    }
    try {
      const query = new URLSearchParams({
        page: String(page),
        per_page: String(per_page),
      });
      if (debouncedFilter) {
        query.set("search", debouncedFilter);
      }

      const res = await fetch(`/api/users?${query.toString()}`, {
        method: "GET",
        credentials: "same-origin",
      });

      if (!res.ok) {
        throw new Error("Erro ao buscar usuários");
      }

      const payload = await res.json();
      setUsers(payload.data || []);
      setTotalPages(payload.last_page || 1);
      if (!debouncedFilter) {
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            users: payload.data || [],
            totalPages: payload.last_page || 1,
          }),
        );
      }
    } catch (error) {
      setUsers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedFilter]);

  const handleEdit = (user: UsersTableUser) => {
    setSelectedUser(user);
    setOpenEdit(true);
  };

  const handleDelete = async (userId: string | number) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      if (!res.ok) {
        throw new Error("Erro ao remover usuário");
      }

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      const cacheKey = `users-table-page-${page}-filter-${debouncedFilter}`;
      sessionStorage.removeItem(cacheKey);
      setOpenDeleteAlert(false);
      setUserToDelete(null);
      toast.success("Usuário removido com sucesso!");
    } catch (error) {
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
    setDebouncedFilter("");
    const cacheKey = `users-table-page-${page}-filter-${debouncedFilter}`;
    sessionStorage.removeItem(cacheKey);
    fetchUsers();
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
      {loading ? (
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
