import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { pagePaddingX } from "@/components/layout/PageContent";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
}

export function Header({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 shrink-0 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div
        className={cn(
          "flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between sm:py-5",
          pagePaddingX,
        )}
      >
        <div className="min-w-0 space-y-1">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="mb-1">
              <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                {breadcrumbs.map((item, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  return (
                    <li key={`${item.label}-${index}`} className="flex items-center gap-1">
                      {index > 0 && (
                        <ChevronRight className="h-3 w-3 shrink-0 opacity-50" aria-hidden />
                      )}
                      {item.to && !isLast ? (
                        <Link
                          to={item.to}
                          className="hover:text-foreground transition-colors"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <span className={cn(isLast && "font-medium text-foreground")}>
                          {item.label}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          )}
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="text-sm leading-relaxed text-muted-foreground sm:max-w-3xl">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
