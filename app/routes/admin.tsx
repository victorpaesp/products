import { data, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { AdminShell } from "~/components/features/admin";
import { requireAdminUser } from "~/lib/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAdminUser(request);
  return data({ user });
}

export default function AdminLayout() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <AdminShell user={user}>
      <Outlet />
    </AdminShell>
  );
}
