import { AlertCircle, LoaderCircle } from "lucide-react";
import { useBlocker, useBeforeUnload } from "@remix-run/react";
import { useCallback, useState } from "react";
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
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { useProductQuery } from "~/hooks/useProduct";
import { ProductConfigurationPanel } from "./ProductConfigurationPanel";
import { ProductEditorOverview } from "./ProductEditorOverview";

type AdminProductEditorProps = {
  productId: string | number;
  token: string;
  onClose: () => void;
};

export function AdminProductEditor({
  productId,
  token,
  onClose,
}: AdminProductEditorProps) {
  const [dirty, setDirty] = useState(false);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const blocker = useBlocker(dirty);
  const query = useProductQuery({
    productId: String(productId),
    token,
  });

  useBeforeUnload(
    useCallback(
      (event) => {
        if (!dirty) return;
        event.preventDefault();
        event.returnValue = "";
      },
      [dirty],
    ),
  );

  const requestClose = () => {
    if (dirty) {
      setDiscardDialogOpen(true);
      return;
    }
    onClose();
  };

  const confirmClose = () => {
    setDirty(false);
    setDiscardDialogOpen(false);

    if (blocker.state === "blocked") {
      blocker.proceed();
      return;
    }

    onClose();
  };

  const handleDiscardDialogChange = (open: boolean) => {
    setDiscardDialogOpen(open);

    if (!open && blocker.state === "blocked") {
      blocker.reset();
    }
  };

  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
      >
        <DialogContent
          className="grid h-dvh w-screen max-w-none grid-rows-[auto_minmax(0,1fr)] gap-0 rounded-none border-0 p-0 sm:h-[min(90dvh,52rem)] sm:w-[calc(100vw-3rem)] sm:max-w-6xl sm:rounded-xl sm:border"
          showCloseButton
        >
          <DialogHeader className="border-b px-5 py-4 pr-14 sm:px-6 sm:py-5">
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle>Editar produto</DialogTitle>
              <Badge variant="secondary">Administração</Badge>
            </div>
            <DialogDescription>
              Revise o produto e controle as informações exibidas no catálogo.
              As alterações salvas entram no ar imediatamente.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 overflow-y-auto">
            {query.isLoading ? (
              <div className="flex size-full min-h-64 items-center justify-center gap-2">
                <LoaderCircle className="size-5 animate-spin" />
                <span className="text-muted-foreground text-sm">
                  Carregando produto...
                </span>
              </div>
            ) : query.isError || !query.data ? (
              <div
                className="flex size-full min-h-64 flex-col items-center justify-center gap-4 px-5 text-center"
                role="alert"
              >
                <AlertCircle className="text-destructive size-8" />
                <div className="flex max-w-sm flex-col gap-1">
                  <p className="font-semibold">Produto indisponível</p>
                  <p className="text-muted-foreground text-sm">
                    {query.error?.message ||
                      "Não foi possível carregar este produto."}
                  </p>
                </div>
                <Button variant="outline" onClick={() => void query.refetch()}>
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <div className="grid min-h-full lg:grid-cols-[22rem_minmax(0,1fr)]">
                <ProductEditorOverview product={query.data} />
                <ProductConfigurationPanel
                  key={query.data.id}
                  product={query.data}
                  token={token}
                  onDirtyChange={setDirty}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={discardDialogOpen || blocker.state === "blocked"}
        onOpenChange={handleDiscardDialogChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Existem alterações ainda não salvas. Se fechar agora, elas serão
              perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClose}>
              Descartar e fechar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
