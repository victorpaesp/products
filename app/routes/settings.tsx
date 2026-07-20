import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { useLoaderData, useNavigate, useSearchParams } from "@remix-run/react";
import { ProfileForm } from "~/components/features/settings/ProfileForm";
import { CategoryManager } from "~/components/features/settings/CategoryManager";
import { UsersTable } from "~/components/features/users/UsersTable";
import { Button } from "~/components/ui/button";
import { ChevronLeft, Tags, User, Users } from "lucide-react";
import { ActionFunctionArgs, data, LoaderFunctionArgs } from "@remix-run/node";
import {
  commitUserSession,
  requireAuth,
  requireSessionUser,
} from "~/lib/auth.server";
import { backendCurrentUser, backendRequest } from "~/lib/backend.server";
import { unformatPhoneNumber } from "~/lib/utils";
import type { SettingsActionData } from "~/types/routes";

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await requireAuth(request);
  const sessionUser = await requireSessionUser(request);

  try {
    const currentUser = await backendCurrentUser(token);
    return data({
      user: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        phone: currentUser.phone,
      },
    });
  } catch {
    return data({ user: sessionUser });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const token = await requireAuth(request);
  const sessionUser = await requireSessionUser(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "");

  if (sessionUser.role !== "admin") {
    return data<SettingsActionData>(
      { error: "Ação não permitida." },
      { status: 403 },
    );
  }

  if (intent === "update-profile") {
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();

    if (!name || !email) {
      return data<SettingsActionData>(
        { error: "Nome e email são obrigatórios." },
        { status: 400 },
      );
    }

    await backendRequest(`/users/${sessionUser.id}`, {
      method: "PUT",
      token,
      body: {
        name,
        email,
        phone: unformatPhoneNumber(phone),
      },
    });

    const updatedUser = await backendCurrentUser(token);
    const sessionCookie = await commitUserSession({
      request,
      token,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });

    return data<SettingsActionData>(
      {
        ok: true,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          phone: updatedUser.phone,
        },
      },
      {
        headers: {
          "Set-Cookie": sessionCookie,
        },
      },
    );
  }

  if (intent === "update-password") {
    const password = String(formData.get("password") || "");

    if (password.length < 6) {
      return data<SettingsActionData>(
        { error: "Senha deve ter no mínimo 6 caracteres." },
        { status: 400 },
      );
    }

    await backendRequest(`/users/${sessionUser.id}`, {
      method: "PUT",
      token,
      body: {
        password,
      },
    });

    return data<SettingsActionData>({ ok: true });
  }

  return data<SettingsActionData>({ error: "Ação inválida." }, { status: 400 });
}

const tabs = [
  {
    name: "Meu perfil",
    value: "profile",
    icon: User,
  },
  {
    name: "Gerenciar Usuários",
    value: "manage-users",
    icon: Users,
  },
  {
    name: "Gerenciar Categorias",
    value: "manage-categories",
    icon: Tags,
  },
];

export default function SettingsPage() {
  const { user } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = user.role === "admin";

  const visibleTabs = tabs.filter((tab) => {
    if (tab.value === "manage-users" || tab.value === "manage-categories") {
      return isAdmin;
    }

    return true;
  });
  const requestedTab = searchParams.get("tab");
  const activeTab = visibleTabs.some((tab) => tab.value === requestedTab)
    ? requestedTab!
    : visibleTabs[0].value;

  const handleTabChange = (value: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    if (value === "profile") nextSearchParams.delete("tab");
    else nextSearchParams.set("tab", value);
    setSearchParams(nextSearchParams, { replace: true });
  };

  return (
    <section className="sm-container">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={() => navigate("/")}
        >
          <ChevronLeft data-icon="inline-start" />
          Voltar
        </Button>
      </div>
      <Tabs
        orientation="horizontal"
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex w-full flex-col items-start justify-center gap-6 md:flex-row"
      >
        <TabsList className="bg-background grid w-full shrink-0 grid-cols-1 gap-1 p-1.5 md:w-auto">
          {visibleTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground justify-start px-3 py-1.5"
            >
              <tab.icon /> {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {visibleTabs.map((tab) => (
          <TabsContent
            key={tab.value}
            value={tab.value}
            className="h-full w-full overflow-x-hidden md:pl-10"
          >
            {tab.value === "profile" ? (
              <ProfileForm currentUser={user} isAdmin={isAdmin} />
            ) : null}
            {tab.value === "manage-users" ? <UsersTable /> : null}
            {tab.value === "manage-categories" ? <CategoryManager /> : null}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
