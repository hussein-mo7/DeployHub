import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { isUnauthorizedError } from "@/lib/api-errors";
import { setSessionExpiredHandler } from "@/lib/session-expired";
import { getProactiveRefreshIntervalMs } from "@/lib/session-refresh-interval";
import * as authService from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";

export function SessionManager({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const accessTokenTtlSeconds = useAuthStore((s) => s.accessTokenTtlSeconds);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const initialize = useAuthStore((s) => s.initialize);
  const clearSession = useAuthStore((s) => s.clearSession);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      clearSession();
      navigate(ROUTES.LOGIN, {
        replace: true,
        state: { message: "Your session expired. Please sign in again." },
      });
    });
    return () => setSessionExpiredHandler(null);
  }, [clearSession, navigate]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const refresh = () => {
      void authService.refreshSession().catch((error: unknown) => {
        if (!isUnauthorizedError(error)) {
          return;
        }
        clearSession();
        navigate(ROUTES.LOGIN, {
          replace: true,
          state: { message: "Your session expired. Please sign in again." },
        });
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
  }, [user, accessTokenTtlSeconds, clearSession, navigate]);

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
