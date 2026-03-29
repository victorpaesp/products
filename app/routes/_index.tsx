import { MetaFunction, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { requireAuth } from "~/lib/auth.server";

export const meta: MetaFunction = () => {
  return [{ title: "Santo Mimo" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuth(request);
  return redirect("/products");
}

export default function Index() {
  return null;
}
