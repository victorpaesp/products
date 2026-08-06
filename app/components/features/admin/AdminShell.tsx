import {
  ExternalLink,
  Menu,
  PackageSearch,
  Settings,
  Tags,
  Users,
} from "lucide-react";
import { Link, NavLink, useLocation } from "@remix-run/react";
import { useState } from "react";
import type { SessionUser } from "~/types/server";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { cn } from "~/lib/utils";
import { usePendingCategoryReviewsCountQuery } from "~/hooks/useCategoryReviews";

type AdminShellProps = {
  children: React.ReactNode;
  user: SessionUser;
};

const categoryNavigation = [
  {
    label: "Gerenciar categorias",
    to: "/admin/categories",
    end: true,
  },
  {
    label: "Revisões pendentes",
    to: "/admin/categories/reviews",
    end: false,
  },
] as const;

function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

type AdminNavigationProps = {
  categoriesRouteActive: boolean;
  onNavigate?: () => void;
  pendingReviewsCount: number | null;
};

function AdminNavigation({
  categoriesRouteActive,
  onNavigate,
  pendingReviewsCount,
}: AdminNavigationProps) {
  const [categoriesOpen, setCategoriesOpen] = useState(categoriesRouteActive);

  return (
    <nav aria-label="Navegação administrativa" className="flex flex-col gap-1">
      <NavLink
        to="/admin/products"
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            "focus-visible:ring-ring flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2",
            isActive
              ? "bg-secondary text-secondary-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          )
        }
      >
        <PackageSearch className="size-4.5 shrink-0" aria-hidden="true" />
        <span>Produtos</span>
      </NavLink>

      <Accordion
        type="single"
        collapsible
        value={categoriesOpen ? "categories" : ""}
        onValueChange={(value) => setCategoriesOpen(value === "categories")}
      >
        <AccordionItem value="categories" className="border-0">
          <AccordionTrigger
            className={cn(
              "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground min-h-11 items-center gap-3 px-3 py-0 text-sm hover:no-underline",
              categoriesRouteActive &&
                "text-sidebar-accent-foreground bg-sidebar-accent/60",
            )}
          >
            <span className="flex min-w-0 flex-1 items-center gap-3">
              <Tags className="size-4.5 shrink-0" aria-hidden="true" />
              <span>Categorias</span>
              {!categoriesOpen &&
              pendingReviewsCount !== null &&
              pendingReviewsCount > 0 ? (
                <Badge
                  variant="secondary"
                  className="ml-auto min-w-6 justify-center tabular-nums"
                  aria-label={`${pendingReviewsCount} revisões pendentes`}
                >
                  {pendingReviewsCount > 99 ? "99+" : pendingReviewsCount}
                </Badge>
              ) : null}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-1">
            <div className="border-sidebar-border ml-5 flex flex-col gap-1 border-l pl-3">
              {categoryNavigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "focus-visible:ring-ring flex min-h-11 items-center gap-2 rounded-md px-3 text-sm transition-colors outline-none focus-visible:ring-2",
                      isActive
                        ? "bg-secondary text-secondary-foreground font-medium"
                        : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )
                  }
                >
                  <span className="truncate">{item.label}</span>
                  {item.to === "/admin/categories/reviews" &&
                  categoriesOpen &&
                  pendingReviewsCount !== null &&
                  pendingReviewsCount > 0 ? (
                    <Badge
                      variant="secondary"
                      className="ml-auto min-w-6 justify-center tabular-nums"
                      aria-label={`${pendingReviewsCount} revisões pendentes`}
                    >
                      {pendingReviewsCount > 99 ? "99+" : pendingReviewsCount}
                    </Badge>
                  ) : null}
                </NavLink>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <NavLink
        to="/admin/users"
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            "focus-visible:ring-ring flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2",
            isActive
              ? "bg-secondary text-secondary-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          )
        }
      >
        <Users className="size-4.5 shrink-0" aria-hidden="true" />
        <span>Usuários</span>
      </NavLink>
    </nav>
  );
}

