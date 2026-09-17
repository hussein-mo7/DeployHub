import { BrowserRouter } from "react-router-dom";
import { QueryProvider } from "@/providers/QueryProvider";
import { SessionManager } from "@/components/auth/SessionManager";
import { AppRoutes } from "@/routes";

export function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <SessionManager>
          <AppRoutes />
        </SessionManager>
      </BrowserRouter>
    </QueryProvider>
  );
}
