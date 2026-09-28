import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { ROUTES } from "@/constants/routes";

export function ProtectedRoute() {
  const { user, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return null;
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
}

export function PublicRoute() {
  const { user, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return null;
  }

  if (user) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}
