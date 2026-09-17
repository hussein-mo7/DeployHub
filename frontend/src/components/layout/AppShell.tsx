import { Outlet } from "react-router-dom";
import { MobileAppBar, MobileNavDrawer } from "./MobileNav";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-muted/40">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <MobileAppBar />
        <MobileNavDrawer />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background shadow-sm pt-14 lg:pt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
