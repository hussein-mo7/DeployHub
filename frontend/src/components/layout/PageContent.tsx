import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Page body padding inside the main canvas. Do not wrap this in an extra Card — the shell is already the surface.
 */
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
        "w-full min-h-0 flex-1 space-y-8 px-4 py-5 sm:px-6 lg:px-8 lg:py-7",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Match `PageContent` horizontal padding on sticky headers. */
export const pagePaddingX = "px-4 sm:px-6 lg:px-8";
