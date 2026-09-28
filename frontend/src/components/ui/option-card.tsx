import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface OptionCardProps {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  badge?: ReactNode;
  disabled?: boolean;
  className?: string;
}

/** Selectable card for choosing one option from a small set (radio semantics). */
export function OptionCard({
  selected,
  onSelect,
  title,
  description,
  icon: Icon,
  badge,
  disabled,
  className,
}: OptionCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "group relative flex w-full items-start gap-3 rounded-xl border bg-card p-4 text-left transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected
          ? "border-primary bg-primary/[0.04] ring-1 ring-primary"
          : "border-border hover:border-primary/40 hover:bg-muted/30",
        disabled && "cursor-not-allowed opacity-50 hover:border-border hover:bg-card",
        className,
      )}
    >
      {Icon && (
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
            selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {badge}
        </span>
        {description ? (
          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          selected ? "border-primary" : "border-muted-foreground/40",
        )}
      >
        {selected && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
      </span>
    </button>
  );
}

export function RecommendedBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
      Recommended
    </span>
  );
}