function AdminBrand() {
  return (
    <Link
      to="/admin/products"
      className="focus-visible:ring-ring flex w-full items-center justify-center outline-none focus-visible:ring-2"
      aria-label="Administração Santo Mimo"
    >
      <img src="/logo-new.png" alt="" className="" />
    </Link>
  );
}

function AdminProfileLink({
  user,
  onNavigate,
}: {
  user: SessionUser;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to="/settings"
      onClick={onNavigate}
      className="hover:bg-sidebar-accent focus-visible:ring-ring flex min-h-14 items-center gap-3 rounded-md p-2 transition-colors outline-none focus-visible:ring-2"
      aria-label={`Abrir perfil de ${user.name}`}
    >
      <span className="bg-secondary text-secondary-foreground flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
        {getUserInitials(user.name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-sidebar-foreground block truncate text-sm font-medium">
          {user.name}
        </span>
        <span className="text-sidebar-foreground/55 block truncate text-xs">
          {user.email}
        </span>
      </span>
      <Settings
        className="text-sidebar-foreground/50 size-4 shrink-0"
        aria-hidden="true"
      />
    </Link>
  );
}

export function AdminShell({ children, user }: AdminShellProps) {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const pendingReviewsQuery = usePendingCategoryReviewsCountQuery();
  const pendingReviewsCount = pendingReviewsQuery.data ?? null;
  const location = useLocation();
  const categoriesRouteActive =
    location.pathname.startsWith("/admin/categories");

  return (
    <div className="bg-muted/50 min-h-dvh">
      <a
        href="#admin-main"
        className="bg-background text-foreground focus:ring-ring sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:px-4 focus:py-2 focus:ring-2 focus:outline-none"
      >
        Pular para o conteúdo
      </a>
      <aside className="bg-muted/50 fixed inset-y-0 left-0 hidden w-64 flex-col gap-4 lg:flex">
        <div className="flex items-center px-4 py-6">
          <AdminBrand />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-2">
            <p className="text-sidebar-foreground/50 px-3 text-xs font-semibold tracking-wider uppercase">
              Operações
            </p>
            <AdminNavigation
              key={categoriesRouteActive ? "categories-active" : "main"}
              categoriesRouteActive={categoriesRouteActive}
              pendingReviewsCount={pendingReviewsCount}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 p-4 pt-0">
          <Separator className="mb-1" />
          <NavLink
            to="/products"
            className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-ring flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2"
          >
            <ExternalLink className="size-4.5" aria-hidden="true" />
            Ver catálogo
          </NavLink>
          <AdminProfileLink user={user} />
        </div>
      </aside>

      <div className="min-w-0 lg:pl-64">
        <Sheet
          open={mobileNavigationOpen}
          onOpenChange={setMobileNavigationOpen}
        >
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-background fixed top-4 left-4 z-20 shadow-sm lg:hidden"
              aria-label="Abrir navegação administrativa"
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="bg-sidebar text-sidebar-foreground w-[min(20rem,88vw)] p-0"
          >
            <SheetHeader className="bg-primary min-h-17 justify-center px-5 py-3">
              <SheetTitle className="sr-only">
                Navegação administrativa
              </SheetTitle>
              <SheetDescription className="sr-only">
                Acesse produtos, categorias, revisões e usuários.
              </SheetDescription>
              <AdminBrand />
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <AdminNavigation
                key={categoriesRouteActive ? "categories-active" : "main"}
                categoriesRouteActive={categoriesRouteActive}
                pendingReviewsCount={pendingReviewsCount}
                onNavigate={() => setMobileNavigationOpen(false)}
              />
            </div>
            <div className="flex flex-col gap-2 p-4 pt-0">
              <Separator className="mb-1" />
              <Link
                to="/products"
                onClick={() => setMobileNavigationOpen(false)}
                className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-ring flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2"
              >
                <ExternalLink className="size-4.5" aria-hidden="true" />
                Ver catálogo
              </Link>
              <AdminProfileLink
                user={user}
                onNavigate={() => setMobileNavigationOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>

        <main
          id="admin-main"
          tabIndex={-1}
          className="mx-3 my-6 rounded-2xl bg-white px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          <div className="mx-auto w-full max-w-360">{children}</div>
        </main>
      </div>
    </div>
  );
}
