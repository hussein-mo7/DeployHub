import { cn } from "@/lib/utils";
import type { DeploymentStatus } from "@/types/deployments.types";

const statusConfig: Record<DeploymentStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Pending",
    className: "bg-muted text-muted-foreground",
  },
  QUEUED: {
    label: "Queued",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  },
  RUNNING: {
    label: "Running",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  },
  SUCCESS: {
    label: "Success",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  FAILED: {
    label: "Failed",
    className: "bg-destructive/15 text-destructive",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
};

interface DeploymentStatusBadgeProps {
  status: DeploymentStatus;
  className?: string;
}

export function DeploymentStatusBadge({ status, className }: DeploymentStatusBadgeProps) {
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
