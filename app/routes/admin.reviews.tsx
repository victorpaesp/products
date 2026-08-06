import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { requireAdminUser } from "~/lib/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdminUser(request);
  const url = new URL(request.url);
  throw redirect(`/admin/categories/reviews${url.search}`);
}
