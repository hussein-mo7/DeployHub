import { cn } from "@/lib/utils";
import type { ServerStatus } from "@/types/servers.types";

const statusConfig: Record<
  ServerStatus,
  { label: string; className: string }
> = {
  ONLINE: {
    label: "Online",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  OFFLINE: {
    label: "Offline",
    className: "bg-muted text-muted-foreground",
  },
  UNREGISTERED: {
    label: "Unregistered",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
  CONNECTING: {
    label: "Connecting",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  },
  UNHEALTHY: {
    label: "Unhealthy",
    className: "bg-destructive/15 text-destructive",
  },
};

interface ServerStatusBadgeProps {
  status: ServerStatus;
  className?: string;
}

export function ServerStatusBadge({ status, className }: ServerStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
