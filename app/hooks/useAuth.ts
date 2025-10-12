import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "@remix-run/react";
import {
  isAuthenticated,
  getStoredUser,
  getCurrentUser,
  logout,
} from "~/lib/auth";
import type { User } from "~/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const hasCheckedAuth = useRef(false);

  const handleLogout = useCallback(() => {
    logout();
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (hasCheckedAuth.current) return;

    const checkAuth = async () => {
      hasCheckedAuth.current = true;

      const authenticated = isAuthenticated();

      if (!authenticated) {
        setLoading(false);
        if (location.pathname !== "/login") {
          navigate("/login", { replace: true });
        }
        return;
      }

      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser);
        setLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          handleLogout();
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return {
    user,
    loading,
    isAuthenticated: isAuthenticated(),
    isAdmin: user?.role === "admin",
    logout: handleLogout,
  };
}
