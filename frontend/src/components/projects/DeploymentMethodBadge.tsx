import { cn } from "@/lib/utils";
import type { DeploymentMethod } from "@/types/projects.types";

const methodConfig: Record<
  DeploymentMethod,
  { label: string; className: string }
> = {
  DOCKERFILE: {
    label: "Dockerfile",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  },
  COMPOSE: {
    label: "Compose",
    className: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  },
  IMAGE: {
    label: "Image",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
};

interface DeploymentMethodBadgeProps {
  method: DeploymentMethod;
  className?: string;
}

export function DeploymentMethodBadge({ method, className }: DeploymentMethodBadgeProps) {
  const config = methodConfig[method];

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
