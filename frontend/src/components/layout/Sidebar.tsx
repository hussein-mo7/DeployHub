import { PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";
import { Button } from "@/components/ui/button";
import { AppBrand } from "@/components/layout/AppBrand";
import { SidebarNav } from "@/components/layout/SidebarNav";

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        "hidden h-full shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 ease-out lg:flex lg:flex-col",
        sidebarCollapsed ? "w-[72px]" : "w-[240px]",
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-border",
          sidebarCollapsed ? "justify-center px-2" : "justify-between px-4",
        )}
      >
        {!sidebarCollapsed && <AppBrand />}
        {sidebarCollapsed && <AppBrand collapsed className="justify-center" />}
        {!sidebarCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={toggleSidebar}
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        )}
      </div>

      {sidebarCollapsed && (
        <div className="flex justify-center border-b border-border py-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={toggleSidebar}
            aria-label="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col">
        <SidebarNav collapsed={sidebarCollapsed} />
      </div>
    </aside>
  );
}
