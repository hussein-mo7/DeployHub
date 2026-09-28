import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { isUnauthorizedError } from "@/lib/api-errors";
import { setSessionExpiredHandler } from "@/lib/session-expired";
import { getProactiveRefreshIntervalMs } from "@/lib/session-refresh-interval";
import { PageLoadingState } from "@/components/ui/loading-state";
import { toastError } from "@/lib/toast";
import { useAuthStore } from "@/stores/auth.store";

const VISIBILITY_SYNC_DEBOUNCE_MS = 60_000;

function handleSessionExpired(
  clearSession: () => void,
  navigate: ReturnType<typeof useNavigate>,
) {
  toastError("Your session expired. Please sign in again.");
  clearSession();
  navigate(ROUTES.LOGIN, { replace: true });
}

export function SessionManager({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const accessTokenTtlSeconds = useAuthStore((s) => s.accessTokenTtlSeconds);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const initialize = useAuthStore((s) => s.initialize);
  const clearSession = useAuthStore((s) => s.clearSession);
  const syncSession = useAuthStore((s) => s.syncSession);
  const extendSession = useAuthStore((s) => s.extendSession);

  const lastVisibilitySyncRef = useRef(0);
  const lastExtendRef = useRef(0);

  useEffect(() => {
    if (useAuthStore.getState().isInitialized) {
      return;
    }
    void initialize();
  }, [initialize]);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      handleSessionExpired(clearSession, navigate);
    });
    return () => setSessionExpiredHandler(null);
  }, [clearSession, navigate]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const onUnauthorized = (error: unknown) => {
      if (!isUnauthorizedError(error)) {
        if (import.meta.env.DEV) {
          console.warn("[session] sync failed", error);
        }
        return;
      }
      handleSessionExpired(clearSession, navigate);
    };

    const syncIfStale = () => {
      const now = Date.now();
      if (now - lastVisibilitySyncRef.current < VISIBILITY_SYNC_DEBOUNCE_MS) {
        return;
      }
      lastVisibilitySyncRef.current = now;
      void syncSession().catch(onUnauthorized);
    };

    const extendIfDue = () => {
      const now = Date.now();
      const intervalMs = getProactiveRefreshIntervalMs(accessTokenTtlSeconds);
      if (now - lastExtendRef.current < intervalMs * 0.9) {
        return;
      }
      lastExtendRef.current = now;
      void extendSession().catch(onUnauthorized);
    };

    const refreshIntervalMs = getProactiveRefreshIntervalMs(accessTokenTtlSeconds);
    const intervalId = window.setInterval(extendIfDue, refreshIntervalMs);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        syncIfStale();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user, accessTokenTtlSeconds, clearSession, navigate, syncSession, extendSession]);

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
