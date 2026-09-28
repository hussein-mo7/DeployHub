import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { isUnauthorizedError } from "@/lib/api-errors";
import { setSessionExpiredHandler } from "@/lib/session-expired";
import { getProactiveRefreshIntervalMs } from "@/lib/session-refresh-interval";
import { PageLoadingState } from "@/components/ui/loading-state";
import { toastError } from "@/lib/toast";
import { useAuthStore } from "@/stores/auth.store";

export function SessionManager({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const accessTokenTtlSeconds = useAuthStore((s) => s.accessTokenTtlSeconds);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const initialize = useAuthStore((s) => s.initialize);
  const clearSession = useAuthStore((s) => s.clearSession);
  const syncSession = useAuthStore((s) => s.syncSession);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      toastError("Your session expired. Please sign in again.");
      clearSession();
      navigate(ROUTES.LOGIN, { replace: true });
    });
    return () => setSessionExpiredHandler(null);
  }, [clearSession, navigate]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const refresh = () => {
      void syncSession().catch((error: unknown) => {
        if (!isUnauthorizedError(error)) {
          return;
        }
        toastError("Your session expired. Please sign in again.");
        clearSession();
        navigate(ROUTES.LOGIN, { replace: true });
      });
    };

    const refreshIntervalMs = getProactiveRefreshIntervalMs(accessTokenTtlSeconds);
    const intervalId = window.setInterval(refresh, refreshIntervalMs);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user, accessTokenTtlSeconds, clearSession, navigate, syncSession]);

  if (!isInitialized) {
    return (
      <PageLoadingState
        fullScreen
        label="Starting DeployHub"
        description="Checking your session…"
      />
    );
  }

  return <>{children}</>;
}
