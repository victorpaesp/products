import { api } from "./axios";
import type { LoginResponse, RegisterData, User } from "~/types";

export async function login(
  email: string,
  password: string
): Promise<LoginResponse | null> {
  try {
    const response = await api.post<LoginResponse>("/login", {
      email,
      password,
    });

    if (response.data.token) {
      if (typeof window !== "undefined") {
        localStorage.setItem("token", response.data.token);

        const expiresAt = Date.now() + response.data.expires_in * 1000;
        localStorage.setItem("token_expires_at", expiresAt.toString());

        try {
          const userResponse = await api.get<User>("/me");
          localStorage.setItem("user", JSON.stringify(userResponse.data));
        } catch (userError) {
          console.warn("Erro ao buscar dados do usuário:", userError);
        }
      }

      return response.data;
    }

    return null;
  } catch (error) {
    console.error("Erro no login:", error);
    return null;
  }
}

export async function register(
  data: RegisterData
): Promise<LoginResponse | null> {
  try {
    const response = await api.post<User>("/users", data);

    if (response.data) {
      return await login(data.email, data.password);
    }

    return null;
  } catch (error) {
    console.error("Erro no registro:", error);
    throw error;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await api.get<User>("/me");

    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(response.data));
    }

    return response.data;
  } catch (error) {
    console.error("Erro ao buscar usuário atual:", error);
    return null;
  }
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("token_expires_at");
    localStorage.removeItem("user");
    sessionStorage.clear();
  }
}

export function getStoredUser(): User | null {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function isAuthenticated(): boolean {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    const expiresAt = localStorage.getItem("token_expires_at");

    if (!token) return false;

    if (!expiresAt) return true;

    const isExpired = Date.now() >= parseInt(expiresAt);

    if (isExpired) {
      logout();
      return false;
    }

    return true;
  }
  return false;
}

export function isAdmin(): boolean {
  const user = getStoredUser();
  return user?.role === "admin";
}

export function getTokenTimeRemaining(): number | null {
  if (typeof window !== "undefined") {
    const expiresAt = localStorage.getItem("token_expires_at");
    if (!expiresAt) return null;

    const remaining = parseInt(expiresAt) - Date.now();
    return remaining > 0 ? Math.floor(remaining / 1000) : null;
  }
  return null;
}
