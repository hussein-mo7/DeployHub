import * as React from "react";
import { cn } from "@/lib/utils";

export const inputClassName =
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-base text-foreground shadow-none sm:text-sm placeholder:text-muted-foreground/60 hover:border-foreground/20 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:border-border/80 disabled:bg-muted/40 disabled:text-muted-foreground";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input type={type} className={cn(inputClassName, className)} ref={ref} {...props} />
  ),
);
Input.displayName = "Input";
