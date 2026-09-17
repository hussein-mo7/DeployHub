import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Full-width page body with consistent horizontal padding (no max-width cap). */
export function PageContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full space-y-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Match `PageContent` horizontal padding on sticky headers. */
export const pagePaddingX = "px-4 sm:px-6 lg:px-8";
