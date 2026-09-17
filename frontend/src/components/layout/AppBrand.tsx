import { cn } from "@/lib/utils";

interface AppBrandProps {
  collapsed?: boolean;
  className?: string;
}

/** Placeholder mark until custom logo (Release 1.1+). */
export function AppBrand({ collapsed, className }: AppBrandProps) {
  return (
    <div className={cn("flex items-center gap-2.5 min-w-0", className)}>
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm"
        aria-hidden
      >
        D
      </div>
      {!collapsed && (
        <div className="min-w-0 truncate">
          <p className="truncate text-sm font-semibold tracking-tight text-foreground">DeployHub</p>
          <p className="truncate text-[11px] text-muted-foreground">Control plane</p>
        </div>
      )}
    </div>
  );
}

export function userInitials(name: string | undefined, email: string | undefined): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "?";
}
