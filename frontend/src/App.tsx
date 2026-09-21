import { BrowserRouter } from "react-router-dom";
import { QueryProvider } from "@/providers/QueryProvider";
import { SessionManager } from "@/components/auth/SessionManager";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { AppRoutes } from "@/routes";

export function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <ConfirmProvider>
          <SessionManager>
            <AppRoutes />
          </SessionManager>
        </ConfirmProvider>
      </BrowserRouter>
    </QueryProvider>
  );
}
