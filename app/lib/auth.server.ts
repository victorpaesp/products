import { redirect } from "@remix-run/node";

export async function requireAuth(request: Request) {
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader
    ?.split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    throw redirect("/login");
  }

  return token;
}
