import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Section heading inside a page — no extra card wrapper. */
export function PageSectionHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

/** Vertical stack for page content blocks (full width of main column). */
export function PageSections({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex w-full flex-col gap-10", className)}>{children}</div>;
}

export function PageSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn("w-full space-y-6", className)}>{children}</section>;
}

/** Sidebar + main column that fills the app content area (Settings-style). */
export function PageSplitLayout({
  sidebar,
  children,
  className,
}: {
  sidebar: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid w-full flex-1 border-t border-border lg:grid-cols-[minmax(220px,260px)_1fr]",
        className,
      )}
    >
      <aside className="border-b border-border bg-muted/20 lg:border-b-0 lg:border-r">{sidebar}</aside>
      <div className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
    </div>
  );
}
