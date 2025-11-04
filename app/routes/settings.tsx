import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { useNavigate } from "@remix-run/react";
import { ProfileForm } from "~/components/ProfileForm";
import { UsersTable } from "~/components/UsersTable";
import { Button } from "~/components/ui/button";
import { Settings, User } from "lucide-react";
import { useAuth } from "~/hooks/useAuth";
import { LoadingState } from "~/components/shared/LoadingState";
import { useState, useEffect } from "react";
import { Product } from "~/types";
import { LoaderFunctionArgs } from "@remix-run/node";
import { requireAuth } from "~/lib/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuth(request);
  return null;
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
  const navigate = useNavigate();
  const { isAdmin, loading } = useAuth();
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

  if (loading) {
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
        <LoadingState />
      </div>
    );
  }

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
            {tab.value === "profile" ? <ProfileForm /> : null}
            {tab.value === "manage-users" ? <UsersTable /> : null}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
