import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { ProfileForm } from "~/components/features/settings/ProfileForm";
import { UsersTable } from "~/components/features/users/UsersTable";
import { Button } from "~/components/ui/button";
import { Settings, User } from "lucide-react";
import { useState, useEffect } from "react";
import { Product } from "~/types";
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
    icon: Settings,
  },
];

export default function SettingsPage() {
  const { user } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const isAdmin = user.role === "admin";
  const [hasSelectedProducts, setHasSelectedProducts] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("selectedProducts");
    if (saved) {
      try {
        const products = JSON.parse(saved) as Product[];
        setHasSelectedProducts(products.length > 0);
      } catch (error) {
        setHasSelectedProducts(false);
      }
    }
  }, []);

  const visibleTabs = tabs.filter((tab) => {
    if (tab.value === "manage-users") return isAdmin;

    return true;
  });

  return (
    <div
      className={`container mx-auto py-8 px-4 sm:mt-[82px] ${
        hasSelectedProducts ? "mt-[122px]" : "mt-[74px]"
      }`}
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <Button onClick={() => navigate("/")}>Voltar</Button>
      </div>
      <Tabs
        orientation="horizontal"
        defaultValue={visibleTabs[0].value}
        className="w-full flex flex-col md:flex-row items-start gap-6 justify-center"
      >
        <TabsList className="w-full md:w-auto shrink-0 grid grid-cols-1 gap-1 p-0 bg-background">
          {visibleTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground justify-start px-3 py-1.5"
            >
              <tab.icon className="h-5 w-5 me-2" /> {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {visibleTabs.map((tab) => (
          <TabsContent
            key={tab.value}
            value={tab.value}
            className="h-full w-full md:px-10 overflow-x-hidden"
          >
            {tab.value === "profile" ? (
              <ProfileForm currentUser={user} isAdmin={isAdmin} />
            ) : null}
            {tab.value === "manage-users" ? <UsersTable /> : null}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
