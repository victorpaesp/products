import type { AuthUser } from "~/types/index";

export type SessionUser = AuthUser;

export type SessionData = {
  token?: string;
  user?: SessionUser;
};

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  token?: string;
  body?: unknown;
};
