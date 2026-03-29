import type { ApiResponse, LoginResponse, RegisterData, User } from "~/types";
import type { RequestOptions } from "~/types/server";

const API_BASE_URL = process.env.BACKEND_API_URL ?? "https://searchm.shop/api";

export class BackendApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "BackendApiError";
    this.status = status;
    this.payload = payload;
  }
}

function buildUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
}

export async function backendRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    const defaultMessage = `Backend API error (${response.status})`;
    throw new BackendApiError(defaultMessage, response.status, payload);
  }

  return payload as T;
}

export async function backendLogin(email: string, password: string) {
  return backendRequest<LoginResponse>("/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function backendRegister(data: RegisterData) {
  return backendRequest<User>("/register", {
    method: "POST",
    body: {
      ...data,
      preferred_contact_method: data.preferred_contact_method || "email",
    },
  });
}

export async function backendCurrentUser(token: string) {
  return backendRequest<User>("/me", {
    method: "GET",
    token,
  });
}

export async function backendResetPassword(payload: {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}) {
  return backendRequest<{ message?: string }>("/password/reset", {
    method: "POST",
    body: payload,
  });
}

export async function backendListProducts(options: {
  token: string;
  params: URLSearchParams;
}) {
  const path = `/products?${options.params.toString()}`;
  return backendRequest<ApiResponse>(path, {
    method: "GET",
    token: options.token,
  });
}
