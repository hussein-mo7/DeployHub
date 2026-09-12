import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Server,
  FolderKanban,
  Rocket,
  Settings,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { useUIStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: ROUTES.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
  { to: ROUTES.SERVERS, label: "Servers", icon: Server },
  { to: ROUTES.PROJECTS, label: "Projects", icon: FolderKanban },
  { to: ROUTES.DEPLOYMENTS, label: "Deployments", icon: Rocket },
  { to: ROUTES.SETTINGS, label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200",
        sidebarCollapsed ? "w-16" : "w-60",
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              D
            </div>
            <span className="font-semibold tracking-tight">DeployHub</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={toggleSidebar}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} />
        </Button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white",
                sidebarCollapsed && "justify-center px-2",
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        {!sidebarCollapsed && user && (
          <p className="mb-2 truncate px-3 text-xs text-sidebar-foreground/60">{user.email}</p>
        )}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white",
            sidebarCollapsed && "justify-center px-2",
          )}
          onClick={() => void handleLogout()}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && <span>Log out</span>}
        </Button>
      </div>
    </aside>
  );
}
