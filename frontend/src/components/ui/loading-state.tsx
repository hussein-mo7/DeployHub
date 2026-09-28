import { cn } from "@/lib/utils";

type SpinnerSize = "sm" | "md" | "lg";

const spinnerSizes: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-9 w-9 border-2",
  lg: "h-12 w-12 border-[3px]",
};

/** Accessible ring spinner (primary accent). */
export function LoadingSpinner({
  size = "md",
  className,
}: {
  size?: SpinnerSize;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "animate-spin rounded-full border-primary/25 border-t-primary",
        spinnerSizes[size],
        className,
      )}
    />
  );
}

/** Centered loader for app boot, route guards, and full pages. */
export function PageLoadingState({
  label = "Loading",
  description,
  fullScreen = false,
  className,
}: {
  label?: string;
  description?: string;
  fullScreen?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-5 px-6 py-16",
        fullScreen && "min-h-screen bg-background",
        className,
      )}
    >
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary/15 border-t-primary" />
        <div
          className="absolute inset-[22%] animate-spin rounded-full border-2 border-primary/10 border-b-primary/55"
          style={{ animationDirection: "reverse", animationDuration: "1.1s" }}
        />
      </div>
      <div className="max-w-xs text-center">
        <p className="text-sm font-medium tracking-tight text-foreground">{label}</p>
        {description ? (
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Inline block loader for cards, tabs, and panels. */
export function SectionLoadingState({
  label = "Loading",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-6",
        className,
      )}
    >
      <LoadingSpinner size="sm" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

/** Compact rows for side panels, tables, and activity feeds. */
export function InlineListLoadingSkeleton({
  rows = 3,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-3 rounded-md border border-border/40 px-3 py-2.5"
        >
          <div className="h-2.5 w-24 shrink-0 rounded bg-muted" />
          <div className="h-2.5 flex-1 rounded bg-muted/70" />
          <div className="hidden h-6 w-16 rounded-full bg-muted/80 sm:block" />
        </div>
      ))}
    </div>
  );
}

/** Key/value table placeholder (environment variables, etc.). */
export function TableLoadingSkeleton({
  rows = 3,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)} aria-busy="true" aria-label="Loading table">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex animate-pulse gap-3 rounded-md border border-border/40 p-3"
        >
          <div className="h-4 w-28 shrink-0 rounded bg-muted" />
          <div className="h-4 flex-1 rounded bg-muted/70" />
        </div>
      ))}
    </div>
  );
}

/** Placeholder rows while list queries resolve. */
export function ListLoadingSkeleton({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)} aria-busy="true" aria-label="Loading list">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-4 rounded-lg border border-border/50 bg-card px-4 py-4"
        >
          <div className="h-10 w-10 shrink-0 rounded-md bg-muted" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-1/3 max-w-[140px] rounded bg-muted" />
            <div className="h-3 w-2/3 max-w-[220px] rounded bg-muted/80" />
          </div>
          <div className="hidden h-6 w-16 rounded-full bg-muted sm:block" />
        </div>
      ))}
    </div>
  );
}

/** Spinner for buttons (replaces ad-hoc Loader2). */
export function ButtonSpinner({ className }: { className?: string }) {
  return <LoadingSpinner size="sm" className={cn("shrink-0", className)} />;
}
