import { BRAND_NAME, BRAND_TAGLINE } from "@/constants/brand";
import { LogoMark } from "@/components/layout/LogoMark";
import { cn } from "@/lib/utils";

interface AppBrandProps {
  collapsed?: boolean;
  className?: string;
}

export function AppBrand({ collapsed, className }: AppBrandProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-1", className)}>
      <LogoMark />
      {!collapsed && (
        <div className="min-w-0 truncate">
          <p className="truncate text-sm font-semibold tracking-tight text-foreground">{BRAND_NAME}</p>
          <p className="truncate text-[11px] text-muted-foreground">{BRAND_TAGLINE}</p>
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
