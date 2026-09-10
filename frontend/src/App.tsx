import { BrowserRouter } from "react-router-dom";
import { QueryProvider } from "@/providers/QueryProvider";
import { AppRoutes } from "@/routes";

export function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryProvider>
  );
}
