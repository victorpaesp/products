import { useAuth } from "~/hooks/useAuth";
import { LoadingState } from "~/components/shared/LoadingState";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingState />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
