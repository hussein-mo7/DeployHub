import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryProvider } from "@/providers/QueryProvider";
import { AppRoutes } from "@/routes";
import { useAuthStore } from "@/stores/auth.store";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return <>{children}</>;
}

export function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <AuthInitializer>
          <AppRoutes />
        </AuthInitializer>
      </BrowserRouter>
    </QueryProvider>
  );
}
