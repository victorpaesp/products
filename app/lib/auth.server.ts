import {
  createCookieSessionStorage,
  redirect,
  type Session,
} from "@remix-run/node";
import type { SessionData, SessionUser } from "~/types/server";

const SESSION_SECRET =
  process.env.SESSION_SECRET || "development-session-secret";

const sessionStorage = createCookieSessionStorage<SessionData>({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    secrets: [SESSION_SECRET],
    maxAge: 60 * 60 * 24,
  },
});

async function getSessionFromRequest(
  request: Request,
): Promise<Session<SessionData>> {
  return sessionStorage.getSession(request.headers.get("Cookie"));
}

export async function getSessionUser(
  request: Request,
): Promise<SessionUser | null> {
  const session = await getSessionFromRequest(request);
  const user = session.get("user");
  return user || null;
}

export async function getSessionToken(
  request: Request,
): Promise<string | null> {
  const session = await getSessionFromRequest(request);
  const sessionToken = session.get("token");
  return sessionToken || null;
}

export async function createUserSession(options: {
  request: Request;
  token: string;
  user: SessionUser;
  redirectTo?: string;
  maxAgeSeconds?: number;
}) {
  const {
    request,
    token,
    user,
    redirectTo = "/products",
    maxAgeSeconds = 60 * 60 * 24,
  } = options;

  const session = await getSessionFromRequest(request);
  session.set("token", token);
  session.set("user", user);

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session, {
        maxAge: maxAgeSeconds,
      }),
    },
  });
}

export async function commitUserSession(options: {
  request: Request;
  token: string;
  user: SessionUser;
  maxAgeSeconds?: number;
}) {
  const { request, token, user, maxAgeSeconds = 60 * 60 * 24 } = options;

  const session = await getSessionFromRequest(request);
  session.set("token", token);
  session.set("user", user);

  return sessionStorage.commitSession(session, {
    maxAge: maxAgeSeconds,
  });
}

export async function requireAuth(request: Request): Promise<string> {
  const token = await getSessionToken(request);
  if (!token) {
    throw redirect("/login");
  }

  return token;
}

export async function requireSessionUser(
  request: Request,
): Promise<SessionUser> {
  const user = await getSessionUser(request);
  if (!user) {
    throw redirect("/login");
  }

  return user;
}

export async function redirectIfAuthenticated(
  request: Request,
  redirectTo = "/products",
) {
  const token = await getSessionToken(request);
  if (token) {
    throw redirect(redirectTo);
  }
}

export async function destroyUserSession(request: Request) {
  const session = await getSessionFromRequest(request);
  const headers = new Headers();
  headers.append("Set-Cookie", await sessionStorage.destroySession(session));
  headers.append(
    "Set-Cookie",
    "token=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax",
  );

  return redirect("/login", {
    headers,
  });
}
