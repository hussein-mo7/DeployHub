import { Menu, X } from "lucide-react";
import { AppBrand } from "@/components/layout/AppBrand";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { pagePaddingX } from "@/components/layout/PageContent";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@/lib/utils";

export function MobileAppBar() {
  const { mobileNavOpen, setMobileNavOpen } = useUIStore();

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 backdrop-blur lg:hidden",
        pagePaddingX,
      )}
    >
      <AppBrand />
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        aria-expanded={mobileNavOpen}
        aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
        onClick={() => setMobileNavOpen(!mobileNavOpen)}
      >
        {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
    </header>
  );
}

export function MobileNavDrawer() {
  const { mobileNavOpen, setMobileNavOpen } = useUIStore();

  if (!mobileNavOpen) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[1px] lg:hidden"
        aria-label="Close menu"
        onClick={() => setMobileNavOpen(false)}
      />
      <aside
        className="fixed bottom-0 left-0 top-14 z-50 flex w-[min(100%,280px)] flex-col border-r border-border bg-card shadow-xl lg:hidden"
        aria-label="Mobile navigation"
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <SidebarNav collapsed={false} onNavigate={() => setMobileNavOpen(false)} />
        </div>
      </aside>
    </>
  );
}
