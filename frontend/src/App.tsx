import { BrowserRouter } from "react-router-dom";
import { QueryProvider } from "@/providers/QueryProvider";
import { SessionManager } from "@/components/auth/SessionManager";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { Toaster } from "@/components/ui/sonner";
import { AppRoutes } from "@/routes";

export function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <ConfirmProvider>
          <SessionManager>
            <AppRoutes />
          </SessionManager>
          <Toaster />
        </ConfirmProvider>
      </BrowserRouter>
    </QueryProvider>
  );
}
