import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Server,
  FolderKanban,
  Rocket,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { userInitials } from "@/components/layout/AppBrand";

export const mainNavItems = [
  { to: ROUTES.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
  { to: ROUTES.SERVERS, label: "Servers", icon: Server },
  { to: ROUTES.PROJECTS, label: "Projects", icon: FolderKanban },
  { to: ROUTES.DEPLOYMENTS, label: "Deployments", icon: Rocket },
  { to: ROUTES.SETTINGS, label: "Settings", icon: Settings },
] as const;

interface SidebarNavProps {
  collapsed?: boolean;
  showPlatformLabel?: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({
  collapsed = false,
  showPlatformLabel = true,
  onNavigate,
}: SidebarNavProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const initials = userInitials(user?.name, user?.email);

  const handleLogout = async () => {
    onNavigate?.();
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <>
      <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Main">
        {showPlatformLabel && !collapsed && (
          <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Platform
          </p>
        )}
        {mainNavItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            onClick={() => onNavigate?.()}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                collapsed && "justify-center px-2",
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary"
                    aria-hidden
                  />
                )}
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                {!collapsed && <span>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        {!collapsed && user && (
          <div className="mb-3 flex items-center gap-3 rounded-lg border border-border/80 bg-muted/30 px-3 py-2.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
              aria-hidden
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className={cn(
            "w-full gap-3 text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            collapsed ? "justify-center px-2" : "justify-start",
          )}
          onClick={() => void handleLogout()}
          title={collapsed ? "Log out" : undefined}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Log out</span>}
        </Button>
      </div>
    </>
  );
}
