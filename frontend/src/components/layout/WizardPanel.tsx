import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Focused wizard column on the main canvas — border only, no page-level card shadow. */
export function WizardPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-background", className)}>
      {children}
    </div>
  );
}

export function WizardPanelHeader({
  title,
  description,
  icon,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="border-b border-border/70 px-6 py-5">
      {icon ? <div className="mb-3">{icon}</div> : null}
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function WizardPanelBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("space-y-5 p-6", className)}>{children}</div>;
}

export function WizardPanelFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function WizardAside({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <aside className={cn("rounded-lg border border-border bg-muted/20", className)}>
      {title ? (
        <p className="border-b border-border/60 px-5 py-3 text-sm font-semibold text-foreground">{title}</p>
      ) : null}
      <div className={cn(!title && "p-5", title && "space-y-4 p-5 pt-4")}>{children}</div>
    </aside>
  );
}
