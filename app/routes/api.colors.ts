import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { backendListColors, BackendApiError } from "~/lib/backend.server";
import { resolveAuthToken } from "~/lib/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await resolveAuthToken(request);

  try {
    const colors = await backendListColors({ token });
    return Response.json(colors.data);
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 401) {
      throw redirect("/login");
    }
  }
}
