import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { requireAdminUser } from "~/lib/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdminUser(request);
  return redirect("/admin/products");
}

export default function AdminIndex() {
  return null;
}
